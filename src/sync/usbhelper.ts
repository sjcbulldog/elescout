import { usb, WebUSBDevice } from "usb";
import winston from "winston";

export class USBHelper {
  static readonly USBSendPipe = 0x02;
  static readonly USBRecvPipe = 0x83;
  static readonly USBCableVID = 0x67b;
  static readonly USBCablePID = 0x25a1;

  private name_ : string ;
  private logger_: winston.Logger;
  private xfersize_: number = 512;
  private xferdata_?: Uint8Array;
  private xferinprog_?: Uint8Array;
  private webtarget_?: WebUSBDevice;
  private devices_: usb.Device[] = [];

  constructor(name: string, logger: winston.Logger) {
    this.name_ = name ;
    this.logger_ = logger;
  }

  public close() {
    this.webtarget_?.close() ;
  }

  public openUSBDevice(addr: number[]): Promise<WebUSBDevice> {
    let ret: Promise<WebUSBDevice> = new Promise<WebUSBDevice>(async (resolve, reject) => {
      let list = usb.getDeviceList();
      let target: usb.Device | undefined;
      for (let dev of list) {
        if (dev.deviceDescriptor.idVendor === USBHelper.USBCableVID && dev.deviceDescriptor.idProduct === USBHelper.USBCablePID) {
          this.devices_.push(dev);
          if (addr.length === 0 || this.compareAddress(dev.portNumbers, addr)) {
            target = dev;
          }
        }
      }

      if (!target) {
        if (this.devices_.length === 0) {
          reject(new Error(this.name_ + ":no USB transfer cables found"));
        } else if (this.devices_.length === 1) {
          target = this.devices_[0];
        } else {
          //
          // More than one cable
          //
          reject(
            new Error(
              this.name_ + ":multiple USB transfer cabled found, but no specific address provided"
            )
          );
        }
      }

      try {
        this.logger_.debug(this.name_ + ':found target USB device', target) ;
        this.webtarget_ = await WebUSBDevice.createInstance(target!);
        await this.webtarget_!.open();
        this.webtarget_.reset();
        this.webtarget_.claimInterface(0) ;
        this.webtarget_.reset()
          .then(() => {
            resolve(this.webtarget_!) ;
          })
          .catch((err) => {
            reject(err) ;
          }) ;
      } catch (err) {
        reject(err);
      }
    });

    return ret;
  }

  public sendBlock(data: Uint8Array): Promise<void> {
    this.logger_.debug(this.name_ + ":sending " + data.length + " bytes of usb data");
    let ret = new Promise<void>(async (resolve, reject) => {
      this.xferdata_ = data;
      this.xferinprog_ = undefined;

      while (this.xferdata_) {
        try {
          await this.sendNextBlock();
        } catch (err) {
          reject(err);
        }
      }

      resolve();
    });

    return ret;
  }

  public receiveBlock(): Promise<Uint8Array> {
    let ret = new Promise<Uint8Array>((resolve, reject) => {
      this.webtarget_!.transferIn(USBHelper.USBRecvPipe, this.xfersize_)
        .then((result: USBInTransferResult) => {
          if (result.status && result.status == "ok" && result.data) {
            let data: Uint8Array = new Uint8Array(result.data.byteLength);
            for (let i = 0; i < result.data.byteLength; i++) {
              data[i] = result.data.getUint8(i);
            }
            this.logger_.debug(this.name_ + ":received " + data.length + " bytes of usb data");
            resolve(data);
          }
          else {
            console.log(result.status) ;
          }
        })
        .catch((err) => {
          reject(err);
        });
    });

    return ret;
  }

  private flush() {

  }

  private sendNextBlock(): Promise<void> {
    let ret = new Promise<void>((resolve, reject) => {
      if (this.xferdata_!.length > this.xfersize_) {
        this.xferinprog_ = this.xferdata_!.slice(0, 511);
        let remaining: Uint8Array = this.xferdata_!.slice(512);
        this.xferdata_ = remaining;
      } else {
        this.xferinprog_ = this.xferdata_;
        this.xferdata_ = undefined;
      }

      this.webtarget_!.transferOut(USBHelper.USBSendPipe, this.xferinprog_!)
        .then((result) => {
          resolve();
        })
        .catch((err) => {
          this.logger_.error(this.name_ + ':transferOut failed', err) ;
          reject(err) ;
        });
    });

    return ret;
  }

  private compareAddress(a: number[], b: number[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (a[i] != b[i]) {
        return false;
      }
    }

    return true;
  }
}

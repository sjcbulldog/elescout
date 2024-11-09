import winston from "winston";
import { SyncClient } from "./syncclient";
import { Packet } from "./packet";
import { usb, WebUSBDevice } from "usb";
import { USBHelper } from "./usbhelper";

export class USBClient extends SyncClient {
    private addr_: number[] ;
    private helper_? : USBHelper ;

    constructor(logger: winston.Logger, addr: number[]) {
        super(logger) ;
        this.addr_ = addr ;
    }

    public connect() : Promise<void> {
        let ret = new Promise<void>(async (resolve, reject) => {
            this.helper_ = new USBHelper('client', this.logger_) ;
            this.helper_.openUSBDevice(this.addr_)
                .then((dev: WebUSBDevice) => {
                    this.helper_?.receiveBlock()
                        .then((data: Uint8Array) => {
                            this.extractPacket(data) ;
                        })
                        .catch((err) => {
                            reject(err) ;
                        }) ;
                    resolve() ;
                })
                .catch((err) => {
                    reject(err) ; 
                })
        }) ;
        return ret ;
    }

    public send(p: Packet) : Promise<void> {
        return this.helper_!.sendBlock(this.convertToBytes(p)) ;
    }

    public name() : string {
        return "USBClient" ;
    }

    public close() : void {
        this.helper_?.close() ;
    }
}
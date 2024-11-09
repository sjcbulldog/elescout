import winston from "winston";
import { SyncServer } from "./syncserver";
import { Packet } from "./packet";
import { usb, WebUSBDevice } from "usb";
import { USBHelper } from "./usbhelper";

export class USBSyncServer extends SyncServer {
    static readonly USBCableVID = 0x67b ;
    static readonly USBCablePID = 0X25a1 ;
    static readonly USBSendPipe = 2 ;
    static readonly USBRecvPipe = 3 ;

    private devices_: usb.Device[] = [] ;
    private webtarget_? : WebUSBDevice ;
    private helper_? : USBHelper ;

    constructor(logger: winston.Logger) {
        super(logger) ;

        this.logger_ = logger ;
    }
    
    public async init(arg: any) : Promise<void> {
        let addr: number[] = arg ;
        let ret = new Promise<void>(async (resolve, reject) => {
            this.helper_ = new USBHelper('server', this.logger_) ;
            this.helper_.openUSBDevice(addr)
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

    public name() : string {
        return "USBSyncServer" ;
    }

    public send(p: Packet) {
        this.helper_!.sendBlock(this.convertToBytes(p)) ;
    }

    private compareAddress(a: number[], b: number[]) : boolean {
        if (a.length !== b.length) {
            return false ;
        }

        for(let i = 0 ; i < a.length ; i++) {
            if (a[i] != b[i]) {
                return false ;
            }
        }

        return true ;
    }
}
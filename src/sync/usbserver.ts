import winston from "winston";
import { SyncServer } from "./syncserver";
import { Packet } from "./Packet";

export class USBSyncServer extends SyncServer {
    constructor(logger: winston.Logger) {
        super(logger) ;

        this.logger_ = logger ;
    }
    
    public async init() : Promise<void> {
        let ret: Promise<void> = new Promise<void>((resolve, reject) => {
        }) ;
        return ret ;
    }

    public name() : string {
        return "USBSyncServer" ;
    }

    public send(p: Packet) {
    }
}
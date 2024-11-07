import winston from "winston";
import { Packet } from "./Packet";
import { PacketCompressionNone } from "./packettypes";
import { EventEmitter } from 'events';
import { SyncBase } from "./syncbase";

export abstract class SyncServer extends SyncBase
{
    constructor(logger: winston.Logger) {
        super(logger) ;
    }

    public abstract init() : Promise<void> ;
    public abstract name() : string ;
    public abstract send(p: Packet) : void ;
}
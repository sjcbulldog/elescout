import { EventEmitter } from 'events';
import { Packet } from './Packet';
import { SyncBase } from './syncbase';
import winston from 'winston';

export abstract class SyncClient extends SyncBase {
    constructor(logger: winston.Logger) {
        super(logger) ;
    }

    public abstract connect() : Promise<void> ;
    public abstract send(p: Packet) : void ;
    public abstract name() : string ;
}

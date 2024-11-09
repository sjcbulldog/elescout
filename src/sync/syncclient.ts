import { EventEmitter } from 'events';
import { Packet } from './packet';
import { SyncBase } from './syncbase';
import winston from 'winston';

export abstract class SyncClient extends SyncBase {
    constructor(logger: winston.Logger) {
        super(logger) ;
    }

    public abstract connect() : Promise<void> ;
    public abstract send(p: Packet) : Promise<void>
    public abstract name() : string ;
    public abstract close() : void ;
}

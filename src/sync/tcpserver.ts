import * as net from 'net' ;
import { SyncServer } from './syncserver';
import winston from 'winston';
import { Packet } from './Packet';

export class TCPSyncServer extends SyncServer {
    private static portNumber: number = 45455 ;

    private server_? : net.Server ;

    
    public constructor(logger: winston.Logger) {
        super(logger) ;
    }

    public async send(p: Packet) : Promise<void> {
    }

    public async init() : Promise<void> {
        let ret: Promise<void> = new Promise<void>((resolve, reject) => {
            this.server_ = new net.Server((socket) => { this.connected(socket) ; }) ;
            this.server_.listen(TCPSyncServer.portNumber, '0.0.0.0', 2, () => {
                this.logger_.info('TCPSyncServer: listening for connections on port ' + TCPSyncServer.portNumber) ;
                resolve() ;
            }) ;
        }) ;
        return ret ;
    }

    public name() : string {
        return "TCPSyncServer" ;
    }

    private connected(socket: net.Socket) {
        socket.on('connected', (client: net.Socket) => {
            this.logger_.info('TCPSyncServer: client connected', { 
                address: client.address,
                family: client.remoteFamily
            }) ;
        }) ;

        socket.on('close', () => { 
            console.log('SyncServer: close') ;
        }) ;

        socket.on('error', (err: Error) => {
            console.log('SyncServer: error') ;
        }) ;

        socket.on('data', (data) => {
            this.extractPacket(data) ;

        }) ;
    }
}


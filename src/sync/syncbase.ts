import { EventEmitter } from 'events';
import { Packet } from './Packet';
import { PacketCompressionNone, PacketNameMap } from './packettypes';
import { SyncServer } from './syncserver';
import winston from 'winston';

export class SyncBase extends EventEmitter {
    protected static minPacketSize = 12;

    private buffer_? : Uint8Array ;
    protected logger_ : winston.Logger ;

    constructor(logger: winston.Logger) {
        super() ;

        this.logger_ = logger ;
    }

    //
    // Convert a byte array to a packet and fire a packet event.  Return the
    // bytes remaining in the buffer.
    //
    protected extractPacket(data: Uint8Array) {
        let ret: Uint8Array | undefined ;

        if (!this.buffer_) {
            this.buffer_ = data ;
        }
        else {
            if (data.length) {
                let buf: Uint8Array = new Uint8Array(this.buffer_.length + data.length) ;
                buf.set(this.buffer_) ;
                buf.set(data, this.buffer_.length) ;
                this.buffer_ = buf ;
            }
        }

        if (this.buffer_.length >= SyncBase.minPacketSize) {
            let ptype = (data[0] << 0) | (data[1] << 8) | (data[2] << 16) | (data[3] << 24) ;
            let len = (data[4] << 0) | (data[5] << 8) | (data[6] << 16) | (data[7] << 24) ;
            let comptype = (data[8] << 0) | (data[9] << 8) ;

            if (comptype === PacketCompressionNone) {
                //
                // The data is not compressed, we are good to go.
                //
            }
            else {
                let err: Error = new Error('invalid compression type') ;
                this.emit('error', err) ;
            }

            if (data.length >= len + 10 + 2) {
                let csum = (data[len + 10] << 0) + (data[len+11] << 8) ;
                if (this.computeSum16(data, 10, len) != csum) {
                    let err: Error = new Error('invalid packet checksum') ;
                    this.emit('error', err) ;
                }
                else {
                    let p = new Packet(ptype, data.slice(10, 10 + len)) ;
                    this.logPacket('received', p) ;
                    this.emit('packet', p) ;
                    ret = data.slice(12 + len) ;
                }
            }
        }

        this.buffer_ = ret ;
    }

    //
    // Convert a packet to a byte array
    //
    protected convertToBytes(p: Packet) : Uint8Array {
        this.logPacket('sending', p) ;

        let buffer: Uint8Array = new Uint8Array(12 + p.data_.length) ;
        buffer[0] = (p.type_ >> 0) & 0xff ;
        buffer[1] = (p.type_ >> 8) & 0xff ;
        buffer[2] = (p.type_ >> 16) & 0xff ;
        buffer[3] = (p.type_ >> 24) & 0xff ;
        buffer[4] = (p.data_.length >> 0) & 0xff ;
        buffer[5] = (p.data_.length >> 8) & 0xff ;
        buffer[6] = (p.data_.length >> 16) & 0xff ;
        buffer[7] = (p.data_.length >> 24) & 0xff ;

        let comp = PacketCompressionNone ;
        buffer[8] = (comp >> 0) & 0xff ;
        buffer[9] = (comp >> 8) & 0xff ;

        buffer.set(p.data_, 10) ;

        let csum = this.computeSum16(p.data_, 0, p.data_.length) ;
        buffer[p.data_.length + 10] = (csum >> 0) & 0xff;
        buffer[p.data_.length + 11] = (csum >> 8) & 0xff ;

        return buffer ;
    }

    private packetTypeName(type: number) : string | undefined {
        let ret: string | undefined ;

        if (type < PacketNameMap.length) {
            ret = PacketNameMap[type] ;
        }

        return ret ;
    }

    private logPacket(text: string, p: Packet) {
        let msg: string = text + ':' + this.packetTypeName(p.type_) + ':' + p.data_.length + ':' ;
        let index = 0 ; 
        while (index < p.data_.length) {
                msg += ' ' ;
            msg += p.data_[index].toString(16) ;
            index++ ;
        }

        this.logger_.info(msg) ;
    }

    private computeSum16(data: Uint8Array, start: number, length: number) : number {
        let sum: number = 0 ;
        let lencopy: number = length ;
    
        while (length-- > 0) {
            sum = (sum + data[start++]) & 0xffff ;
        }

        this.logger_.silly('checksum computed, ' + lencopy + ', bytes, value ' + sum.toString(16)) ;
    
        return sum ;
    }
}

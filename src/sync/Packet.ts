import { PacketType } from "./packettypes";


export class Packet {
    public type_ : PacketType ;
    public data_: Uint8Array ;

    constructor(type: number, data?: Uint8Array) {
        this.type_ = type ;

        if (data) {
            this.data_ = data ;
        }
        else {
            this.data_ = new Uint8Array(0) ;
        }
    }

    public payloadAsString() : string {
        return this.data_.toString() ;
    }
}

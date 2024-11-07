export class Packet {
    public type_ : number ;
    public data_: Uint8Array ;

    constructor(type: number, data: Uint8Array) {
        this.type_ = type ;
        this.data_ = data ;
    }
}

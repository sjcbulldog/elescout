export class Packet {
    public type_ : number ;
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
}

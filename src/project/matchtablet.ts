
export class MatchTablet {
    public type: string ;
    public matchnumber: number ;
    public set: number ;
    public teamnumber: number ;
    public tablet: string ;

    constructor(type: string, number: number, set: number, teamno: number, tablet: string) {
        this.type = type ;
        this.matchnumber = number ;
        this.set = set ;
        this.teamnumber = teamno ;
        this.tablet = tablet ;
    }
}
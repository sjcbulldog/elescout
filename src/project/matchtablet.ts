
export class MatchTablet {
    public type: string ;
    public matchno: number ;
    public setno: number ;
    public teamkey: string ;
    public tablet: string ;

    constructor(type: string, number: number, set: number, teamkey: string, tablet: string) {
        this.type = type ;
        this.matchno = number ;
        this.setno = set ;
        this.teamkey = teamkey ;
        this.tablet = tablet ;
    }
}

export class MatchTablet {
    public comp_level: string ;
    public match_number: number ;
    public set_number: number ;
    public teamkey: string ;
    public tablet: string ;
    public alliance: string ;

    constructor(type: string, number: number, set: number, alliance: string, teamkey: string, tablet: string) {
        this.comp_level = type ;
        this.match_number = number ;
        this.set_number = set ;
        this.alliance = alliance ;
        this.teamkey = teamkey ;
        this.tablet = tablet ;
    }
}
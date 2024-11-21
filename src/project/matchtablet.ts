
export class MatchTablet {
    public comp_level: string ;
    public match_number: number ;
    public set_number: number ;
    public teamkey: string ;
    public tablet: string ;

    constructor(type: string, number: number, set: number, teamkey: string, tablet: string) {
        this.comp_level = type ;
        this.match_number = number ;
        this.set_number = set ;
        this.teamkey = teamkey ;
        this.tablet = tablet ;
    }
}
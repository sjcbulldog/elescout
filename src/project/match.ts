export class MatchAlliance {
    public teams_ : string[] ;
    public surragate_teams_: string[] ;
    public dq_teams_ : string[] ;

    public constructor() {
        this.teams_ = [] ;
        this.surragate_teams_ = [] ;
        this.dq_teams_ = [] ;
    }
}

export class MatchResult {
    public winner_ : string ;
    public red_score_breakdown_ : Map<string, any> ;
    public blue_score_breakdown_ : Map<string, any> ;
    public red_score_ : number ;
    public blue_score_ : number ;

    constructor() {
        this.winner_ = "" ;
        this.red_score_ = -1 ;
        this.blue_score_ = -1 ;
        this.red_score_breakdown_ = new Map<string, any>() ;
        this.blue_score_breakdown_ = new Map<string, any>() ;        
    }
}

export class Match {
    public key_ : string ;
    public comp_level_ : string ;
    public set_number_: number ;
    public match_number_ : number ;
    public red_alliance_? : MatchAlliance ;
    public blue_alliance_? : MatchAlliance ;
    public results_? : MatchResult ;

    constructor(key: string, complevel: string, setno: number, matchno: number) {
        this.key_ = key ;
        this.comp_level_ = complevel ;
        this.set_number_ = setno ;
        this.match_number_ = matchno ;
    }
}

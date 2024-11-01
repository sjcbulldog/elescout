import { ClientRequest, IncomingMessage, net } from 'electron';
import * as https from 'https' ;
import { Match, MatchAlliance } from '../project/match';
import { Team } from '../project/team';
import { FRCEvent } from '../project/frcevent';
import { ObjectFlags } from 'typescript';

export class BlueAlliance {

    private host_ : string ;
    private prefix_ : string ;
    private apikey_ : string ;
    private current_season_ : number ;
    private max_season_ : number ;
    private req_? : ClientRequest ;

    constructor() {
        this.host_ = "www.thebluealliance.com";
        this.prefix_ = "/api/v3" ;
        this.apikey_ = "cgbzLmpXlA5GhIew3E4xswwLqHOm4j0hQ1Mizvg71zkuQZIazcXgf3dd8fguhpxC";
        this.current_season_ = -1 ;
        this.max_season_ = -1 ;
    }

    public async init() : Promise<boolean> {
        let ret: Promise<boolean> = new Promise<boolean>((resolve, reject) => {
            this.request('/status')
                .then((obj) => {
                    if (obj.current_season) {
                        this.current_season_ = obj.current_season ;
                    }

                    if (obj.max_season) {
                        this.max_season_ = obj.max_season ;
                    }

                    resolve(!obj.is_datafeed_down) ;
                })
                .catch((err) => {
                    reject(err) ;                    
                })
        }) ;

        return ret;
    }

    public async getEvents(year ?:number) : Promise<FRCEvent[]> {
        if (!year) {
            year = this.current_season_ ;
        }
        
        let ret: Promise<FRCEvent[]> = new Promise<FRCEvent[]>((resolve, reject) => {
            let query = "/events/" + year + "/simple" ;
            this.request(query)
                .then((obj) => {
                    let result : FRCEvent[] = [] ;
                    for(let ev of obj) {
                        if (ev.key && ev.name) {
                            let frcev = new FRCEvent(ev.key, ev.name) ;
                            if (ev.city) {
                                frcev.city = ev.city ;
                            }

                            if (ev.country) {
                                frcev.country = ev.country ;
                            }

                            if (ev.district) {
                                frcev.district = ev.district ;
                            }

                            if (ev.end_date) {
                                frcev.end_date = ev.end_date;
                            }

                            if (ev.event_code) {
                                frcev.event_code = ev.event_code ;
                            }

                            if (ev.event_type) {
                                frcev.event_type = ev.event_type ;
                            }

                            if (ev.start_date) {
                                frcev.start_date = ev.start_date ;
                            }

                            if (ev.state_prov) {
                                frcev.state_prov = ev.state_prov ;
                            }
                            result.push(frcev) ;
                        }
                    }

                    resolve(result) ;

                    console.log(obj) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;

        return ret;
    }

    private extractBreakdown(bd: Map<String, number>, obj: any) {
        for(let key of Object.keys(obj)) {
            const v = obj[key] ;
            bd.set(key, v);
        }
    }

    public async fakeGetMatchesNone(evkey: string) : Promise<Match[]> {
        let ret: Promise<Match[]> = new Promise<Match[]>((resolve, reject) => {
            resolve([]) ;
        }) ;

        return ret;
    }

    public async fakeGetMatchesPartial(evkey: string) : Promise<Match[]> {
        let ret: Promise<Match[]> = new Promise<Match[]>((resolve, reject) => {
            
        }) ;

        return ret;
    }

    public async getMatches(evkey: string) : Promise<Match[]> {
        let ret: Promise<Match[]> = new Promise<Match[]>((resolve, reject) => {
            let query = "/event/" + evkey + "/matches" ;
            this.request(query)
                .then((obj) => {
                    let result : Match[] = [] ;
                    for(let t of obj) {
                        let m: Match = new Match(t.key, t.comp_level, t.set_number, t.match_number) ;

                        m.red_alliance_ = new MatchAlliance() ;
                        for(let k of t.alliances.red.team_keys) {
                            m.red_alliance_.teams_.push(k) ;
                        }

                        for(let k of t.alliances.red.surrogate_team_keys) {
                            m.red_alliance_.surragate_teams_.push(k) ;
                        }  
                        
                        for(let k of t.alliances.red.dq_team_keys) {
                            m.red_alliance_.dq_teams_.push(k) ;
                        }     

                        if (t.alliances.red.score) {
                            m.red_alliance_.score_ = t.alliances.red.score ;
                        }
                        
                        m.blue_alliance_ = new MatchAlliance() ;
                        for(let k of t.alliances.blue.team_keys) {
                            m.blue_alliance_.teams_.push(k) ;
                        }

                        for(let k of t.alliances.blue.surrogate_team_keys) {
                            m.blue_alliance_.surragate_teams_.push(k) ;
                        }  
                        
                        for(let k of t.alliances.blue.dq_team_keys) {
                            m.blue_alliance_.dq_teams_.push(k) ;
                        }                         

                        if (t.alliances.blue.score) {
                            m.blue_alliance_.score_ = t.alliances.blue.score ;
                        }           
                        
                        if (t.winning_alliance) {
                            m.winner_ = t.winning_alliance ;
                        }

                        if (t.score_breakdown) {
                            if (t.score_breakdown.red) {
                                this.extractBreakdown(m.red_score_breakdown_, t.score_breakdown.red) ;
                            }

                            if (t.score_breakdown.blue) {
                                this.extractBreakdown(m.blue_score_breakdown_, t.score_breakdown.blue) ;
                            }              
                        }          

                        result.push(m)
                    } 
                    
                    resolve(result) ;
                })
                .catch((err) => {
                    reject(err) ;
                })
        }) ;

        return ret ;
    }

    public async getTeams(evkey:string) : Promise<Team[]> {
        let ret: Promise<Team[]> = new Promise<Team[]>((resolve, reject) => {
            let query = "/event/" + evkey + "/teams" ;
            this.request(query)
                .then((obj) => {
                    let result : Team[] = [] ;
                    for(let t of obj) {
                        let team: Team = new Team(t.key, t.team_number, t.name, t.nickname, t.city, t.state_prov, t.country,
                                                  t.school_name, t.address, t.postal_code, t.location_name, t.lng, t.lat) ;
                        result.push(team) ;
                    }       

                    resolve(result) ;             
                })
                .catch((err) => {
                    reject(err) ;
                })
        }) ;

        return ret ;        
    }

    private appendToUint8Array(original: Uint8Array, dataToAdd: Uint8Array) {
        const result = new Uint8Array(original.length + dataToAdd.length);
        result.set(original);
        result.set(dataToAdd, original.length);
        return result;
      }

    private async request(res: string) : Promise<any> {
        let ret: Promise<any> = new Promise<any>((resolve, reject) => {
            let hdrs = {
                "X-TBA-Auth-Key" : this.apikey_
            } ;

            let req: ClientRequest = net.request(
                {
                    method: 'GET',
                    protocol: 'https:',
                    hostname: this.host_,
                    port: 443,
                    path: this.prefix_ + res,
                    redirect: 'follow',
                    headers: hdrs
                }) ;

            req.on('response', (response) => {
                let buffer: Uint8Array = new Uint8Array(0) ;
                response.on('data', (data) => {
                    buffer = this.appendToUint8Array(buffer, data) ;
                }) ;

                response.on('end', () => {
                    const decoder = new TextDecoder();
                    const string = decoder.decode(buffer) ;
                    const obj = JSON.parse(string) ;
                    resolve(obj) ; 
                }) ;
            }) ;

            req.on('abort', () => {
                reject(new Error("request aborted")) ;
            }) ;

            req.on('close', () => {
            })

            req.on('error', (err) => { 
                reject(err) ;
            }) ;

            req.on('finish', () => {
            })       
            
            req.on('login', (ai, cb) => {
                reject(new Error("login required")) ;
            })  

            req.end() ;
        }) ;

        return ret ;
    }
}


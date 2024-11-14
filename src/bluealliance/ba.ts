import { ClientRequest, IncomingMessage, net } from 'electron';
import * as https from 'https' ;
import { ObjectFlags } from 'typescript';
import { DataRecord } from '../model/datamodel';
import { BAEvent, BAMatch, BARankings, BATeam } from './badata';

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

    public async getEvents(year ?:number) : Promise<BAEvent[]> {
        if (!year) {
            year = this.current_season_ ;
        }
        
        let ret: Promise<BAEvent[]> = new Promise<BAEvent[]>((resolve, reject) => {
            let query = "/events/" + year + "/simple" ;
            this.request(query)
                .then((obj) => {
                    resolve(obj) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
        }) ;

        return ret;
    }

    public async getRankings(evkey: string) : Promise<BARankings[]> {
        let ret: Promise<BARankings[]> = new Promise<BARankings[]>((resolve, reject) => {
            let query = "/event/" + evkey + "/rankings" ;
            this.request(query)
                .then((rankings) => {
                    resolve(rankings) ;
                })
                .catch((err) => {
                    reject(err) ;
                }) ;
            }) ;
        return ret ;
    }

    public async getMatches(evkey: string) : Promise<BAMatch[]> {
        let ret: Promise<BAMatch[]> = new Promise<BAMatch[]>((resolve, reject) => {
            let query = "/event/" + evkey + "/matches" ;
            this.request(query)
                .then((obj) => {
                    resolve(obj) ;
                })
                .catch((err) => {
                    reject(err) ;
                });
            });

        return ret ;
    }

    public async getTeams(evkey:string) : Promise<BATeam[]> {
        let ret: Promise<BATeam[]> = new Promise<BATeam[]>((resolve, reject) => {
            let query = "/event/" + evkey + "/teams" ;
            this.request(query)
                .then((obj) => {
                    resolve(obj) ;             
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


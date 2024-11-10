import { BrowserWindow, Menu, MenuItem } from "electron";
import { SCBase } from "../base/scbase";
import { SyncClient } from "../sync/syncclient";
import { TCPClient } from "../sync/tcpclient";
import { Packet } from "../sync/packet";
import * as path from 'path' ;
import * as fs from 'fs' ;
import { PacketType } from "../sync/packettypes";

export class MatchInfo {
    public type_? : string ;
    public set_? : number ;
    public number_? : number ;
} ;

export class SCScoutInfo {
    public tablet_? : string ;
    public purpose_? : string ;
    public uuid_? : string ;
    public evname_? : string ;
    public teamform_? : any ;
    public matchform_? : any ;
    public teamlist_? : any[] ;
    public matchlist_? : any[] ;
    public results_? : any[] ;

    constructor() {
        this.results_ = [] ;
    }
}

export class SCScout extends SCBase {
    private static readonly last_event_file = "lastevent" ;

    private static readonly syncEvent: string = "sync-event" ;
    private static readonly resetTablet: string = "reset-tablet" ;

    private info_ : SCScoutInfo = new SCScoutInfo() ;

    private tcpHost_: string = "127.0.0.1" ;
    private tablets_?: any[] ;
    private conn_?: SyncClient ;
    private current_scout_? : string ;
    private next_scout_? : string ;

    public constructor(win: BrowserWindow) {
        super(win, 'scout') ;

        this.checkLastEvent() ;
    }
    
    public basePage() : string  {
        return "content/scscouter/scouter.html"
    }

    public sendNavData() : any {
        let treedata : any[] = [] ;

        if (this.info_.purpose_) {
            let navstuff ;
            if (this.info_.purpose_ === 'team' && this.info_.teamlist_) {
                navstuff = this.populateNavTeams() ;
            }
            else {
                navstuff = this.populateNavMatches() ;
            }
            treedata = [...treedata, ...navstuff] ;
        }
        this.sendToRenderer('send-nav-data', treedata);
    }

    public windowCreated() {
        this.win_.on('ready-to-show', () => {
            this.setViewString() ;
        }) ;
    }

    private populateNavTeams() : any[] {
        let ret : any[] = [] ;

        for(let t of this.info_.teamlist_!) {      
            if (t.tablet === this.info_.tablet_) {
                ret.push({type: 'item', command: 'st-' + t.team, title: "Team: " + t.team}) ;
            }
        }
        return ret ;
    }

    private mapMatchType(mtype: string) : number {
        let ret: number = -1 ;

        if (mtype === 'f') {
            ret = 3 ;
        }
        else if (mtype === 'sf') {
            ret = 2 ;
        }
        else {
            ret = 1 ;
        }

        return ret;
    }

    private sortCompFun(a: any, b: any) : number {
        let ret: number = 0 ;

        let atype = this.mapMatchType(a.type) ;
        let btype = this.mapMatchType(b.type) ;

        if (atype < btype) {
            ret = -1 ;
        }
        else if (atype > btype) {
            ret = 1 ;
        }
        else {
            if (a.matchnumber < b.matchnumber) {
                ret = -1 ;
            }
            else if (a.matchnumber > b.matchnumber) {
                ret = 1 ;
            }
            else {
                ret = 0 ;
            }
        }
        return ret ;
    }

    private populateNavMatches() : any[] {
        let ret : any[] = [] ;

        let ofinterest: any[] = [] ;
        for(let t of this.info_.matchlist_!) {
            if (t.tablet === this.info_.tablet_) {
                ofinterest.push(t) ;
            }
        }
        ofinterest.sort((a, b) => { return this.sortCompFun(a, b) ;}) ;

        for(let t of ofinterest) {
            if (t.tablet === this.info_.tablet_) {
                let numstr: string = t.teamnumber ;
                if (numstr.startsWith('frc')) {
                    numstr = numstr.substring(3);
                }
                let mtype:string = t.type ;
                
                let cmd: string = 'sm-' + t.type + '-' + t.set + '-' + t.matchnumber + '-' + numstr ;
                let title: string ;
                    if (mtype === 'sf') {
                    title = mtype.toUpperCase() + '-' + t.matchnumber + ' - ' + t.set + '-' + numstr ;
                } else {
                    title = mtype.toUpperCase() + '-' + t.matchnumber + ' - ' + numstr ;
                }
                ret.push({type: 'item', command: cmd, title: title}) ;
            }        
        }
        return ret ;
    }

    public executeCommand(cmd: string) : void {   
        if (cmd === SCScout.syncEvent) {
            this.syncClient(new TCPClient(this.logger_, this.tcpHost_)) ;
        }
        else if (cmd === SCScout.resetTablet) {
            this.info_.purpose_ = undefined ;
            this.info_.tablet_ = undefined ;
            this.info_.results_ = undefined ;
            this.info_.uuid_ = undefined ;
            this.info_.evname_ = undefined ;
            this.sendNavData() ;
            this.setView('empty') ;
        }
        else if (cmd.startsWith('st-')) {
            this.scoutTeam(cmd) ;
        }
        else if (cmd.startsWith('sm-')) {
            this.scoutMatch(cmd) ;
        }
    }

    //
    // Steps for the sequences below.
    //
    // executeCommand() is called with a command that starts with either
    //    'st-' : scout team
    //    'sm-' : scout match
    //
    // This causes scoutTeam() or scoutMatch() to be called.  If there is a previous
    // form being displayed, these methods request the results from the current form to
    // be returned.  These results are returned via the provideResults() method.  These
    // results are then stored so the are stored in the info_ field and this is saved to
    // the output file.  The method provideResults() then calls back into scoutTeam() or
    // scoutMatch() with the force flag set to true, so that we forms the team or match
    // view.
    //
    // The 'team-form' or 'match-form' request to the renderer view then causes the sendTeamForm()
    // or sendMatchForm() method to get called.
    //

    private scoutTeam(team: string, force: boolean = false) {
        if (this.current_scout_ && !force) {
            //
            // Get the result from the existing displayed
            // team and store the result in the info for the team
            //
            this.next_scout_ = team ;
            this.sendToRenderer('request-result') ;
        }
        else {
            this.sendToRenderer('send-nav-highlight', team) ;
            this.current_scout_ = team;
            this.setView('team-form') ;
        }
    }

    private scoutMatch(match: string, force: boolean = false) {
        if (this.current_scout_ && !force) {
            //
            // Get the result from the existing displayed
            // match and store the result in the info for the match
            //
            this.next_scout_ = match ;
            this.sendToRenderer('request-result') ;
        }
        else {
            this.sendToRenderer('send-nav-highlight', match) ;
            this.current_scout_ = match ;
            this.setView('match-form') ;
        }
    }

    public provideResults(res: any) {
        this.addResults(this.current_scout_!, res) ;
        this.writeEventFile() ;

        this.logger_.silly('provideResults:' + this.current_scout_, res) ;
        
        if (this.next_scout_?.startsWith('st-')) {
            this.scoutTeam(this.next_scout_!, true) ;
        }
        else {
            this.scoutMatch(this.next_scout_!, true) ;
        }
    }

    public sendTeamForm() {
        let ret = {
            formjson: null,
            errormsg: "",
        } ;

        if (this.info_.teamform_) {
            ret.formjson = this.info_.teamform_ ;
            this.sendToRenderer('send-team-form', ret) ;
        }

        let data: any = this.getResults(this.current_scout_!) ;
        this.logger_.silly('sendTeamForm/send-result-values: ' + this.current_scout_, data) ;
        if (data) {
            this.sendToRenderer('send-result-values', data) ;
        }
    }

    public sendMatchForm() {
        let ret = {
            formjson: null,
            errormsg: "",
        } ;

        if (this.info_.matchform_) {
            ret.formjson = this.info_.matchform_ ;
            this.sendToRenderer('send-match-form', ret) ;
        }

        let data: any = this.getResults(this.current_scout_!) ;
        this.logger_.silly('sendTeamForm/send-result-values: ' + this.current_scout_, data) ;
        if (data) {
            this.sendToRenderer('send-result-values', data) ;
        }
    }

    private getIndex(scout: string) : number {
        let ret: number = -1 ;

        if (this.info_.results_) {
            for(let i = 0 ; i < this.info_.results_.length ; i += 2) {
                let str: string = this.info_.results_[i] ;
                if (str === scout) {
                    ret = i + 1 ;
                    break ;
                }
            }
        }  

        return ret ;
    }

    private getResults(scout: string) : any {
        let ret = undefined ;
        let index = this.getIndex(scout) ;

        if (index != -1) {
            ret = this.info_.results_![index] ;
        }

        return ret ;
    }
    
    private addResults(scout: string, result: any) {
        let index = this.getIndex(scout) ;
        if (index === -1) {
            this.info_.results_?.push(scout) ;
            this.info_.results_?.push(result) ;
        }   
        else {
            this.info_.results_![index] = result ;
        }     
    }

    private syncClient(conn: SyncClient) {
        this.conn_ = conn ;
        conn.connect()
            .then(async ()=> {
                this.logger_.info('ScouterSync: connected to server \'' + conn.name() + '\'') ;
                let data = new Uint8Array(0) ;

                if (this.info_.tablet_ && this.info_.purpose_) {
                    let obj = {
                        name: this.info_.tablet_,
                        purpose: this.info_.purpose_
                    }
                    data = Buffer.from(JSON.stringify(obj)) ;
                }
                let p: Packet = new Packet(PacketType.Hello, data) ;
                await this.conn_!.send(p) ;

                this.conn_!.on('close', () => {
                    this.conn_ = undefined ;
                }) ;

                this.conn_!.on('error', (err: Error) => {
                    let msg: string = "" ;
                    let a: any = err as any ;
                    if (a.errors) {
                        for(let cerror of a.errors) {
                            this.logger_.info('ScouterSync: error from connection \'' + conn.name() + '\' - ' + cerror.message) ;
                            msg += cerror.message + '\n' ;
                        }
                    }
                    else {
                        this.logger_.info('ScouterSync: error from connection \'' + conn.name() + '\' - ' + err.message) ;
                        msg = err.message ;
                    }

                    this.sendToRenderer('set-status-title', 'Error Connecting To XeroScout Central') ;
                    this.sendToRenderer('set-status-visible', true) ;
                    this.sendToRenderer('set-status-text', msg) ;
                    this.sendToRenderer('set-status-close-button-visible', true) ;
                }) ;

                this.conn_!.on('packet', (p: Packet) => {
                    this.syncTablet(p) ;
                }) ;
            })
            .catch((err) => {
                this.logger_.error('cannot connect to central', err) ;
            }) ;
    }

    private uuidToFileName(uuid: string) : string {
        return uuid ;
    }

    private syncTablet(p: Packet) {
        let ret = true ;

        if (p.type_ === PacketType.Hello) {
            let obj ;

            try {
                obj = JSON.parse(p.payloadAsString()) ;
                if (this.info_.uuid_ && obj.uuid !== this.info_.uuid_) {
                    //
                    // We have an event loaded and it does not match
                    //
                    this.sendToRenderer('set-status-title', 'Error Connecting To XeroScout Central') ;
                    this.sendToRenderer('set-status-visible', true) ;
                    this.sendToRenderer('set-status-text', 'The loaded event does not match event being synced - reset the tablet to sync to this new event.') ;
                    this.sendToRenderer('set-status-close-button-visible', true) ;
                    this.conn_!.close() ;
                    return ;
                }

                if (this.info_.tablet_) {
                    //
                    // The current tablet already has an identity.  See if we are missing things ...
                    //
                    this.getMissingData() ;
                    if (!this.info_.evname_) {
                        this.info_.evname_ = obj.name ;
                    }
                }
                else {
                    this.info_.uuid_ = obj.uuid ;
                    this.info_.evname_ = obj.name;
                    let p: Packet = new Packet(PacketType.RequestTablets) ;
                    this.conn_!.send(p) ;
                }
            }
            catch(err) {
            }
        }
        else if (p.type_ === PacketType.ProvideTablets) {
            this.tablets_ = JSON.parse(p.data_.toString()) ;
            this.setView('select-tablet') ;
        }
        else if (p.type_ === PacketType.ProvideTeamForm) {
            this.info_.teamform_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;            
        }
        else if (p.type_ === PacketType.ProvideMatchForm) {
            this.info_.matchform_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;  
        }
        else if (p.type_ === PacketType.ProvideTeamList) {
            this.info_.teamlist_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;  
        }
        else if (p.type_ === PacketType.ProvideMatchList) {
            this.info_.matchlist_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;  
        }
        else if (p.type_ === PacketType.ReceivedResults) {
            this.conn_?.send(new Packet(PacketType.Goodbye, Buffer.from(this.info_.tablet_!))) ;
            this.conn_?.close() ;
        }
        else if (p.type_ === PacketType.Error) {
            this.sendToRenderer('set-status-title', 'Error Syncing With XeroScout Central') ;
            this.sendToRenderer('set-status-visible', true) ;
            this.sendToRenderer('set-status-text', p.payloadAsString()) ;
            this.sendToRenderer('set-status-close-button-visible', true) ;
        }
    }

    private sendScoutingData() {
        let obj = {
            purpose: this.info_.purpose_,
            results: this.info_.results_
        } ;

        let jsonstr = JSON.stringify(obj) ;
        this.conn_?.send(new Packet(PacketType.ProvideResults, Buffer.from(jsonstr))) ;
    }

    private getMissingData() {
        let ret: boolean = false ;

        if (!this.info_.teamform_) {
            this.conn_?.send(new Packet(PacketType.RequestTeamForm)) ;
            ret = true ;
        }
        else if (!this.info_.matchform_) {
            this.conn_?.send(new Packet(PacketType.RequestMatchForm)) ;
            ret = true ;
        }
        else if (!this.info_.matchlist_) {
            this.conn_?.send(new Packet(PacketType.RequestMatchList)) ;
            ret = true ;
        }
        else if (!this.info_.teamlist_) {
            this.conn_?.send(new Packet(PacketType.RequestTeamList)) ;
            ret = true ;
        }
        
        if (!ret) {
            this.sendNavData() ;
            this.setViewString() ;
            this.sendScoutingData() ;
        }

        return ret ;
    }

    private setViewString() {
        if (this.info_.uuid_) {
            this.sendToRenderer('event-name', this.info_.evname_, this.info_.uuid_) ;
        }
        else {
            this.setView('empty') ;
        }
    }

    public createMenu() : Menu | null {
        let ret: Menu | null = new Menu() ;

        let filemenu: MenuItem = new MenuItem( {
            type: 'submenu',
            label: 'File',
            role: 'fileMenu'
        }) ;

        let synctcpitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Sync Event (TCP)',
            click: () => { this.executeCommand(SCScout.syncEvent)}
        }) ;
        filemenu.submenu?.insert(0, synctcpitem) ;

        filemenu.submenu?.insert(1, new MenuItem({type: 'separator'}));

        let resetitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Reset Tablet',
            click: () => { this.executeCommand(SCScout.resetTablet)}
        }) ;
        filemenu.submenu?.insert(2, resetitem) ;

        ret.append(filemenu) ;
        
        let viewmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            role: 'viewMenu'
        }) ;
        ret.append(viewmenu) ;

        return ret;
    }    

    public sendTabletData() : void {
        if (this.tablets_) {
            this.sendToRenderer('send-tablet-data', this.tablets_) ;
        }
    }

    public setTabletNamePurpose(name: string, purpose: string) : void {
        this.tablets_ = undefined ;
        this.info_.tablet_ = name ;
        this.info_.purpose_ = purpose ;

        this.writeEventFile() ;
        this.getMissingData() ;
    }

    private checkLastEvent() {
        let lastfile: string = path.join(this.appdir_, SCScout.last_event_file) ;
        if (fs.existsSync(lastfile)) {
            const rawData = fs.readFileSync(lastfile, 'utf-8');
            if (rawData.trim().length !== 0) {
                let obj = JSON.parse(rawData) ;
                if (obj && obj.lastevent) {
                    let fname: string = this.uuidToFileName(obj.lastevent) ;
                    let fullpath: string = path.join(this.appdir_, fname) ;
                    this.readEventFile(fullpath) ;
                }
            }
        }
    }

    private readEventFile(fullpath: string) : Error | undefined {
        let ret : Error | undefined = undefined ;

        const rawData = fs.readFileSync(fullpath, 'utf-8');
        this.info_ = JSON.parse(rawData) as SCScoutInfo ;
        
        return ret ;
    }

    private writeEventFile() : Error | undefined {
        let ret: Error | undefined = undefined ;
        let lastfile: string = path.join(this.appdir_, SCScout.last_event_file) ;

        let obj = {
            lastevent: this.info_.uuid_
        } ;
        const lastFileJson = JSON.stringify(obj) ;
        fs.writeFile(lastfile, lastFileJson, (err) => {
            if (err) {
                fs.rmSync(lastfile) ;   
                ret = err ;
            }
        });

        if (!ret) {

            const jsonString = JSON.stringify(this.info_);

            // Write the string to a file
            let filename = this.uuidToFileName(this.info_.uuid_!) ;
            let projfile = path.join(this.appdir_, filename) ;
            fs.writeFile(projfile, jsonString, (err) => {
                if (err) {
                    fs.rmSync(lastfile) ;
                    fs.rmSync(projfile) ;   
                    ret = err ;
                }
            });
        }
        
        return ret;
    } 

}
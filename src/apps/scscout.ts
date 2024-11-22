import { BrowserWindow, dialog, Menu, MenuItem } from "electron";
import { SCBase, XeroAppType } from "./scbase";
import { SyncClient } from "../sync/syncclient";
import { TCPClient } from "../sync/tcpclient";
import { Packet } from "../sync/packet";
import * as path from 'path' ;
import * as fs from 'fs' ;
import { PacketType } from "../sync/packettypes";
import { MatchTablet } from "../project/matchtablet";
import { TeamTablet } from "../project/teamtablet";
import { FormInfo } from "../comms/formifc";

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
    public teamlist_? : TeamTablet[] ;
    public matchlist_? : MatchTablet[] ;
    public results_ : any[] ;

    constructor() {
        this.results_ = [] ;
    }
}

export class SCScout extends SCBase {
    private static readonly last_event_setting = "lastevent" ;

    private static readonly syncEvent: string = "sync-event" ;
    private static readonly resetTablet: string = "reset-tablet" ;

    private info_ : SCScoutInfo = new SCScoutInfo() ;

    private tcpHost_: string = "192.168.1.1" ;
    private tablets_?: any[] ;
    private conn_?: SyncClient ;
    private current_scout_? : string ;
    private current_list_entry_? : any[] ;
    private next_scout_? : string ;
    private want_sync_ : boolean = false ;

    public constructor(win: BrowserWindow, args: string[]) {
        super(win, 'scout') ;

        this.checkLastEvent() ;
    }

    public get applicationType() : XeroAppType { 
        return XeroAppType.Scouter ;
    }
    
    public basePage() : string  {
        return "content/scscouter/scouter.html"
    }

    public canQuit(): boolean {
        return true ;
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
                ret.push({type: 'item', command: 'st-' + t.team, title: "Team: " + t.team, number: t.team}) ;
            }
        }

        ret.sort((a,b) : number => { 
            if (a.number < b.number) {
                return -1 ;
            }
            else if (a.number > b.number) {
                return 1 ;
            }

            return 0 ;
        }) ;
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
            let numstr: string = t.teamkey ;
            if (numstr.startsWith('frc')) {
                numstr = numstr.substring(3);
            }
            let mtype:string = t.comp_level ;
            
            let cmd: string = 'sm-' + t.comp_level + '-' + t.set_number + '-' + t.match_number + '-' + t.teamkey ;
            let title: string ;
            title = mtype.toUpperCase() + '-' + t.match_number + ' - ' + t.set_number + '-' + numstr ;
            ret.push({type: 'item', command: cmd, title: title}) ;
        }
        return ret ;
    }

    public executeCommand(cmd: string) : void {   
        if (cmd === SCScout.syncEvent) {
            if (this.current_scout_) {
                this.want_sync_ = true ;
                this.sendToRenderer('request-results') ;
            }
            else {
                this.setViewString() ;
                this.current_scout_ = undefined ;
                if (this.isDevelop) {
                    this.syncClient(new TCPClient(this.logger_, '127.0.0.1')) ;
                }
                else {
                    this.syncClient(new TCPClient(this.logger_, this.tcpHost_)) ;
                }
            }
        }
        else if (cmd === SCScout.resetTablet) {
            this.resetTabletCmd() ;
        }
        else if (cmd.startsWith('st-')) {
            this.scoutTeam(cmd) ;
        }
        else if (cmd.startsWith('sm-')) {
            this.scoutMatch(cmd) ;
        }
    }

    private resetTabletCmd() {
        this.unsetSettings(SCScout.last_event_setting) ;
        this.info_.purpose_ = undefined ;
        this.info_.tablet_ = undefined ;
        this.info_.results_ = [];
        this.info_.uuid_ = undefined ;
        this.info_.evname_ = undefined ;
        this.info_.teamform_ = undefined ;
        this.info_.matchform_ = undefined ;
        this.info_.teamlist_ = undefined ;
        this.info_.matchlist_ = undefined ;

        this.sendToRenderer('tablet-title', 'NOT ASSIGNED') ;

        this.sendNavData() ;
        this.setView('empty') ;
    }

    private scoutTeam(team: string, force: boolean = false) {
        if (this.current_scout_ && !force) {
            //
            // Get the result from the existing displayed
            // team and store the result in the info for the team
            //
            this.next_scout_ = team ;
            this.sendToRenderer('request-results') ;
        }
        else {
            this.sendToRenderer('send-nav-highlight', team) ;
            this.current_scout_ = team;
            this.setView('formview', 'team') ;
        }
    }

    private scoutMatch(match: string, force: boolean = false) {
        if (this.current_scout_ && !force) {
            //
            // Get the result from the existing displayed
            // match and store the result in the info for the match
            //
            this.next_scout_ = match ;
            this.sendToRenderer('request-results') ;
        }
        else {
            this.sendToRenderer('send-nav-highlight', match) ;
            this.current_scout_ = match ;
            this.setView('formview', 'match') ;
        }
    }

    public provideResults(res: any) {
        this.addResults(this.current_scout_!, res) ;
        this.writeEventFile() ;
        this.logger_.silly('provideResults:' + this.current_scout_, res) ;

        if (this.want_sync_) {
            this.want_sync_ = false ;
            this.setViewString() ;
            this.current_scout_ = undefined ;
            if (this.isDevelop) {
                this.syncClient(new TCPClient(this.logger_, '127.0.0.1')) ;
            }
            else {
                this.syncClient(new TCPClient(this.logger_, this.tcpHost_)) ;
            }
        }
        else {        
            if (this.next_scout_?.startsWith('st-')) {
                this.scoutTeam(this.next_scout_!, true) ;
            }
            else {
                this.scoutMatch(this.next_scout_!, true) ;
            }
        }
    }

    public sendForm(type: string) {
        let ret : FormInfo = {
            message: undefined,
            form: undefined
        }

        if (type === 'team') {
            ret.form = {
                json: this.info_.teamform_,
                title: this.current_scout_!,
                type: 'team'
            } ;
        }
        else if (type === 'match') {
            ret.form = {
                json: this.info_.matchform_,
                title: this.current_scout_!,
                type: 'match'
            }
        }
        else {
            ret.message = 'Invalid form type requested' ;
        }

        this.sendToRenderer('send-form', ret) ;
        let data: any = this.getResults(this.current_scout_!) ;
        if (data) {
            this.sendToRenderer('send-initial-values', data) ;
        }
    }

    public sendMatchForm() {
        let ret = {
            formjson: null,
            title: "",
            errormsg: "",
        } ;

        if (this.info_.matchform_) {
            ret.formjson = this.info_.matchform_ ;
            if (this.current_scout_) {
                ret.title = this.current_scout_ ;
            }
            else {
                ret.title = 'UNKNOWN' ;
            }
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
        let buffer = Buffer.from(jsonstr) ;
        let jsonstr2 = buffer.toString() ;
        console.log(jsonstr2);
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
            this.sendToRenderer('update-main-window-view', 'event-view', this.info_.evname_, this.info_.uuid_) ;
            this.sendToRenderer('tablet-title', this.info_.tablet_) ;
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

        this.sendToRenderer('tablet-title', this.info_.tablet_) ;

        this.writeEventFile() ;
        this.getMissingData() ;
    }

    private checkLastEvent() {
        if (this.hasSetting(SCScout.last_event_setting)) {
            try {
                let fname = this.getSetting(SCScout.last_event_setting) ;
                let fullpath: string = path.join(this.appdir_, fname) ;
                this.readEventFile(fullpath) ;
            }
            catch(err) {
                let errobj: Error = err as Error ;
                dialog.showMessageBoxSync(this.win_, {
                    title: 'Error starting scout computer',
                    message: 'Error reading default event - this tablet has been reset.\nError: ' + errobj.message
                }) ;
                this.resetTabletCmd() ;
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
        let ret : Error | undefined ;

        let filename = this.uuidToFileName(this.info_.uuid_!) ;
        this.setSetting(SCScout.last_event_setting, filename) ;

        const jsonString = JSON.stringify(this.info_);
        let projfile = path.join(this.appdir_, filename) ;
        fs.writeFile(projfile, jsonString, (err) => {
            if (err) {
                this.unsetSettings(SCScout.last_event_setting) ;
                fs.rmSync(projfile) ;   
                ret = err ;
            }
        });
        return ret;
    } 

}
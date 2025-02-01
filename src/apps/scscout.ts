import { BrowserWindow, dialog, Menu, MenuItem } from "electron";
import { SCBase, XeroAppType } from "./scbase";
import { SyncClient } from "../sync/syncclient";
import { TCPClient } from "../sync/tcpclient";
import { PacketObj } from "../sync/packetobj";
import * as path from 'path' ;
import * as fs from 'fs' ;
import { PacketType } from "../sync/packettypes";
import { MatchTablet } from "../project/matchtablet";
import { TeamTablet } from "../project/teamtablet";
import { FormInfo } from "../comms/formifc";
import { OneScoutField, OneScoutResult, ScoutingData } from "../comms/resultsifc";

export class MatchInfo {
    public type_? : string ;
    public set_? : number ;
    public number_? : number ;
} ;

export class Preferences {
    public ipaddr_ : string ;

    constructor() {
        this.ipaddr_ = '192.168.1.1' ;
    }
}

export class SCScoutInfo {
    public tablet_? : string ;
    public purpose_? : string ;
    public uuid_? : string ;
    public evname_? : string ;
    public teamform_? : any ;
    public matchform_? : any ;
    public teamlist_? : TeamTablet[] ;
    public matchlist_? : MatchTablet[] ;
    public results_ : OneScoutResult[] ;

    constructor() {
        this.results_ = [] ;
    }
}

export class SCScout extends SCBase {
    private static readonly last_event_setting = "lastevent" ;
    private static readonly SYNC_IPADDR = 'SYNC_IPADDR' ;

    private static readonly syncEvent: string = "sync-event" ;
    private static readonly resetTablet: string = "reset-tablet" ;
    private static readonly preferences: string = 'preferences' ;
    private static readonly reverseImage: string = 'reverse' ;

    private info_ : SCScoutInfo = new SCScoutInfo() ;

    private tablets_?: any[] ;
    private conn_?: SyncClient ;
    private current_scout_? : string ;
    private alliance_? : string ;
    private want_cmd_ : boolean = false ;
    private next_cmd_? : string ;
    private reversed_ : boolean = false ;
    private reverseImage_: MenuItem | undefined ;
    private sync_client_? : SyncClient ;
    public preferences_ : Preferences ;

    public constructor(win: BrowserWindow, args: string[]) {
        super(win, 'scout') ;

        this.checkLastEvent() ;

        this.preferences_ = new Preferences() ;
        if (this.hasSetting(SCScout.SYNC_IPADDR)) {
            this.preferences_.ipaddr_ = this.getSetting(SCScout.SYNC_IPADDR) ;
        }
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
            let numstr: string = SCBase.stripKeyString(t.teamkey.toString()) ;
            let mtype:string = t.comp_level ;
            
            let cmd: string = 'sm-' + t.comp_level + '-' + t.set_number + '-' + t.match_number + '-' + t.teamkey ;
            let title: string ;
            title = mtype.toUpperCase() + '-' + t.match_number + ' - ' + t.set_number + '-' + numstr ;
            ret.push({type: 'item', command: cmd, title: title}) ;
        }
        return ret ;
    }

    public syncError(err: Error) {
        dialog.showMessageBoxSync(this.win_, {
            title: 'Synchronization Error',
            message: 'Error synchronizing - ' + err.message,
        }) ;
        this.sync_client_ = undefined ;
    }

    public syncDone() {
        this.sync_client_ = undefined ;
    }

    public executeCommand(cmd: string) : void {   
        if (this.current_scout_) {
            this.want_cmd_ = true ;
            this.next_cmd_ = cmd ;
            this.sendToRenderer('request-results') ;
        }
        else if (cmd === SCScout.syncEvent) {
            this.setViewString() ;
            this.current_scout_ = undefined ;
            this.sync_client_ = new TCPClient(this.logger_, this.preferences_.ipaddr_) ;
            this.sync_client_.on('close', this.syncDone.bind(this)) ; 
            this.sync_client_.on('error', this.syncError.bind(this)) ;

            this.syncClient(this.sync_client_) ;
        }
        else if (cmd === SCScout.resetTablet) {
            this.resetTabletCmd() ;
        }
        else if (cmd === SCScout.preferences) {
            this.setView('preferences');
        }
        else if (cmd === SCScout.reverseImage) {
            this.reverseImage() ;
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
            this.sendToRenderer('request-results') ;
        }
        else {
            this.sendToRenderer('send-nav-highlight', match) ;
            this.current_scout_ = match ;
            this.alliance_ = this.getAllianceFromMatch(match) ;
            if (!this.alliance_) {
                dialog.showMessageBox(this.win_, {
                    title: 'Internal Error', 
                    message: 'Internal Error - no alliance from match'
                }) ;
            }
            else {
                this.setView('formview', 'match') ;
            }
        }
    }

    private getAllianceFromMatch(match: string) : string | undefined {
        let ret: string | undefined ;
        
        for(let m of this.info_.matchlist_!) {
            let cmd: string = 'sm-' + m.comp_level + '-' + m.set_number + '-' + m.match_number + '-' + m.teamkey ;
            if (cmd === match) {
                ret = m.alliance ;
                break ;
            }
        }

        return ret;
    }

    public provideResults(res: any) {
        this.addResults(this.current_scout_!, res as OneScoutField[]) ;
        this.writeEventFile() ;
        this.logger_.silly('provideResults:' + this.current_scout_, res) ;

        if (this.want_cmd_) {
            this.current_scout_ = undefined ;
            this.want_cmd_ = false ;
            this.executeCommand(this.next_cmd_!) ;
        }
    }

    public sendForm(type: string) {
        let ret : FormInfo = {
            message: undefined,
            form: undefined,
            reversed: this.reversed_,
            color: this.alliance_,
        }

        if (type === 'team') {
            ret.form = {
                json: this.info_.teamform_,
                title: this.current_scout_!,
                type: 'team',
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

        if (ret.form !== undefined) {
            this.getImages(ret) ;
        }

        this.sendToRenderer('send-form', ret) ;
        let data: OneScoutResult | undefined = this.getResults(this.current_scout_!) ;
        if (data) {
            this.sendToRenderer('send-initial-values', data.data) ;
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

    private getResults(scout: string) : OneScoutResult | undefined {
        for(let result of this.info_.results_) {
            if (result.item === scout) {
                return result ;
            }
        }
        return undefined ;
    }

    private deleteResults(scout: string) {
        for(let i = 0 ; i < this.info_.results_.length ; i++) {
            if (this.info_.results_[i].item && this.info_.results_[i].item === scout) {
                this.info_.results_.splice(i, 1) ;
                break ;
            }
        }
    }
    
    private addResults(scout: string, result: OneScoutField[]) {

        let resobj : OneScoutResult = {
            item: scout,
            data: result
        } ;

        //
        // Optionally delete result if it already exists, we are providing new data.
        //
        this.deleteResults(scout) ;
        this.info_.results_.push(resobj) ;
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
                let p: PacketObj = new PacketObj(PacketType.Hello, data) ;
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

                this.conn_!.on('packet', (p: PacketObj) => {
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

    private syncTablet(p: PacketObj) {
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
                    let p: PacketObj = new PacketObj(PacketType.RequestTablets) ;
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
            this.conn_?.send(new PacketObj(PacketType.Goodbye, Buffer.from(this.info_.tablet_!))) ;
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
        let obj : ScoutingData = {
            tablet: this.info_.tablet_!,
            purpose: this.info_.purpose_!,
            results: this.info_.results_
        } ;

        let jsonstr = JSON.stringify(obj) ;
        let buffer = Buffer.from(jsonstr) ;
        let jsonstr2 = buffer.toString() ;
        this.conn_?.send(new PacketObj(PacketType.ProvideResults, Buffer.from(jsonstr))) ;
    }

    private getMissingData() {
        let ret: boolean = false ;

        if (!this.info_.teamform_) {
            this.conn_?.send(new PacketObj(PacketType.RequestTeamForm)) ;
            ret = true ;
        }
        else if (!this.info_.matchform_) {
            this.conn_?.send(new PacketObj(PacketType.RequestMatchForm)) ;
            ret = true ;
        }
        else if (!this.info_.matchlist_) {
            this.conn_?.send(new PacketObj(PacketType.RequestMatchList)) ;
            ret = true ;
        }
        else if (!this.info_.teamlist_) {
            this.conn_?.send(new PacketObj(PacketType.RequestTeamList)) ;
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

    private reverseImage() {
        this.reversed_ = this.reverseImage_!.checked ;
        this.current_scout_ = undefined ;
        if (this.info_.uuid_) {
            this.setViewString() ;
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

        let resetitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Reset Tablet',
            click: () => { this.executeCommand(SCScout.resetTablet)}
        }) ;
        filemenu.submenu?.insert(1, resetitem) ;

        filemenu.submenu?.insert(2, new MenuItem({type: 'separator'}));

        let preferences: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Preferences',
            click: () => { this.executeCommand(SCScout.preferences)}
        }) ;
        filemenu.submenu?.insert(3, preferences) ;        

        ret.append(filemenu) ;

        let optionmenu: MenuItem = new MenuItem({
            type: 'submenu',
            label: 'Options',
            submenu: new Menu()
        }) ;
    
        this.reverseImage_ = new MenuItem({
            type: 'checkbox',
            label: 'Reverse',
            checked: false,
            click: () => { this.executeCommand(SCScout.reverseImage)}
          }) ;
        optionmenu.submenu!.append(this.reverseImage_) ;
        ret.append(optionmenu);        
        
        let viewmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            role: 'viewMenu'
        }) ;
        ret.append(viewmenu) ;

        let helpmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            label: 'Help',
            submenu: new Menu(),
        }) ;

        let aboutitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'About',
            click: () => { this.showAbout() }
        }) ;
        helpmenu.submenu?.append(aboutitem) ;

        ret.append(helpmenu) ;

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

    public sendPreferences() {
        this.sendToRenderer('send-preferences', this.preferences_) ;
    }

    public updatePreferences(prefs: Preferences) {
        this.preferences_ = prefs;
        this.setSetting(SCScout.SYNC_IPADDR, this.preferences_.ipaddr_);
    }
}
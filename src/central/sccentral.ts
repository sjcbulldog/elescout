import { SCBase } from '../base/scbase';
import { BlueAlliance } from '../bluealliance/ba';
import { FRCEvent } from '../project/frcevent';
import { Project } from '../project/project';
import { BrowserWindow, dialog, Menu, MenuItem } from 'electron' ;
import Papa from 'papaparse';
import * as fs from 'fs' ;
import { Team } from '../project/team';
import { TCPSyncServer } from '../sync/tcpserver';
import { USBSyncServer } from '../sync/usbserver';
import { Packet } from '../sync/Packet';
import { SyncServer } from '../sync/syncserver';
import { PacketTypeHello } from '../sync/packettypes';

export class SCCentral extends SCBase {
    private project_? : Project = undefined ;
    private ba_? : BlueAlliance = undefined ;
    private baloading_ : boolean ;
    private frcevents_? : FRCEvent[] = undefined ;
    private tcpsyncserver_? : TCPSyncServer = undefined ;
    private usbsyncserver_? : USBSyncServer = undefined ;

    private static openExistingEvent : string = 'open-existing' ;
    private static createNewEvent: string = 'create-new' ;
    private static selectTeamForm: string = 'select-team-form' ;
    private static selectMatchForm: string = 'select-match-form' ;
    private static assignTablets: string = 'assign-tablets' ;
    private static loadBAEvent: string = 'load-ba-event' ;
    private static viewInit: string = 'view-init' ;
    private static lockEvent: string = 'lock-event' ;
    private static editTeams: string = 'edit-teams' ;
    private static editMatches : string = 'edit-matches' ;
    private static importTeams: string = 'import-teams' ;
    private static importMatches: string = 'import-matches' ;
    private static viewTeamForm: string = 'view-team-form' ;
    private static viewTeamStatus: string = 'view-team-status' ;
    private static viewTeamData: string = "view-team-data" ;
    private static viewMatchForm: string = 'view-match-form' ;
    private static viewMatchStatus: string = 'view-match-status' ;
    private static viewMatchData: string = "view-match-data" ;
    private static viewHelp: string = "view-help" ;

    constructor(win: BrowserWindow) {
        super(win, 'server') ;

        this.baloading_ = true ;
        this.ba_ = new BlueAlliance() ;
        this.ba_.init()
            .then((up) => {
                if (!up) {     
                    this.ba_ = undefined ;
                }
                else {                    
                    this.baloading_ = false ;
                }
            })
            .catch((err) => {
                this.ba_ = undefined ;
            });
    }

    public basePage() : string  {
        return 'content/sccentral/central.html'
    }

    public createMenu() : Menu | null {
        let ret: Menu | null = new Menu() ;

        let filemenu: MenuItem = new MenuItem( {
            type: 'submenu',
            label: 'File',
            role: 'fileMenu'
        }) ;

        let createitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Create Event ...',
            id: 'create-event',
            click: () => { this.executeCommand(SCCentral.createNewEvent)}
        }) ;
        filemenu.submenu?.insert(0, createitem) ;

        let openitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Open Event ...',
            id: 'open-event',
            click: () => { this.executeCommand(SCCentral.openExistingEvent)}            
        }) ;
        filemenu.submenu?.insert(1, openitem) ;

        filemenu.submenu?.insert(2, new MenuItem({type: 'separator'}));

        ret.append(filemenu) ;

        let loadmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            label: 'Import',
            submenu: new Menu()            
        }) ;

        let downloadMatchData: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Match Data',
            click: () => { this.downloadMatchData();}
        }) ;
        loadmenu.submenu?.insert(0, downloadMatchData) ;
        ret.append(loadmenu) ;

        let viewmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            role: 'viewMenu'
        }) ;
        ret.append(viewmenu) ;

        return ret;
    }

    public sendTeamForm() {
        let ret = {
            formjson: null,
            errormsg: "",
        } ;

        if (this.project_?.info.teamform_) {
            let jsonstr = fs.readFileSync(this.project_.info.teamform_).toLocaleString() ;
            try { 
                let jsonobj = JSON.parse(jsonstr) ;
                ret.formjson = jsonobj ;
            }
            catch(err) {
                let errobj = err as Error ;
                ret.errormsg = errobj.message ;
            }
        }
        else {
            ret.errormsg = "No team form has been set" ;
        }
        this.sendToRenderer('send-team-form', ret) ;
    }

    public sendMatchStatus() {
        interface data {
            type: string,
            set: number,
            number: number,

            rteam1: number,
            rtablet1: string,
            rstatus1: string,
            rteam2: number,
            rtablet2: string,
            rstatus2: string,
            rteam3: number,
            rtablet3: string,
            rstatus3: string,

            bteam1: number,
            btablet1: string,
            bstatus1: string,
            bteam2: number,
            btablet2: string,
            bstatus2: string,
            bteam3: number,
            btablet3: string,
            bstatus3: string,            
        }

        
        let ret : data[] = [] ;

        if (this.project_ && this.project_.info && this.project_.info.matches_ && this.project_.info.matchassignements_) {
            for(let t of this.project_.info.matches_) {
                ret.push({
                    type: t.comp_level_,
                    set: t.set_number_,
                    number: t.match_number_,
                    rteam1: t.red_alliance_!.teams_[0],
                    rtablet1: this.project_.getMatchScoutingTablet(t.comp_level_, t.set_number_, t.match_number_, t.red_alliance_!.teams_[0]),
                    rstatus1: this.project_.hasMatchScoutingResult(t.comp_level_, t.set_number_, t.match_number_, t.red_alliance_!.teams_[0]) ? "Y":"N",
                    rteam2: t.red_alliance_!.teams_[1],
                    rtablet2: this.project_.getMatchScoutingTablet(t.comp_level_, t.set_number_, t.match_number_, t.red_alliance_!.teams_[1]),
                    rstatus2: this.project_.hasMatchScoutingResult(t.comp_level_, t.set_number_, t.match_number_, t.red_alliance_!.teams_[1]) ? "Y":"N",
                    rteam3: t.red_alliance_!.teams_[2],
                    rtablet3: this.project_.getMatchScoutingTablet(t.comp_level_, t.set_number_, t.match_number_, t.red_alliance_!.teams_[2]),
                    rstatus3: this.project_.hasMatchScoutingResult(t.comp_level_, t.set_number_, t.match_number_, t.red_alliance_!.teams_[2]) ? "Y":"N",
                    bteam1: t.blue_alliance_!.teams_[0],
                    btablet1: this.project_.getMatchScoutingTablet(t.comp_level_, t.set_number_, t.match_number_, t.blue_alliance_!.teams_[0]),
                    bstatus1: this.project_.hasMatchScoutingResult(t.comp_level_, t.set_number_, t.match_number_, t.blue_alliance_!.teams_[0]) ? "Y":"N",
                    bteam2: t.blue_alliance_!.teams_[1],
                    btablet2: this.project_.getMatchScoutingTablet(t.comp_level_, t.set_number_, t.match_number_, t.blue_alliance_!.teams_[1]),
                    bstatus2: this.project_.hasMatchScoutingResult(t.comp_level_, t.set_number_, t.match_number_, t.blue_alliance_!.teams_[1]) ? "Y":"N",
                    bteam3: t.blue_alliance_!.teams_[2],
                    btablet3: this.project_.getMatchScoutingTablet(t.comp_level_, t.set_number_, t.match_number_, t.blue_alliance_!.teams_[2]),
                    bstatus3: this.project_.hasMatchScoutingResult(t.comp_level_, t.set_number_, t.match_number_, t.blue_alliance_!.teams_[2]) ? "Y":"N",
                }) ;
            }
        }

        this.sendToRenderer('send-match-status', ret) ;
    }

    public sendTeamStatus() {
        interface data {
            number: number,
            status: string,
            tablet: string,
            teamname: string
        }

        let ret : data[] = [] ;

        if (this.project_ && this.project_.info.teamassignments_) {
            for(let t of this.project_.info.teamassignments_) {
                let status: string = (this.project_.hasTeamScoutingResults(t.team) ? "Y" : "N") ;
                let team: Team | undefined = this.project_.findTeamByNumber(t.team) ;
                if (team) {
                    ret.push({ number: t.team, status: status, tablet: t.tablet, teamname: team.nickname_ }) ;
                }
            }
        }

        this.sendToRenderer('send-team-status', ret) ;
    }

    public sendMatchForm() {
        let ret = {
            formjson: null,
            errormsg: "",
        } ;

        if (this.project_?.info.matchform_) {
            let jsonstr = fs.readFileSync(this.project_.info.matchform_).toLocaleString() ;
            try { 
                let jsonobj = JSON.parse(jsonstr) ;
                ret.formjson = jsonobj ;
            }
            catch(err) {
                let errobj = err as Error ;
                ret.errormsg = errobj.message ;
            }
        }
        else {
            ret.errormsg = "No match form has been set" ;
        }
        this.sendToRenderer('send-match-form', ret) ;
    }

    private shortenString(str: string | undefined) : string | undefined {
        let ret: string | undefined ;

        if (str) {
            if (str.length > 32) {
                ret = '...' + str.substring(str.length - 32) ;
            }
            else {
                ret = str ;
            }
        }

        return ret;
    }

    public sendInfoData() : void {
        if (this.project_) {
            let obj = {
                location_ : this.project_.location,
                bakey_ : this.project_.info.frcev_?.evkey,
                name_ : this.project_.info.frcev_?.desc,
                teamform_ : this.shortenString(this.project_.info.teamform_),
                matchform_ : this.shortenString(this.project_.info.matchform_),
                tablets_ : this.project_.info.tablets_,
                tablets_valid_ : this.project_.areTabletsValid(),
                teams_ : this.project_.info.teams_,
                matches_ : this.project_.info.matches_,
                locked_ : this.project_.info.locked_
            };
            this.sendToRenderer('send-info-data', obj);
        }
    }

    public sendTabletData() : void {
        if (this.project_) {
            this.sendToRenderer('send-tablet-data', this.project_.info.tablets_) ;
        }
    }

    public setTabletData(data: any[]) {
        if (this.project_) {
            this.project_.setTabletData(data) ;
            this.sendToRenderer('update-main-window-view', 'info') ;
        }
    }

    public setTeamData(data: any[]) {
        if (this.project_) {
            this.project_.setTeamData(data) ;
            this.sendToRenderer('update-main-window-view', 'info') ;
        }
    }

    public sendTeamData() : void {
        if (this.project_) {
            this.sendToRenderer('send-team-data', this.project_.info.teams_) ;
        }
    }

    public setMatchData(data: any[]) {
        if (this.project_) {
            this.project_.setMatchData(data) ;
            this.sendToRenderer('update-main-window-view', 'info') ;
        }
    }

    public sendMatchData() : void {
        if (this.project_) {
            let data = [] ;
            if (this.project_.info.matches_) {
                for(let t of this.project_.info.matches_) {
                    let d = {
                        type_ : t.comp_level_,
                        number_ : t.match_number_,
                        red_: [
                            t.red_alliance_?.teams_[0],
                            t.red_alliance_?.teams_[1],
                            t.red_alliance_?.teams_[2],
                        ],
                        blue_: [
                            t.blue_alliance_?.teams_[0],
                            t.blue_alliance_?.teams_[1],
                            t.blue_alliance_?.teams_[2],
                        ]
                    }
                    data.push(d) ;
                }
            }
            this.sendToRenderer('send-match-data', data, this.project_.info.teams_) ;
        }
    }

    public sendEventData() : void {
        if (this.project_ && this.isBAAvailable()) {
            this.ba_?.getEvents()
                .then((frcevs) => {
                    this.frcevents_ = frcevs ;
                    this.sendToRenderer('send-event-data', frcevs) ;
                })
                .catch((err) => {
                    let errobj : Error = err as Error ;
                    dialog.showErrorBox('Load Blue Alliance Event', errobj.message) ;    
                    this.setView('info') ; 
                }) ;

        }
        else {
            dialog.showErrorBox('Load Blue Alliance Event', 'The Blue Alliance site is not available') ;
            this.sendToRenderer('send-event-data', null) ;
        }
    }

    public loadBaEventData(args: any[]) : void {
        if (!this.isBAAvailable()) {
            dialog.showErrorBox('Load Blue Alliance Event', 'The Blue Alliance site is not available.') ;
            return ;
        }

        let fev: FRCEvent | undefined = this.getEventFromKey(args[0]) ;        
        if (fev) {
            this.sendToRenderer('set-status-title', 'Loading event \'' + fev.desc + '\'') ;
            this.project_!.loadBAEvent(this, this.ba_!, fev)
                .then(() => {
                    this.sendNavData() ;
                    this.setView('info') ;
                })
                .catch((err) => {
                }) ;
        }
        else {
            dialog.showErrorBox('Load Blue Alliance Event', 'Event with key \'' + args[0] + '\' was not found.<br>No event was loaded') ;
        }
    }

    private downloadMatchData() {
        if (!this.project_) {
            let html = 'Must create or open a project to import data.' ;
            this.sendToRenderer('set-status-visible', true) ;
            this.sendToRenderer('set-status-title', 'Error Importing Match Data') ;
            this.sendToRenderer('set-status-html',  html) ;
            this.sendToRenderer('set-status-close-button-visible', true) ;
            return ;            
        }

        if (!this.isBAAvailable()) {
            let html = 'The Blue Alliance site is not available.' ;
            this.sendToRenderer('set-status-visible', true) ;
            this.sendToRenderer('set-status-title', 'Error Importing Match Data') ;
            this.sendToRenderer('set-status-html',  html) ;
            this.sendToRenderer('set-status-close-button-visible', true) ;
            return ;
        }

        let fev: FRCEvent | undefined = this.project_?.info.frcev_ ;
        if (fev) {
            this.sendToRenderer('set-status-visible', true) ;            
            this.sendToRenderer('set-status-title', 'Loading match data for event \'' + fev.desc + '\'') ;
            this.sendToRenderer('set-status-html',  'Loading data ...') ;
            this.project_!.loadMatchData(this, this.ba_!, fev)
                .then(() => {
                    this.sendToRenderer('set-status-close-button-visible', true) ;                    
                }) ;
        }
        else {
            let html = 'The event is not a blue alliance event' ;
            this.sendToRenderer('set-status-visible', true) ;
            this.sendToRenderer('set-status-title', 'Load Match Data') ;
            this.sendToRenderer('set-status-html',  html) ;
            this.sendToRenderer('set-status-close-button-visible', true) ;
        }
    }

    private getEventFromKey(key: string) : FRCEvent | undefined {
        let ret: FRCEvent | undefined = undefined ;

        if (this.frcevents_) {
            ret = this.frcevents_.find((element) => element.evkey === key) ;
        }

        return ret;
    }

    private isBAAvailable() : boolean {
        return this.ba_ !== undefined && !this.baloading_ ;
    }

    public isScoutingTablet(): boolean {
        return false ;
    }

    public sendNavData() : void {
        let treedata = [] ;

        treedata.push({type: 'item', command: SCCentral.viewHelp, 'title' : 'Help'}) ;

        if (this.project_) {
            treedata.push({type: 'item', command: SCCentral.viewInit, 'title' : 'Event Overview'}) ;
            treedata.push( { type: 'separator', title: 'Teams'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewTeamForm, 'title' : 'Form'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewTeamStatus, 'title' : 'Status'}) ;
            if (this.project_.hasTeamData) {
                treedata.push({ type: 'item', command: SCCentral.viewTeamData, 'title' : 'Data'}) ;
            }

            treedata.push( { type: 'separator', title: 'Match'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewMatchForm, 'title' : 'Form'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewMatchStatus, 'title' : 'Status'}) ;
            if (this.project_.hasMatchData) {
                treedata.push({ type: 'item', command: SCCentral.viewMatchData, 'title' : 'Data'}) ;
            }
        }

        this.sendToRenderer('send-nav-data', treedata);
    }

    public executeCommand(cmd: string) : void {
        if (cmd === SCCentral.createNewEvent) {
            this.createEvent() ;
            this.sendNavData() ;
        }
        else if (cmd === SCCentral.openExistingEvent) {
            this.openEvent() ;
        }
        else if (cmd === SCCentral.selectMatchForm) {
            this.selectMatchForm() ;
        }
        else if (cmd === SCCentral.selectTeamForm) {
            this.selectTeamForm() ;
        }
        else if (cmd === SCCentral.loadBAEvent) {
            this.loadBAEvent() ;
        }
        else if (cmd === SCCentral.assignTablets) {
            this.setView('tablets') ;
        }
        else if (cmd === SCCentral.viewInit) {
            this.setView('info') ;
        }
        else if (cmd === SCCentral.lockEvent) {
            this.project_!.lockEvent() ;
            this.startSyncServer() ;
            this.setView('info') ;
        }
        else if (cmd === SCCentral.editTeams) {
            this.setView('editteams') ;
        }
        else if (cmd === SCCentral.editMatches) {
            this.setView('editmatches') ;
        }
        else if (cmd === SCCentral.importTeams) {
            this.importTeams() ;
        }
        else if (cmd === SCCentral.importMatches) {
            this.importMatches() ;
        }
        else if (cmd === SCCentral.viewTeamForm) {
            this.setView('teamform') ;
        }
        else if (cmd === SCCentral.viewMatchForm) {
            this.setView('matchform') ;
        }
        else if (cmd === SCCentral.viewTeamStatus) {
            this.setView('teamstatus') ;
        }
        else if (cmd === SCCentral.viewMatchStatus) {
            this.setView('matchstatus') ;
        }
    }

    public setStatusMessage(msg: string) {
        this.sendToRenderer('set-status-bar-message', msg) ;
    }

    private importTeams() {
        var path = dialog.showOpenDialog({
            title: 'Import Teams',
            message: 'Select teams CVS file',
            filters: [
                {
                    extensions: ['csv'],
                    name: 'CSV File'
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                this.importTeamsFromFile(pathname.filePaths[0]) ;
            }
        })
        .catch((err) => {
            dialog.showErrorBox('Import Teams Error', err.message) ;
        }) ;                
    }

    private importMatches() {
        var path = dialog.showOpenDialog({
            title: 'Import Matches',
            message: 'Select Matches CVS file',
            filters: [
                {
                    extensions: ['csv'],
                    name: 'CSV File'
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                this.importMatchesFromFile(pathname.filePaths[0]) ;
            }
        })
        .catch((err) => {
            dialog.showErrorBox('Import Matches Error', err.message) ;
        }) ;                
    }

    private importTeamsFromFile(filename: string) {
        interface TeamData {
            number_ : Number ;
            nickname_ : string ;
          }
          
          const file = fs.readFileSync(filename, 'utf8');
          
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader(header, index) {
                let ret = header ;

                if (index == 0) {
                    ret = 'number_' ;
                }
                else if (index == 1) {
                    ret = 'nickname_' ;
                }
        
                return ret ;
            },
            complete: (results) => {
              this.sendToRenderer('send-team-data', results.data) ;
            },
            error: (error: any) => {
                let errobj: Error = error as Error ;
                dialog.showErrorBox("Error Importing Teams", errobj.message) ;
            },
          });
    }

    private transformData(data: any[]) : any[] {
        let result: any[] = [] ;

        for(let entry of data) {
            let obj = {
                type_: entry.type_,
                number_ : entry.number_,
                red_: [ entry.r1_, entry.r2_, entry.r3_],
                blue_: [ entry.b1_, entry.b2_, entry.b3_]
            }

            result.push(obj) ;
        }

        return result ;
    }

    private importMatchesFromFile(filename: string) {
        interface TeamData {
            number_ : Number ;
            nickname_ : string ;
          }
          
          const file = fs.readFileSync(filename, 'utf8');
          
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader(header, index) {
                let ret = header ;

                if (index == 0) {
                    ret = 'type_' ;
                }
                else if (index == 1) {
                    ret = 'number_' ;
                }
                else if (index == 2) {
                    ret = 'r1_' ;
                }
                else if (index == 3) {
                    ret = 'r2_' ;
                }
                else if (index == 4) {
                    ret = 'r3_' ;
                }
                else if (index == 5) {
                    ret = 'b1_' ;
                }
                else if (index == 6) {
                    ret = 'b2_' ;
                }
                else if (index == 7) {
                    ret = 'b3_' ;
                }
        
                return ret ;
            },
            complete: (results) => {
              this.sendToRenderer('send-match-data', this.transformData(results.data), this.project_!.info.teams_) ;
            },
            error: (error: any) => {
                let errobj: Error = error as Error ;
                dialog.showErrorBox("Error Importing Teams", errobj.message) ;
            },
          });
    }

    private loadBAEvent() {
        if (this.isBAAvailable()) {
            this.ba_?.getEvents()
                .then((frcevs) => {
                    this.sendToRenderer('send-event-data', frcevs);
                })
                .catch((err) => {
                    let errobj : Error = err as Error ;
                    dialog.showErrorBox('Load Blue Alliance Event', errobj.message) ;                    
                }) ;
        }
    }

    private createEvent() {
        var path = dialog.showOpenDialog({
            properties: [
                'openDirectory',
                'createDirectory'
            ]
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                Project.createEvent(pathname.filePaths[0])
                    .then((p) => {
                        this.project_ = p ;
                        this.setView('info') ;
                    })
                    .catch((err) => {
                        let errobj : Error = err as Error ;
                        dialog.showErrorBox('Create Project Error', errobj.message) ;
                    }) ;
            }
        })
        .catch((err) => {
            dialog.showErrorBox('Create Event Error', err.message) ;
        }) ;
    }

    private selectTeamForm() {
        var path = dialog.showOpenDialog({
            title: 'Select Team Form',
            message: 'Select team scouting form',
            filters: [
                {
                    extensions: ['json'],
                    name: 'JSON file for team scouting form'
                },
                {
                    extensions: ['html'],
                    name: 'HTML file for team scouting form'
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                this.project_!.setTeamForm(pathname.filePaths[0]) ;
                this.setView('info') ;
            }
        }) ;
    }

    private selectMatchForm() {
        var path = dialog.showOpenDialog({
            title: 'Select Match Form',
            message: 'Select match scouting form',
            filters: [
                {
                    extensions: ['json'],
                    name: 'JSON file for match scouting form'
                },
                {
                    extensions: ['html'],
                    name: 'HTML file for match scouting form'
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                this.project_!.setMatchForm(pathname.filePaths[0]) ;
                this.setView('info') ;
           }
        }) ;
    }    

    private openEvent() {
        var path = dialog.showOpenDialog({
            title: 'Event descriptor file',
            message: 'Select event descriptor file',
            filters: [
                {
                    extensions: ['json'],
                    name: 'JSON File for event descriptor'
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                Project.openEvent(pathname.filePaths[0])
                    .then((p) => {
                        this.project_ = p ;
                        if (this.project_.info.locked_) {
                            this.startSyncServer() ;
                        }
                        this.setView('info') ;
                        this.sendNavData() ;
                        this.setStatusMessage('Event Loaded - Blue Alliance Available') ;
                    })
                    .catch((err) => {
                        let errobj : Error = err as Error ;
                        dialog.showErrorBox('Open Project Error', errobj.message) ;
                    }) ;
            }
        })
        .catch((err) => {
            dialog.showErrorBox('Open Event Error', err.message) ;
        }) ;
    }

    private processPacket(p: Packet) : Packet {
        let resp = new Packet(PacketTypeHello, p.data_) ;
        return resp ;
    }

    private startSyncServer() {
        this.tcpsyncserver_ = new TCPSyncServer(this.logger_) ;
        this.tcpsyncserver_.init()
            .then(() => { 
                this.logger_.info('TCPSyncServer: initialization completed sucessfully') ;
            }) ;
        this.tcpsyncserver_.on('packet', (p: Packet) => { 
            let reply: Packet = this.processPacket(p) ;
            this.tcpsyncserver_!.send(reply) ;
        });

        this.usbsyncserver_ = new USBSyncServer(this.logger_) ;
        this.usbsyncserver_.init()
            .then(() => {
                this.logger_.info('USBSyncServer: initialization completed sucessfully') ;
            }) ;
        this.usbsyncserver_.on('packet', (p: Packet) => { 
            let reply: Packet = this.processPacket(p) ;
            this.usbsyncserver_!.send(reply) ;
        });
    }
}

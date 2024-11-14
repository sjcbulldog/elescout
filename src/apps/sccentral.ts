import { SCBase } from './scbase';
import { BlueAlliance } from '../bluealliance/ba';
import { Project } from '../project/project';
import { BrowserWindow, dialog, Menu, MenuItem } from 'electron' ;
import Papa from 'papaparse';
import * as fs from 'fs' ;
import { TCPSyncServer } from '../sync/tcpserver';
import { Packet } from '../sync/packet';
import { PacketType } from '../sync/packettypes';
import { FieldAndType, ValueType } from '../model/datamodel';
import { MatchDataModel } from '../model/matchmodel';
import { BAEvent, BAMatch, BATeam } from '../bluealliance/badata';
import { TeamDataModel } from '../model/teammodel';

export class SCCentral extends SCBase {

    private static readonly matchStatusFields: string[] = [
        'comp_level',
        'set_number',
        'match_number',
        'team_key',
        'r1',
        'r2',
        'r3',
        'b1',
        'b2',
        'b3'
    ] ;

    private static readonly openExistingEvent : string = 'open-existing' ;
    private static readonly createNewEvent: string = 'create-new' ;
    private static readonly selectTeamForm: string = 'select-team-form' ;
    private static readonly selectMatchForm: string = 'select-match-form' ;
    private static readonly assignTablets: string = 'assign-tablets' ;
    private static readonly loadBAEvent: string = 'load-ba-event' ;
    private static readonly viewInit: string = 'view-init' ;
    private static readonly lockEvent: string = 'lock-event' ;
    private static readonly editTeams: string = 'edit-teams' ;
    private static readonly editMatches : string = 'edit-matches' ;
    private static readonly importTeams: string = 'import-teams' ;
    private static readonly importMatches: string = 'import-matches' ;
    private static readonly viewTeamForm: string = 'view-team-form' ;
    private static readonly viewTeamStatus: string = 'view-team-status' ;
    private static readonly viewTeamDB: string = "view-team-db" ;
    private static readonly viewMatchForm: string = 'view-match-form' ;
    private static readonly viewMatchStatus: string = 'view-match-status' ;
    private static readonly viewMatchDB: string = "view-match-db" ;
    private static readonly viewPreviewForm: string = "view-preview-form" ;
    private static readonly viewHelp: string = "view-help" ;

    private project_? : Project = undefined ;
    private ba_? : BlueAlliance = undefined ;
    private baloading_ : boolean ;
    private tcpsyncserver_? : TCPSyncServer = undefined ;
    private previewfile_? : string = undefined ;
    private baevents_? : BAEvent[] ;
    private syncingTablet_? : string = undefined ;
    private syncingPurpose_? : string = undefined;


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

    public canQuit(): boolean {
        let ret: boolean = true ;

        if (this.project_?.teamDB) {
            if (!this.project_.teamDB.close()) {
                ret = false;
            }

            if (!this.project_.matchDB.close()) {
                ret = false ;
            }
        }

        return ret;
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
            label: 'Data',
            submenu: new Menu()            
        }) ;

        let downloadMatchData: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Import Match Data',
            click: () => { this.downloadMatchData();}
        }) ;
        loadmenu.submenu?.append(downloadMatchData) ;

        loadmenu.submenu?.append(new MenuItem({type: 'separator'}));

        let exportTeamData: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Export Team Data',
            click: () => { this.doExportTeamData();}
        }) ;
        loadmenu.submenu?.append(exportTeamData) ;

        let exportMatchData: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Export Match Data',
            click: () => { this.doExportMatchData();}
        }) ;
        loadmenu.submenu?.append(exportMatchData) ;

        ret.append(loadmenu) ;

        let viewmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            role: 'viewMenu'
        }) ;
        ret.append(viewmenu) ;

        return ret;
    }

    public windowCreated(): void {
    }

    private doExportTeamData() {
    }

    private doExportMatchData() {
    }

    public sendTeamForm() {
        let ret = {
            formjson: null,
            errormsg: "",
        } ;

        if (this.project_?.info.teamform_) {
            let jsonstr = fs.readFileSync(this.project_.info.teamform_).toString() ;
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

    public sendPreviewForm() {
        let ret = {
            formjson: null,
            errormsg: "",
        } ;

        if (this.previewfile_) {
            let jsonstr = fs.readFileSync(this.previewfile_).toString() ;
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
            ret.errormsg = "No preview form has been set" ;
        }
        this.sendToRenderer('send-preview-form', ret) ;
    }

    public async sendMatchStatus() {
        interface data {
            comp_level: string,
            set_number: number,
            match_number: number,
            red1: number,
            redtab1: string,
            redst1: string,
            red2: number,
            redtab2: string,
            redst2: string,
            red3: number,
            redtab3: string,
            redst3: string,
            blue1: number,
            bluetab1: string,
            bluest1: string,
            blue2: number,
            bluetab2: string,
            bluest2: string,
            blue3: number,
            bluetab3: string,
            bluest3: string
        } ;

        try {
            let ret: data[] = [] ;

            for(let one of this.project_?.info.matches_!) {
                let r1 = one.alliances.red.team_keys[0] ;
                let r2 = one.alliances.red.team_keys[1] ;
                let r3 = one.alliances.red.team_keys[2] ;
                let b1 = one.alliances.blue.team_keys[0] ;
                let b2 = one.alliances.blue.team_keys[1] ;
                let b3 = one.alliances.blue.team_keys[2] ;

                let obj = {
                    comp_level: one.comp_level,
                    set_number: one.set_number,
                    match_number: one.match_number,
                    red1: this.keyToTeamNumber(r1),
                    redtab1: this.project_!.findTabletForMatch(one.comp_level, one.set_number, one.match_number, r1),
                    redst1: this.project_!.hasMatchScoutingResult(one.comp_level, one.set_number, one.match_number, r1),
                    red2: this.keyToTeamNumber(r2),
                    redtab2: this.project_!.findTabletForMatch(one.comp_level, one.set_number, one.match_number, r2),
                    redst2: this.project_!.hasMatchScoutingResult(one.comp_level, one.set_number, one.match_number, r2),
                    red3: this.keyToTeamNumber(r3),
                    redtab3: this.project_!.findTabletForMatch(one.comp_level, one.set_number, one.match_number, r3),
                    redst3: this.project_!.hasMatchScoutingResult(one.comp_level, one.set_number, one.match_number, r3),
                    blue1: this.keyToTeamNumber(b1),
                    bluetab1: this.project_!.findTabletForMatch(one.comp_level, one.set_number, one.match_number, b1),
                    bluest1: this.project_!.hasMatchScoutingResult(one.comp_level, one.set_number, one.match_number, b1),
                    blue2: this.keyToTeamNumber(b2),
                    bluetab2: this.project_!.findTabletForMatch(one.comp_level, one.set_number, one.match_number, b2),
                    bluest2: this.project_!.hasMatchScoutingResult(one.comp_level, one.set_number, one.match_number, b2),
                    blue3: this.keyToTeamNumber(b3),
                    bluetab3: this.project_!.findTabletForMatch(one.comp_level, one.set_number, one.match_number, b3),
                    bluest3: this.project_!.hasMatchScoutingResult(one.comp_level, one.set_number, one.match_number, b3),
                } ;
                ret.push(obj) ;
            }
            this.sendToRenderer('send-match-status', ret) ;            
        }
        catch(err) {
            let errobj: Error = err as Error ;
            dialog.showErrorBox('Error', 'Error retreiving match data - ' + errobj.message) ;
        }
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
                let team: BATeam | undefined = this.project_.findTeamByNumber(t.team) ;
                if (team) {
                    ret.push({ number: t.team, status: status, tablet: t.tablet, teamname: team.nickname }) ;
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

    private keyToTeamNumber(key: string) {
        let ret: number = -1 ;
        let m1 = /^frc[0-9]+$/ ;
        let m2 = /^[0-9]+$/ ;

        if (m1.test(key)) {
            ret = +key.substring(3) ;
        }
        else if (m2.test(key)) {
            ret = +key ;
        }

        return ret ;
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
                bakey_ : this.project_.info.frcev_?.key,
                name_ : this.project_.info.frcev_ ? this.project_.info.frcev_.name : this.project_.info.name_,
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

    public setEventName(data: any) {
        if (this.project_) {
            this.project_.setEventName(data) ;
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

    public sendMatchDB() : void {
        if (this.project_) {
            this.project_.matchDB.getColumns()
                .then((cols) => {
                    this.project_?.matchDB.getAllData(MatchDataModel.MatchTableName)
                        .then((data) => {
                            let dataobj = {
                                cols: cols,
                                data: data
                            } ;
                            this.sendToRenderer('send-match-db', dataobj) ;
                        })
                        .catch((err) => {

                        }) ;
                })
                .catch((err) => {

                })
        }
    }

    public sendTeamDB() : void {
        if (this.project_) {
            this.project_.teamDB.getColumns()
                .then((cols) => {
                    this.project_?.teamDB.getAllData(TeamDataModel.TeamTableName)
                        .then((data) => {
                            let dataobj = {
                                cols: cols,
                                data: data
                            } ;
                            this.sendToRenderer('send-team-db', dataobj) ;
                        })
                        .catch((err) => {
                            this.logger_.error('error getting data from database for send-team-db', err) ;
                        }) ;
                })
                .catch((err) => {
                    this.logger_.error('error getting columns from database for send-team-db', err) ;
                })
        }
    }

    public sendMatchData() : void {
        if (this.project_) {
            this.sendMatchDataInternal(this.project_.info.matches_) ;
        }
    }

    private sendMatchDataInternal(matches: BAMatch[] | undefined) : void {
        let data = [] ;
        if (matches) {
            for(let t of matches) {
                let d = {
                    comp_level : t.comp_level,
                    set_number : t.set_number,
                    match_number: t.match_number,
                    red1: this.keyToTeamNumber(t.alliances.red.team_keys[0]),
                    red2: this.keyToTeamNumber(t.alliances.red.team_keys[1]),
                    red3: this.keyToTeamNumber(t.alliances.red.team_keys[2]),
                    blue1: this.keyToTeamNumber(t.alliances.blue.team_keys[0]),
                    blue2: this.keyToTeamNumber(t.alliances.blue.team_keys[1]),
                    blue3: this.keyToTeamNumber(t.alliances.blue.team_keys[2])
                }
                data.push(d) ;
            }
        }
        this.sendToRenderer('send-match-data', data, this.project_!.info.teams_) ;
    }

    public sendEventData() : void {
        if (this.project_ && this.isBAAvailable()) {
            this.ba_?.getEvents()
                .then((frcevs: BAEvent[]) => {
                    this.baevents_ = frcevs;
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

        let fev: BAEvent | undefined = this.getEventFromKey(args[0]) ;        
        if (fev) {
            this.sendToRenderer('set-status-title', 'Loading event \'' + fev.name + '\'') ;
            this.project_!.loadBAEvent(this, this.ba_!, fev)
                .then(() => {
                    this.sendNavData() ;
                    this.setView('info') ;
                })
                .catch((err) => {
                    this.sendToRenderer('set-status-visible', true) ;
                    this.sendToRenderer('set-status-title', 'Error Importing Match Data') ;
                    this.sendToRenderer('set-status-html',  'Error importing data - ' + err.message) ;
                    this.sendToRenderer('set-status-close-button-visible', true) ;
                    this.setView('info') ;
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

        let fev: BAEvent | undefined = this.project_?.info.frcev_ ;
        if (fev) {
            this.sendToRenderer('set-status-visible', true) ;            
            this.sendToRenderer('set-status-title', 'Loading match data for event \'' + fev.name + '\'') ;
            this.sendToRenderer('set-status-html',  'Loading data ...') ;
            this.project_!.loadMatchData(this, this.ba_!, fev)
                .then((count) => {
                    this.sendToRenderer('set-status-html',  'Loading data ... done, ' + count + ' match records processed') ;
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

    private getEventFromKey(key: string) :  BAEvent | undefined {
        let ret: BAEvent | undefined = undefined ;

        if (this.baevents_) {
            ret = this.baevents_.find((element) => element.key === key) ;
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
        treedata.push({type: 'item', command: SCCentral.viewPreviewForm, 'title' : 'Preview Form'}) ;

        if (this.project_) {
            treedata.push({type: 'item', command: SCCentral.viewInit, 'title' : 'Event Overview'}) ;
            treedata.push({ type: 'separator', title: 'Teams'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewTeamForm, 'title' : 'Form'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewTeamStatus, 'title' : 'Status'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewTeamDB, 'title' : 'Data'}) ;

            treedata.push({ type: 'separator', title: 'Match'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewMatchForm, 'title' : 'Form'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewMatchStatus, 'title' : 'Status'}) ;
            treedata.push({ type: 'item', command: SCCentral.viewMatchDB, 'title' : 'Data'}) ;
        }

        this.sendToRenderer('send-nav-data', treedata);
    }

    public executeCommand(cmd: string) : void {
        if (cmd === SCCentral.viewHelp) {
        }
        else if (cmd === SCCentral.viewPreviewForm) {
            this.previewForm() ;
        } 
        else if (cmd === SCCentral.createNewEvent) {
            this.createEvent() ;
            this.sendNavData() ;
        }
        else if (cmd === SCCentral.openExistingEvent) {
            this.openEvent() ;
            this.sendNavData() ;
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
            this.sendNavData() ;
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
            if (!this.project_?.info.teamassignments_) {
                this.sendToRenderer('update-main-window-view', 'empty', 'Scouting schedule not generated yet') ;
            }
            else {
                this.setView('teamstatus') ;
             }

        }
        else if (cmd === SCCentral.viewMatchStatus) {
            if (!this.project_?.info.matchassignements_) {
                this.sendToRenderer('update-main-window-view', 'empty', 'Scouting schedule not generated yet') ;
            }
            else {
                this.setView('matchstatus') ;
            }
        }
        else if (cmd === SCCentral.viewMatchDB) {
            this.setView('matchdb') ;
        }
        else if (cmd === SCCentral.viewTeamDB) {
            this.setView('teamdb') ;
        }
    }

    private previewForm() {
        var path = dialog.showOpenDialog({
            title: 'Select Form',
            message: 'Select scouting form',
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
                if (this.validateForm(pathname.filePaths[0], '*')) {
                    this.previewfile_ = pathname.filePaths[0] ;
                    this.setView('preview') ;
                }
            }
        }) ;
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
                    ret = 'team_number' ;
                }
                else if (index == 1) {
                    ret = 'nickname' ;
                }
        
                return ret ;
            },
            complete: (results) => {
                let data: BATeam[] = [];
                for(let one of results.data) {
                    let entry = one as any ;
                    let obj : BATeam = {
                        key: entry.team_number,
                        team_number: +entry.team_number,
                        nickname: entry.nickname,
                        name: entry.nickname,
                        school_name: '',
                        city: '',
                        state_prov: '',
                        country: '',
                        address: '',
                        postal_code: '',
                        gmaps_place_id: '',
                        gmaps_url: '',
                        lat: 0,
                        lng: 0,
                        location_name: '',
                        website: '',
                        rookie_year: 1942,
                    }
                    data.push(obj) ;
                }
              this.sendToRenderer('send-team-data', data) ;
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

                if (index === 0) {
                    ret = 'comp_level' ;
                }
                else if (index === 1) {
                    ret = 'set_number' ;
                }
                else if (index === 2) {
                    ret = 'match_number' ;
                }
                else if (index === 3) {
                    ret = 'r1_' ;
                }
                else if (index === 4) {
                    ret = 'r2_' ;
                }
                else if (index === 5) {
                    ret = 'r3_' ;
                }
                else if (index === 6) {
                    ret = 'b1_' ;
                }
                else if (index === 7) {
                    ret = 'b2_' ;
                }
                else if (index === 8) {
                    ret = 'b3_' ;
                }
        
                return ret ;
            },
            complete: (results) => {
                let matches:BAMatch[] = [] ;
                for(let one of results.data) {
                    let oneobj = one as any ;
                    let obj : BAMatch = {
                        key: '',
                        comp_level: oneobj.comp_level,
                        set_number: oneobj.set_number,
                        match_number: oneobj.match_number,
                        alliances: {
                            red: {
                                team_keys: [ oneobj.r1_, oneobj.r2_, oneobj.r3_],
                            },
                            blue: {
                                team_keys: [ oneobj.b1_, oneobj.b2_, oneobj.b3_],
                            }
                        }
                    };
                    matches.push(obj) ;
                }
                this.sendMatchDataInternal(matches);
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
                Project.createEvent(this.logger_, pathname.filePaths[0])
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

    private showError(filename: string, err: string) {
        dialog.showErrorBox('Invalid Form', filename + ': ' + err) ;
    }

    private showSectError(filename: string, num: number, err: string) {
        dialog.showErrorBox('Invalid Form', filename + ': section ' + num + ': ' + err) ;
    }

    private showItemError(filename: string, sectno: number, itemno: number, err: string) {
        dialog.showErrorBox('Invalid Form', filename + ': section ' + sectno + ': item ' + itemno + ':' + err) ;
    }

    private validateItem(filename: string, sectno: number, itemno: number, item: any) : boolean {
        if (!item.name) {
            this.showItemError(filename, sectno, itemno, 'the field \'name\' is not defined') ;
            return false ;
        }

        if (typeof item.name !== 'string') {
            this.showItemError(filename, sectno, itemno, 'the field \'name\' is defined, but is not a string') ;
            return false ; 
        }

        if (!item.type) {
            this.showItemError(filename, sectno, itemno, 'the field \'type\' is not defined') ;
            return false ;
        }

        if (typeof item.type !== 'string') {
            this.showItemError(filename, sectno, itemno, 'the field \'type\' is defined, but is not a string') ;
            return false ; 
        }

        if (item.type != 'boolean' && item.type != 'text' && item.type != 'choice' && item.type != 'updown') {
            this.showItemError(filename, sectno, itemno, 'the field \'type\' is ${item.type} which is not valid.  Must be \'boolean\', \'text\', \'updown\', or \'choice\'') ;
        }

        if (!item.tag) {
            this.showItemError(filename, sectno, itemno, 'the field \'tag\' is not defined') ;
            return false ;
        }

        if (typeof item.tag !== 'string') {
            this.showItemError(filename, sectno, itemno, 'the field \'tag\' is defined, but is not a string') ;
            return false ; 
        }

        if (item.type === 'text') {
            if (item.maxlen === undefined) {
                this.showItemError(filename, sectno, itemno, 'the field \'maxlen\' is not defined and is required for an item of type \'text\'') ;
                return false ;
            }

            if (typeof item.maxlen !== 'number') {
                this.showItemError(filename, sectno, itemno, 'the field \'maxlen\' is defined but is not a number') ;
                return false ;                
            }
        }
        else if (item.type === 'boolean') {
            // NONE
        }
        else if (item.type === 'updown') {
            if (item.minimum === undefined) {
                this.showItemError(filename, sectno, itemno, 'the field \'minimum\' is not defined and is required for an item of type \'updown\'') ;
                return false ;
            }

            if (typeof item.minimum !== 'number') {
                this.showItemError(filename, sectno, itemno, 'the field \'minimum\' is defined but is not a number') ;
                return false ;                
            }

            if (item.maximum === undefined) {
                this.showItemError(filename, sectno, itemno, 'the field \'maximum\' is not defined and is required for an item of type \'updown\'') ;
                return false ;
            }

            if (typeof item.maximum !== 'number') {
                this.showItemError(filename, sectno, itemno, 'the field \'maximum\' is defined but is not a number') ;
                return false ;                
            }

            if (item.maximum <= item.minimum) {
                this.showItemError(filename, sectno, itemno, 'the field \'maximum\' is less than the field \'minimum\'') ;
                return false ;                
            }
        }
        else if (item.type === 'choice') {
            if (item.choices === undefined) {
                this.showItemError(filename, sectno, itemno, 'the field \'choices\' is not defined and is required for an item of type \'choice\'') ;
                return false ;
            }

            if (!Array.isArray(item.choices)) {
                this.showItemError(filename, sectno, itemno, 'the field \'choices\' is defined but is not of type array') ;
                return false ;                
            }

            let choiceno = 1 ;
            for(let choice of item.choices) {
                if (typeof choice !== 'string' && typeof choice !== 'number') {
                    let msg: string = 'choice ' + choiceno + ": the value is neither a 'string', nor a 'number'" ;
                    this.showItemError(filename, sectno, itemno, msg) ;
                    return false ;
                }
                choiceno++ ;
            }
        }

        return true ;
    }

    private validateSection(filename: string, num: number, sect: any) : boolean {
        if (!sect.name) {
            this.showSectError(filename, num, 'the field \'name\' is not defined') ;
            return false ;
        }

        if (typeof sect.name !== 'string') {
            this.showSectError(filename, num, 'the field \'name\' is defined, but is not a string') ;
            return false ; 
        }

        if (!sect.items) {
            this.showSectError(filename, num, 'the field \'items\' is not defined') ;
            return false ;
        }

        if (!Array.isArray(sect.items)) {
            this.showSectError(filename, num, 'the form \'items\' is defined but it is not an array') ;
            return false;
        }

        let itemnum = 1 ;
        for(let item of sect.items) {
            if (!this.validateItem(filename, num, itemnum, item)) {
                return false ;
            }
            itemnum++ ;
        }

        return true ;
    }

    private validateForm(filename: string, type: string) {
        let jsonstr = fs.readFileSync(filename).toLocaleString() ;
        let obj ;

        try { 
            obj = JSON.parse(jsonstr) ;
        }
        catch(err) {
            this.showError(filename, 'not a valid JSON file - load the form file in VS Code to find errors') ;
            return false ;
        }

        if (!obj.form) {
            this.showError(filename, 'the form is missing the \'form\' field to indicate form type') ;
            return false;
        }

        if (obj.form !== type && type !== '*') {
            this.showError(filename, 'the form type is not valid, expected \'' + type + '\' but form \'' + obj.form + '\'') ;
            return false ;
        }

        if (!obj.sections) {
            this.showError(filename, 'the form is missing the \'sections\' field to indicate form type') ;
            return false;
        }

        if (!Array.isArray(obj.sections)) {
            this.showError(filename, 'the form has the \'sections\' field but it is not an array') ;
            return false;
        }

        let num = 1 ;
        for (let sect of obj.sections) {
            if (!this.validateSection(filename, num, sect)) {
                return false;
            }

            num++ ;
        }

        return true ;
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
                if (this.validateForm(pathname.filePaths[0], 'team')) {
                    this.project_!.setTeamForm(pathname.filePaths[0]) ;
                }
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
                if (this.validateForm(pathname.filePaths[0], 'match')) {
                    this.project_!.setMatchForm(pathname.filePaths[0]) ;
                }
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
                Project.openEvent(this.logger_, pathname.filePaths[0])
                    .then((p) => {
                        this.project_ = p ;
                        if (this.project_.info.locked_) {
                            this.startSyncServer() ;
                        }
                        this.setView('info') ;
                        this.sendNavData() ;
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

    private processPacket(p: Packet) : Packet | undefined  {
        let resp : Packet | undefined ;

        if (p.type_ === PacketType.Hello) {
            if (p.data_.length > 0) {
                try {
                    let obj = JSON.parse(p.payloadAsString()) ;
                    this.syncingPurpose_ = obj.purpose ;
                    this.syncingTablet_ = obj.tablet ;
                }
                catch(err) {
                }
            }

            let evname ;

            if (this.project_?.info.frcev_?.name) {
                evname = this.project_.info.frcev_.name ;
            }
            else {
                evname = this.project_?.info.name_ ;
            }

            let evid = {
                uuid: this.project_!.info.uuid_,
                name: evname,
            }
            let uuidbuf = Buffer.from(JSON.stringify(evid), 'utf-8') ;
            resp = new Packet(PacketType.Hello, uuidbuf) ;
        }
        else if (p.type_ === PacketType.RequestTablets) {
            let data: Uint8Array = new Uint8Array(0) ;
            if (this.project_ && this.project_.info.tablets_) {
                let tablets: any[] = [] ;

                for(let t of this.project_?.info.tablets_) {
                    if (!t.assigned) {
                        tablets.push({name: t.name, purpose: t.purpose}) ;
                    }
                }

                let msg: string = JSON.stringify(tablets) ;
                data = Buffer.from(msg, 'utf-8') ;
            }
            resp = new Packet(PacketType.ProvideTablets, data) ;
        }
        else if (p.type_ === PacketType.RequestTeamForm) {
            if (this.project_?.info.teamform_) {
                let jsonstr = fs.readFileSync(this.project_.info.teamform_).toString() ;
                resp = new Packet(PacketType.ProvideTeamForm, Buffer.from(jsonstr, 'utf8')) ;
            } else {
                resp = new Packet(PacketType.Error, Buffer.from('internal error #1 - no team form', 'utf-8')) ;
                dialog.showErrorBox('Internal Error #1', 'No team form is defined but event is locked') ;
            }
        }
        else if (p.type_ === PacketType.RequestMatchForm) {
            if (this.project_?.info.matchform_) {
                let jsonstr = fs.readFileSync(this.project_.info.matchform_).toString() ;
                resp = new Packet(PacketType.ProvideMatchForm, Buffer.from(jsonstr, 'utf8')) ;
            } else {
                resp = new Packet(PacketType.Error, Buffer.from('internal error #1 - no match form', 'utf-8')) ;
                dialog.showErrorBox('Internal Error #1', 'No match form is defined but event is locked') ;
            }
        }
        else if (p.type_ === PacketType.RequestTeamList) {
            if (this.project_?.info.teamassignments_) {
                let str = JSON.stringify(this.project_?.info.teamassignments_) ;
                resp = new Packet(PacketType.ProvideTeamList, Buffer.from(str)) ;
            }
            else {
                resp = new Packet(PacketType.Error, Buffer.from('internal error #2 - no team list generated for a locked event', 'utf-8')) ;
                dialog.showErrorBox('Internal Error #2', 'No team list has been generated for a locked event') ;                
            }
        }
        else if (p.type_ === PacketType.RequestMatchList) {
            if (this.project_?.info.matchassignements_) {
                let str = JSON.stringify(this.project_?.info.matchassignements_) ;
                resp = new Packet(PacketType.ProvideMatchList, Buffer.from(str)) ;
            }
            else {
                resp = new Packet(PacketType.Error, Buffer.from('internal error #3 - no match list has been generated for a locked event', 'utf-8')) ;
                dialog.showErrorBox('Internal Error #3', 'No match list has been generated for a locked event') ;                
            }
        }
        else if (p.type_ === PacketType.ProvideResults) {
            try {
                let obj = JSON.parse(p.payloadAsString()) ;
                this.project_!.processResults(obj) ;
                resp = new Packet(PacketType.ReceivedResults) ;
            }
            catch(err) {
                resp = new Packet(PacketType.Error, Buffer.from('internal error #5 - invalid results json received by central host', 'utf-8')) ;
                dialog.showErrorBox('Internal Error #5', 'invalid results json received by central host') ;                          
            }
        }
        else if (p.type_ === PacketType.Goodbye) {
            resp = undefined ;
            let msg: string = 'Tablet \'' + p.payloadAsString() + '\' has completed sync' ;
            this.syncingTablet_ = undefined ;
            this.syncingPurpose_ = undefined ;

            dialog.showMessageBox(this.win_, {
                title: 'Synchronization Complete',
                message: msg,
                type: 'info',
            }) ;
        }
        else {
            resp = new Packet(PacketType.Error, Buffer.from('internal error #4 - invalid packet type received')) ;
            dialog.showErrorBox('Internal Error #4', 'Invalid packet type received') ;   
        }

        return resp ;
    }

    private startSyncServer() {
        this.tcpsyncserver_ = new TCPSyncServer(this.logger_) ;
        this.tcpsyncserver_.init()
            .then(() => { 
                this.logger_.info('TCPSyncServer: initialization completed sucessfully') ;
            })
            .catch((err) => {
                let errobj: Error = err ;
                dialog.showErrorBox('TCP Sync', 'Cannot start TCP sync - ' + err.message) ;
            }) ;
        this.tcpsyncserver_.on('packet', (p: Packet) => { 
            let reply: Packet | undefined = this.processPacket(p) ;
            if (reply) {
                this.tcpsyncserver_!.send(reply)
                    .then(() => {
                        if (reply.type_ === PacketType.Error) {
                            this.tcpsyncserver_!.shutdown() ;
                        }
                    })
            }
            else {
                this.tcpsyncserver_?.shutdown() ;
            }
        });
    }
}

import { SCBase } from '../base/scbase';
import { BlueAlliance } from '../bluealliance/ba';
import { FRCEvent } from '../project/frcevent';
import { Project } from '../project/project';
import { app, BrowserWindow, dialog, Menu, MenuItem } from 'electron' ;
import { Tablet } from '../project/tablet';
import { Team } from '../project/team';

export class SCCentral extends SCBase {
    private project_? : Project = undefined ;
    private ba_? : BlueAlliance = undefined ;
    private baloading_ : boolean ;
    private frcevents_? : FRCEvent[] = undefined ;

    private static openExistingEvent : string = 'open-existing' ;
    private static createNewEvent: string = 'create-new' ;
    private static selectTeamForm: string = 'select-team-form' ;
    private static selectMatchForm: string = 'select-match-form' ;
    private static assignTablets: string = 'assign-tablets' ;
    private static loadBAEvent: string = 'load-ba-event' ;
    private static viewInit: string = 'view-init' ;
    private static lockEvent: string = 'lock-event' ;
    private static editTeams: string = 'edit-teams' ;

    constructor(win: BrowserWindow) {
        super(win) ;

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
                    this.sendTreeData() ;
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
            this.project_!.loadMatchData(this.win_, this.ba_!, fev)
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

    public sendTreeData() : void {
        let treedata = [] ;

        treedata.push({type: 'item', command: 'view-help', 'title' : 'Help'}) ;

        if (this.project_) {
            treedata.push({type: 'item', command: 'view-init', 'title' : 'Event Overview'}) ;
            treedata.push( { type: 'separator', title: 'Teams'}) ;
            treedata.push({ type: 'item', command: 'view-team-form', 'title' : 'Form'}) ;
            treedata.push({ type: 'item', command: 'view-team-status', 'title' : 'Status'}) ;
            if (this.project_.hasTeamData) {
                treedata.push({ type: 'item', command: 'view-team-data', 'title' : 'Data'}) ;
            }

            treedata.push( { type: 'separator', title: 'Match'}) ;
            treedata.push({ type: 'item', command: 'view-match-form-red', 'title' : 'Red Form'}) ;
            treedata.push({ type: 'item', command: 'view-match-form-blue', 'title' : 'Blue Form'}) ;
            treedata.push({ type: 'item', command: 'view-match-status', 'title' : 'Status'}) ;
            if (this.project_.hasMatchData) {
                treedata.push({ type: 'item', command: 'view-match-data', 'title' : 'Data'}) ;
            }
        }

        this.sendToRenderer('send-nav-data', treedata);
    }

    public executeCommand(cmd: string) : void {
        if (cmd === SCCentral.createNewEvent) {
            this.createEvent() ;
            this.sendTreeData() ;
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
            this.setView('info') ;
        }
        else if (cmd === SCCentral.editTeams) {
            this.setView('editteams') ;
        }
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
                        this.setView('info') ;
                        this.sendTreeData() ;
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
}

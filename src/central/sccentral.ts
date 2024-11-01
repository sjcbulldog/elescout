import { SCBase } from "../base/scbase";
import { BlueAlliance } from "../bluealliance/ba";
import { FRCEvent } from "../project/frcevent";
import { Project } from "../project/project";
import { app, BrowserWindow, dialog, Menu, MenuItem } from 'electron' ;

export class SCCentral extends SCBase {
    private project_? : Project = undefined ;
    private ba_? : BlueAlliance = undefined ;
    private baloading_ : boolean ;
    private frcevents_? : FRCEvent[] = undefined ;

    private static openExistingEvent : string = "open-existing" ;
    private static createNewEvent: string = "create-new" ;
    private static selectTeamForm: string = "select-team-form" ;
    private static selectMatchForm: string = "select-match-form" ;
    private static loadBAEvent: string = "load-ba-event" ;

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
        return "content/sccentral/central.html"
    }

    public createMenu() : Menu | null {
        let ret: Menu | null = new Menu() ;

        let filemenu: MenuItem = new MenuItem( {
            type: "submenu",
            label: "File",
            role: "fileMenu"
        }) ;

        let createitem: MenuItem = new MenuItem( {
            type: "normal",
            label: "Create Event ...",
            id: "create-event",
            click: () => { this.executeCommand(SCCentral.createNewEvent)}
        }) ;
        filemenu.submenu?.insert(0, createitem) ;

        let openitem: MenuItem = new MenuItem( {
            type: "normal",
            label: "Open Event ...",
            id: "open-event",
            click: () => { this.executeCommand(SCCentral.openExistingEvent)}            
        }) ;
        filemenu.submenu?.insert(1, openitem) ;

        filemenu.submenu?.insert(2, new MenuItem({type: "separator"}));

        ret.append(filemenu) ;

        let loadmenu: MenuItem = new MenuItem( {
            type: "submenu",
            label: "Import",
            submenu: new Menu()            
        }) ;

        let downloadMatchData: MenuItem = new MenuItem( {
            type: "normal",
            label: "Match Data",
            click: () => { this.downloadMatchData();}
        }) ;
        loadmenu.submenu?.insert(0, downloadMatchData) ;
        ret.append(loadmenu) ;

        let viewmenu: MenuItem = new MenuItem( {
            type: "submenu",
            role: "viewMenu"
        }) ;
        ret.append(viewmenu) ;

        return ret;
    }

    public sendInfoData() : void {
        if (this.project_) {
            let obj = {
                location_ : this.project_.location,
                bakey_ : this.project_.info.frcev_?.evkey,
                name_ : this.project_.info.name,
                teamform_ : this.project_.info.teamform_,
                matchform_ : this.project_.info.matchform_,
                tablets_ : this.project_.info.tablets_,
                teams_ : this.project_.info.teams_,
                matches_ : this.project_.info.matches_,
            };
            this.win_.webContents.send('update-info', obj);
        }
    }

    public sendSelectEventData() : void {
        if (this.project_ && this.isBAAvailable()) {
            this.ba_?.getEvents()
                .then((frcevs) => {
                    this.frcevents_ = frcevs ;
                    this.win_.webContents.send('select-event', frcevs) ;
                })
                .catch((err) => {
                    let errobj : Error = err as Error ;
                    dialog.showErrorBox("Load Blue Alliance Event", errobj.message) ;     
                    this.win_.webContents.send('update-main', 'info') ;
                }) ;

        }
        else {
            this.win_.webContents.send('update-select-event-info', {}) ;
        }
    }

    public loadBaEventData(args: any[]) : void {
        if (!this.isBAAvailable()) {
            let html = "The Blue Alliance site is not available." ;
            this.win_.webContents.send('update-status-title', "Error Loading Event") ;
            this.win_.webContents.send('update-status-html',  html) ;
            this.win_.webContents.send('update-status-view-close-button', true) ;
            return ;
        }

        let fev: FRCEvent | undefined = this.getEventFromKey(args[0]) ;        
        if (fev) {
            this.win_.webContents.send('update-status-title', "Loading event '" + fev.desc + "'") ;
            this.project_!.loadBAEvent(this.win_, this.ba_!, fev)
        }
        else {
            let html = "Event with key '" + args[0] + "' was not found.<br>No event was loaded" ;
            this.win_.webContents.send('update-status-title', "Loading Blue Alliance Event") ;
            this.win_.webContents.send('update-status-html',  html) ;
            this.win_.webContents.send('update-status-view-close-button', true) ;
        }
    }

    private downloadMatchData() {
        if (!this.project_) {
            let html = "Must create or open a project to import data." ;
            this.win_.webContents.send('update-status-visible', true) ;
            this.win_.webContents.send('update-status-title', "Error Importing Match Data") ;
            this.win_.webContents.send('update-status-html',  html) ;
            this.win_.webContents.send('update-status-view-close-button', true) ;
            return ;            
        }

        if (!this.isBAAvailable()) {
            let html = "The Blue Alliance site is not available." ;
            this.win_.webContents.send('update-status-visible', true) ;
            this.win_.webContents.send('update-status-title', "Error Importing Match Data") ;
            this.win_.webContents.send('update-status-html',  html) ;
            this.win_.webContents.send('update-status-view-close-button', true) ;
            return ;
        }

        let fev: FRCEvent | undefined = this.project_?.info.frcev_ ;
        if (fev) {
            this.win_.webContents.send('update-status-visible', true) ;            
            this.win_.webContents.send('update-status-title', "Loading match data for event '" + fev.desc + "'") ;
            this.win_.webContents.send('update-status-html',  "Loading data ...") ;
            this.project_!.loadMatchData(this.win_, this.ba_!, fev)
                .then(() => {
                    this.win_.webContents.send('update-status-view-close-button', true) ;                    
                }) ;
        }
        else {
            let html = "The event is not a blue alliance event" ;
            this.win_.webContents.send('update-status-visible', true) ;
            this.win_.webContents.send('update-status-title', "Load Match Data") ;
            this.win_.webContents.send('update-status-html',  html) ;
            this.win_.webContents.send('update-status-view-close-button', true) ;
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
        this.win_.webContents.send('update-tree', null);
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
    }

    private loadBAEvent() {
        if (this.isBAAvailable()) {
            this.ba_?.getEvents()
                .then((frcevs) => {
                    this.win_.webContents.send('select-event', frcevs);
                })
                .catch((err) => {
                    let errobj : Error = err as Error ;
                    dialog.showErrorBox("Load Blue Alliance Event", errobj.message) ;                    
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
                        this.win_.webContents.send('update-main', 'info') ;
                    })
                    .catch((err) => {
                        let errobj : Error = err as Error ;
                        dialog.showErrorBox("Create Project Error", errobj.message) ;
                    }) ;
            }
        })
        .catch((err) => {
            dialog.showErrorBox("Create Event Error", err.message) ;
        }) ;
    }

    private selectTeamForm() {
        var path = dialog.showOpenDialog({
            title: "Select Team Form",
            message: "Select team scouting form",
            filters: [
                {
                    extensions: ["json"],
                    name: "JSON file for team scouting form"
                },
                {
                    extensions: ["html"],
                    name: "HTML file for team scouting form"
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                this.project_!.setTeamForm(pathname.filePaths[0]) ;
            }
        }) ;
    }

    private selectMatchForm() {
        var path = dialog.showOpenDialog({
            title: "Select Match Form",
            message: "Select match scouting form",
            filters: [
                {
                    extensions: ["json"],
                    name: "JSON file for match scouting form"
                },
                {
                    extensions: ["html"],
                    name: "HTML file for match scouting form"
                }
            ],
            properties: [
                'openFile'
            ],
        });

        path.then((pathname) => {
            if (!pathname.canceled) {
                this.project_!.setMatchForm(pathname.filePaths[0]) ;
            }
        }) ;
    }    

    private openEvent() {
        var path = dialog.showOpenDialog({
            title: "Event descriptor file",
            message: "Select event descriptor file",
            filters: [
                {
                    extensions: ["json"],
                    name: "JSON File for event descriptor"
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
                        this.win_.webContents.send('update-main', 'info', p) ;
                    })
                    .catch((err) => {
                        let errobj : Error = err as Error ;
                        dialog.showErrorBox("Open Project Error", errobj.message) ;
                    }) ;
            }
        })
        .catch((err) => {
            dialog.showErrorBox("Open Event Error", err.message) ;
        }) ;
    }
}

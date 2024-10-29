import { SCBase } from "../base/scbase";
import { Project } from "../project/project";
import { BrowserWindow, dialog } from 'electron' ;

export class SCCentral extends SCBase {
    private project_? : Project = undefined ;
    private static openExistingEvent : string = "open-existing" ;
    private static createNewEvent: string = "create-new" ;
    private static selectTeamForm: string = "select-team-form" ;
    private static selectMatchForm: string = "select-match-form" ;

    constructor(win: BrowserWindow) {
        super(win) ;
    }

    public basePage() : string  {
        return "content/sccentral/central.html"
    }

    public sendInfoData() : void {
        if (this.project_) {
            let obj = {
                location_ : this.project_.location,
                bakey_ : this.project_.info.bakey_,
                teamform_ : this.project_.info.teamform_,
                matchform_ : this.project_.info.matchform_,
                tablets_ : this.project_.info.tablets_,
                teams_ : this.project_.info.teams_,
                matches_ : this.project_.info.matches_,
            };
            this.win_.webContents.send('update-info', obj);
        }
    }

    private requestTreeData() : any {
        let obj = null ;
        if (this.project_) {
            obj = [
                {
                    "title" : "Create New Event",
                    "command" : SCCentral.createNewEvent,
                    "enabled": true
                },
                {
                    "title" : "Open Existing Event",
                    "command" : SCCentral.openExistingEvent,
                    "enabled" : true
                }
            ];
        }
        else {
            obj = [
                {
                    "title" : "Create New Event",
                    "command" : SCCentral.createNewEvent,
                    "enabled": true
                },
                {
                    "title" : "Open Existing Event",
                    "command" : SCCentral.openExistingEvent,
                    "enabled" : true
                }
            ];
        }

        return obj ;
    }

    public isScoutingTablet(): boolean {
        return false ;
    }

    public sendTreeData() : void {
        let obj = this.requestTreeData() ;
        this.win_.webContents.send('update-tree', obj);
    }

    public executeCommand(cmd: string) : void {
        if (cmd === SCCentral.createNewEvent) {
            this.createEvent() ;
            this.sendTreeData() ;
        }
        else if (cmd === SCCentral.openExistingEvent) {
            this.openEvent() ;
        }
        else if (cmd == SCCentral.selectMatchForm) {
            this.selectMatchForm() ;
        }
        else if (cmd == SCCentral.selectTeamForm) {
            this.selectTeamForm() ;
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
                this.project_!.setMatchForm(pathname.filePaths[0]) ;
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

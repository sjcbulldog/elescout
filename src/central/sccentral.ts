import { SCBase } from "../base/scbase";
import { Project } from "../project/project";
import { BrowserWindow, dialog } from 'electron' ;

export class SCCentral extends SCBase {
    private project_? : Project = undefined ;
    private static openExistingEvent : string = "open-existing" ;
    private static createNewEvent: string = "create-new" ;

    constructor(win: BrowserWindow) {
        super(win) ;
    }

    public basePage() : string  {
        return "content/sccentral/central.html"
    }

    public sendInfoData() : void {
        if (this.project_) {
            this.win_.webContents.send('update-info', this.project_.info);
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

    private openEvent() {
        var path = dialog.showOpenDialog({
            title: "Event descriptor file",
            message: "Select even descriptor file",
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

import { IPCSetStatus, IPCSetView } from "../../shared/ipcinterfaces";
import { XeroLogger } from "../utils/xerologger";
import { XeroInfoView } from "../views/infoview";
import { XeroNav } from "../xeronav";
import { XeroSelectEvent } from "../views/selectevent";
import { XeroTextView } from "../views/textview";
import { XeroView } from "../views/xeroview";
import { XeroMainProcessInterface } from "../widgets/xerocbtarget";
import { XeroSplitter } from "../widgets/xerosplitter";
import { XeroStatusWindow } from "../widgets/xerostatus";
import { XeroWidget } from "../widgets/xerowidget";
import { XeroAssignTablets } from "../views/assigntablets";
import { XeroEditFormView } from "../views/forms/editformview";

document.addEventListener('DOMContentLoaded', function () {
    let mainapp = new XeroApp() ;
}) ;

export class XeroApp extends XeroMainProcessInterface {
    private viewmap_ : Map<string, any> = new Map() ;                   // Map of view name to class

    private status_ : XeroStatusWindow ;
    private splitter_ : XeroSplitter ;
    private left_nav_pane_ : XeroNav ;
    private right_view_pane_ : XeroWidget ;
    private current_view_ : XeroView | undefined ;

    constructor() {
        super() ;
        let body = document.getElementsByTagName("body")[0] ;

        this.left_nav_pane_ = new XeroNav() ;
        this.right_view_pane_ = new XeroWidget('div', "xero-view-pane") ;
        this.splitter_ = new XeroSplitter("horizontal", this.left_nav_pane_, this.right_view_pane_) ;
        this.splitter_.setSplit(5) ;

        this.status_ = new XeroStatusWindow(this.splitter_) ;
        this.status_.setParent(body) ;

        this.status_.statusBar().setLeftStatus("Xero App - Ready") ;

        this.registerCallback('update-main-window-view', this.updateView.bind(this)) ;
        this.registerCallback('send-app-status', this.updateStatusBar.bind(this)) ;
        this.registerViews() ;
    }

    private updateStatusBar(args: IPCSetStatus) {
        let logger = XeroLogger.getInstance() ;
        logger.debug(`request to update status bar to '${args.left}' '${args.middle}' '${args.right}'`) ;
        this.status_.statusBar().setLeftStatus(args.left) ;
        this.status_.statusBar().setMiddleStatus(args.middle) ;
        this.status_.statusBar().setRightStatus(args.right) ;
    }

    public updateView(args: IPCSetView) {
        let logger = XeroLogger.getInstance() ;

        this.closeCurrentView() ;

        if (!this.viewmap_.has(args.view)) {
            logger.error(`view ${args.view} not registered`) ;
        }
        else {
            let classObj = this.viewmap_.get(args.view) ;
            this.current_view_ = new classObj(this, args.args) ;
            this.right_view_pane_.elem.appendChild(this.current_view_!.elem) ;
        }
    }

    private closeCurrentView() {
        if (this.current_view_) {
            this.current_view_.close() ;
            this.right_view_pane_.elem.removeChild(this.current_view_!.elem) ;
            this.current_view_ = undefined ;
        }
    }

    private registerView(view: string, viewclass: any) {
        this.viewmap_.set(view, viewclass) ;
    }

    private registerViews() {
        this.registerView('text', XeroTextView) ;
        this.registerView('info', XeroInfoView) ;
        this.registerView('select-event', XeroSelectEvent) ;
        this.registerView('assign-tablets', XeroAssignTablets) ;
        this.registerView('form-edit', XeroEditFormView) ;
    }
}

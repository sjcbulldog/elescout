import { XeroApp } from "../apps/xeroapp";
import { DatabaseView } from "./dbview";

export class XeroTeamDatabaseView extends DatabaseView {
    public constructor(app: XeroApp, clname: string) {
        super(app, 'xero-team-db-view', 'team') ;
    }
}
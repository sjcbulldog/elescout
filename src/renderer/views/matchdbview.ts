import { XeroApp } from "../apps/xeroapp";
import { DatabaseView } from "./dbview";

export class XeroMatchDatabaseView extends DatabaseView {
    public constructor(app: XeroApp) {
        super(app, 'xero-match-db-view', 'match') ;
    }
}
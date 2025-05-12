import { XeroApp } from "../apps/xeroapp";
import { DatabaseView } from "./dbview";

export class TeamDatabaseView extends DatabaseView {
    public constructor(app: XeroApp, clname: string) {
        super(app, clname) ;
    }
}
import { XeroApp } from "../apps/xeroapp";
import { DatabaseView } from "./dbview";

export class XeroMatchDatabaseView extends DatabaseView {
    public constructor(app: XeroApp, clname: string) {
        super(app, clname, 'match') ;
    }
}
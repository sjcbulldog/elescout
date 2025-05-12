import { XeroApp } from "../apps/xeroapp";
import { XeroView } from "./xeroview";

export class XeroTeamStatus extends XeroView {
    public constructor(app: XeroApp, args: any[]) {
        super(app, 'xero-team-status') ;
    }
}
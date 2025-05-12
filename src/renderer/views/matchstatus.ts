import { XeroApp } from "../apps/xeroapp";
import { XeroView } from "./xeroview";

export class XeroMatchStatus extends XeroView {
    public constructor(app: XeroApp, args: any[]) {
        super(app, 'xero-team-status') ;
    }
}
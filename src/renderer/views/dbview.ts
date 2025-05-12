import { XeroApp } from "../apps/xeroapp";
import { XeroView } from "./xeroview";

export class DatabaseView extends XeroView {
    protected constructor(app: XeroApp, clname: string, type: string) {
        super(app, clname);

        this.registerCallback('send-' + type + '-db', this.receiveData.bind(this));
        this.registerCallback('send-' + type + '-col-config', this.receiveColConfig.bind(this));
    }

    private receiveData(data: any) {
    }

    private receiveColConfig(data: any) {
    }
}
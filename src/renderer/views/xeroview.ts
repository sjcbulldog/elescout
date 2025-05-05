import { XeroApp } from "../apps/xeroapp";
import { XeroWidget } from "../widgets/xerowidget";

export class XeroView extends XeroWidget {
    private app_ : XeroApp ;

    constructor(app: XeroApp, cname: string) {
        super('div', cname) ;
        this.app_ = app ;
    }

    public app() : XeroApp {
        return this.app_ ;
    }

    public reset() {
        this.elem.innerHTML = "" ;
    }
}

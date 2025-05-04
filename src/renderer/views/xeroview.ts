import { XeroWidget } from "../widgets/xerowidget";

export class XeroView extends XeroWidget {
    constructor(cname: string) {
        super('div', cname) ;
    }

    public reset() {
        this.elem.innerHTML = "" ;
    }
}

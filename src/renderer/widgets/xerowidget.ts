import { XeroMainProcessInterface } from "./xerocbtarget";

declare global {
    interface HTMLElement {
        xerodata: any;
    }
}

export class XeroWidget extends XeroMainProcessInterface {
    public readonly elem: HTMLElement;
    private parentWidget_ : XeroWidget | undefined = undefined;

    public constructor(etype: string, cname: string) {
        super();
        
        this.elem = document.createElement(etype);
        this.elem.className = cname;
    }

    public close() {
        this.unregisterAllCallbacks();
    }

    public parent(): HTMLElement {
        return this.elem.parentElement!;
    }

    public parentWidget(): XeroWidget | undefined {
        return this.parentWidget_;
    }    

    public setParent(parent: HTMLElement) {
        if (this.elem.parentElement) {
            this.elem.parentElement.removeChild(this.elem);
        }
        parent.appendChild(this.elem);
    }

    public setParentWidget(parent: XeroWidget) {
        this.parentWidget_ = parent;
        this.setParent(this.parentWidget_!.elem);
    }
}

export class XeroView {
    protected static empty(div: HTMLElement) {
        while (div.hasChildNodes) {
            div.removeChild(div.firstChild!) ;
        }
    }
}
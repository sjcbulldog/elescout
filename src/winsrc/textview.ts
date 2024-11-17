import { XeroView } from "./xeroview";

export class TextView extends XeroView {
    private top_ : HTMLElement ;
    private empty_div_: HTMLElement ;
    private span_: HTMLElement ;

    constructor(div: any, text: string) {
        super() ;

        this.top_ = div ;
        this.empty_div_ = document.createElement('div') ;
        this.empty_div_.id = 'empty-div' ;
        this.span_ = document.createElement('span') ;
        this.span_.id = 'empty-span' ;
        this.span_.innerHTML = '<b>' + text + '</b>';
        this.empty_div_.appendChild(this.span_) ;
    }

    public render() {
        XeroView.empty(this.top_) ;
        this.top_.appendChild(this.empty_div_) ;
    }
}
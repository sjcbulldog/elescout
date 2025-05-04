import { XeroView } from "./xeroview";

export class XeroTextView extends XeroView {
    private message_: string ;
    private empty_div_: HTMLDivElement ;
    private span_: HTMLSpanElement ;

    constructor(args: any[]) {
        super('xero-text-view') ;

        this.message_ = args[0] ;

        this.empty_div_ = document.createElement("div") ;
        this.empty_div_.className = "xero-text-div" ;
    
        this.span_ = document.createElement("span") ;
        this.span_.className = "xero-text-span" ;
        this.span_.innerHTML = "<b>" + this.message_ + "</b>" ;
        
        this.empty_div_.append(this.span_);

        this.reset() ;
        this.elem.append(this.empty_div_) ;
    }
    
    public setText(text: string) {
        this.elem.innerHTML = text ;
    }
}
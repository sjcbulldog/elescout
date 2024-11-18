class TextView extends XeroView {
    constructor(div, viewtype, message) {
        super(div, viewtype) ;

        this.message_ = message ;

        this.empty_div_ = document.createElement("div") ;
        this.empty_div_.id = "empty-div" ;
    
        this.span_ = document.createElement("span") ;
        this.span_.id = "empty-span" ;
        this.span_.innerHTML = "<b>" + this.message_ + "</b>" ;
        
        this.empty_div_.append(this.span_);
    }

    render() {
        this.reset() ;
        this.top_.append(this.empty_div_) ;
    }
}

class EmptyView extends TextView {
    constructor(div, viewtype) {
        super(div, viewtype, "No Event Loaded");
    }
}

class ErrorView extends TextView {
    constructor(div, viewtype) {
        super(div, viewtype, "Internal Error Occurred");
    }
}
class FieldBasedView extends XeroView {
    constructor(div, viewtype) {
        super(div, viewtype) ;
    }
}

class ZebraTeamView extends FieldBasedView {
    constructor(div, viewtype) {
        super(div, viewtype) ;
    }
}

class ZebraMatchView extends FieldBasedView {
    constructor(div, viewtype) {
        super(div, viewtype);

        this.createWindowLayout() ;

        this.registerCallback('send-zebra-match-data', this.formCallback.bind(this));
        this.registerCallback('send-zebra-match-list', this.matchlistCallback.bind(this));
        window.scoutingAPI.send("get-zebra-match-list");
    }

    createWindowLayout() {
        this.layout_ = document.createElement('div') ;
        this.layout_.id = 'zebra_match_layout' ;

        this.selector_div_ = document.createElement('div') ;
        this.selector_div_.id = 'zebra_match_selector_div' ;
        this.layout_.append(this.selector_div_) ;

        this.selector_ = document.createElement('select');
        this.selector_.id = 'zebra_match_selector' ;
        this.selector_div_.append(this.selector_);
    
        this.canvas_ = document.createElement('div') ;
        this.canvas_.id = 'zebra_match_canvas' ;
        this.layout_.append(this.canvas_) ;
    }

    render() {
        this.reset() ;
        this.top_.append(this.layout_) ;
    }

    matchlistCallback(args) {
        for(let one of args[0]) {
            let label = one.comp_level + '-' + one.set_number + '-' + one.match_number ;
            let opt = document.createElement('option') ;
            opt.value = one.key ;
            opt.text = label ;
            this.selector_.append(opt) ;
        }
    }

    formCallback(arg) {
        this.reset();

        this.top_div_ = document.createElement('div') ;
        this.createGraph(this.top_div_) ;
    }


}

window.scoutingAPI.receive("send-zebra-match-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-zebra-match-data', args); });
window.scoutingAPI.receive("send-zebra-match-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-zebra-match-list', args); });

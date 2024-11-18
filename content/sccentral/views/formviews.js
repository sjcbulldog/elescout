
class FormView extends XeroView {
    constructor(div, type, formtype) {
        super(div, type) ;
        this.type_ = formtype ;

        this.buildInitialView('Waiting on form ...') ;
        this.registerCallback('send-' + this.type_ + '-form', this.formCallback.bind(this));
        window.scoutingAPI.send('get-' + this.type_ + '-form');       
    }

    formCallback(args) {
        let obj = args[0] ;
        if (obj.errormsg.length > 0) {
            this.top_.innerText = obj.errormsg ;
        }
        else {
            this.reset() ;
            formViewJsonToForm(this.top_, obj.formjson, this.type_) ;
        }
    }
}

class PreviewFormView extends FormView {
    constructor(div, viewtype) {
        super(div, viewtype, 'preview') ;
    }
}

class MatchFormView extends FormView {
    constructor(div, viewtype) {
        super(div, viewtype, 'match') ;
    }
}

class TeamFormView extends FormView {
    constructor(div, viewtype) {
        super(div, viewtype, 'team') ;
    }
}

window.scoutingAPI.receive("send-preview-form", (args) => { XeroView.callback_mgr_.dispatchCallback('send-preview-form', args) ; }) ;
window.scoutingAPI.receive("send-team-form", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-form', args) ; }) ;
window.scoutingAPI.receive("send-match-form", (args) => { XeroView.callback_mgr_.dispatchCallback('send-match-form', args) ; }) ;
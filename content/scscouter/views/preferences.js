
class PreferencesView extends XeroView {
    constructor(div, viewtype) {
        super(div, viewtype) ;

        this.sections_ = [] ;

        this.buildInitialView('Waiting for preferences ...') ;
        this.registerCallback('send-preferences',this.formCallback.bind(this)) ;
        window.scoutingAPI.send('get-preferences');
    }

    formCallback(args) {
        let prefs = args[0] ;

        this.reset() ;

        this.pref_top_ = document.createElement('div') ;
        this.pref_top_.className = 'prefs-top' ;
        this.top_.append(this.pref_top_) ;

        let section = document.createElement('div') ;
        section.className = 'prefs-section' ;
        this.sections_.push(section) ;
        this.pref_top_.append(section) ;

        let sync = this.createSectionHeader(section, 'Synchronization') ;
        let desc = 'This is the IP address for the cental computer used for synchronization' ;
        this.ipaddr_ = this.createTextItem(section, 'Server IP Address', desc) ;
        this.ipaddr_.value = prefs.ipaddr_ ;

        this.createButtonBar(this.pref_top_) ;
    }

    cancelPress() {
        setNewMainView('empty') ;
    }

    savePress() {
        let prefs = {
            ipaddr_ : this.ipaddr_.value
        }
        window.scoutingAPI.send('update-preferences', prefs);
        setNewMainView('empty') ;
    }

    createButtonBar(ptop) {
        let div = document.createElement('div') ;
        div.className = 'prefs-button-bar';
        ptop.append(div) ;

        let save = document.createElement('button') ;
        save.textContent = 'Save' ;
        save.onclick = this.savePress.bind(this) ;
        div.append(save) ;

        let cancel = document.createElement('button') ;
        cancel.textContent = 'Cancel' ;
        cancel.onclick = this.cancelPress.bind(this) ;
        div.append(cancel) ;
    }

    createTextItem(section, title, desc) {
        let div = document.createElement('div') ;
        div.className = 'prefs-title' ;
        div.innerText = title ;
        section.append(div) ;

        div = document.createElement('div') ;
        div.className = 'prefs-desc' ;
        div.innerText = desc ;
        section.append(div) ;

        let indiv = document.createElement('input') ;
        indiv.className = 'prefs-text' ;
        indiv.type = 'text' ;
        section.append(indiv) ;

        return indiv ;
    }

    createSectionHeader(section, name) {
        let div = document.createElement('div') ;
        div.className = 'prefs-section-header' ;
        div.innerText = name ;

        section.append(div) ;
        return div ;
    }
}

window.scoutingAPI.receive("send-preferences", (args) => { XeroView.callback_mgr_.dispatchCallback('send-preferences', args); });


class FormView extends XeroView {
    static buttonClassUnselected = 'form-tab-button-unselected' ;
    static buttonClassSelected = 'form-tab-button-selected' ;

    constructor(div, type, args) {
        super(div, type) ;

        // Should be team, match, or preview
        this.type_ = args[1] ;
        this.parent_ = div ;

        this.buildInitialView('Waiting on form ...') ;
        this.registerCallback('send-form', this.formCallback.bind(this));
        this.registerCallback('request-results',this.requestResults.bind(this)) ;
        this.registerCallback('send-initial-values',this.initializeForm.bind(this)) ;
        window.scoutingAPI.send('get-form', this.type_);
    }

    formCallback(args) {
        let obj = args[0] ;
        if (obj.message && obj.message.length > 0) {
            this.top_.innerText = obj.message ;
        }
        else {
            this.reset() ;
            this.titlediv_ = document.createElement('div') ;
            this.titlediv_.innerText = obj.form.title ;
            if (obj.form.type === 'preview') {
                this.titlediv_.innerText += ' - ' + obj.form.json.form ;
            }
            this.titlediv_.className = 'form-view-title' ;
            this.parent_.append(this.titlediv_) ;
            this.parent_.append(this.formViewJsonToForm(obj.form.json)) ;
            this.formViewSelect(this.sectnames_[0]) ;
        }
    }

    formViewNormalizeName(name) { 
        let ret = '' ;
    
        for(let ch of name) {
            if (ch.match(/[a-z]/i)) {
                ret += ch ;
            }
            else {
                ret += '_' ;
            }
        }
    
        return ret ;
    }
    
    formViewHideAll(sections) {
        for(let sectname of this.sectnames_) {
            let qstr = '#' + sectname + '-button' ;
            $(qstr).css("border", "none" );
        }

        for(let section of this.sections_) {
            section.hidden = true ;
        }
    }
    
    formViewSelectButton(ev) {
        this.formViewSelect(ev.target.xerosectname) ;
    }

    formViewSelect(sectname) {
        this.formViewHideAll() ;
        for(let sect of this.sections_) {
            if (sect.id === sectname) {
                sect.hidden = false ;
                break ;
            }
        }
        let qstr = '#' + sectname + '-button' ;
        $(qstr).css("border", "3px solid black" );
    }
    
    formViewCreateTabBar() {
        this.bardiv_ = document.createElement('div') ;
        this.bardiv_.className = 'formtab' ;
    
        for(let section of this.sectnames_) {
            let button = document.createElement('button') ;
            button.innerText = section ;
            button.className = FormView.buttonClassUnselected ;
            button.id = section + '-button' ;
            button.xerosectname = section;
            button.onclick = this.formViewSelectButton.bind(this) ;
            this.bardiv_.append(button) ;
        }
    
        return this.bardiv_ ;
    }
    
    formViewCreateText(item) {
        let div = document.createElement('div') ;
        let label = document.createElement('label') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
    
        let lin = document.createElement('input') ;
        lin.className = 'form-item-text' ;
        lin.setAttribute("type", "text");
        if (item.maxlen) {
            lin.maxLength = item.maxlen ;
        }
        lin.xerotag = item.tag ;
        lin.xerotype = 'text' ;
        lin.xerovalue = '' ;
        lin.addEventListener('input', function() {
            lin.xerovalue = lin.value ;
        }) ;
        label.for = lin ;
        div.append(label) ;
        div.append(lin) ;
        return div ;
    }
    
    formViewCreateChoice(item) {
        let div = document.createElement('div') ;
        let label = document.createElement('label') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
    
        const select = document.createElement('select');
        select.className = 'form-item-choice' ;
    
        for(let choice of item.choices) {
            const opt = document.createElement('option');    
            opt.value = choice ;
            opt.text = choice ;
            select.append(opt) ;
        }
        select.xerovalue = item.choices[0] ;
    
        select.addEventListener("change", function() {
            select.xerovalue = select.value ;
        });
    
        select.xerotag = item.tag ;
        select.xerotype = 'select' ;
        
        label.for = select ;
        div.append(label) ;
        div.append(select) ;
        return div ;    
    }
    
    formViewCreateBoolean(item) {
        let div = document.createElement('div') ;
        let label = document.createElement('label') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
    
        let lin = document.createElement('input') ;
        lin.className = 'form-item-boolean' ;
        lin.setAttribute("type", "checkbox");
        lin.xerovalue = false;
    
        lin.addEventListener('change', (event) => {
            lin.xerovalue = event.target.checked ;
        });
    
        lin.xerotag = item.tag ;
        lin.xerotype = 'boolean' ;
    
        label.for = lin ;
        div.append(label) ;
        div.append(lin) ;
        return div ;
    }
    
    incrUpDown(item) {
        let numstr = item.textContent ;
        let num = parseInt(numstr) ;
        if (num < item.maximumValue) {
            num++ ;
        }
        item.textContent = num ;
        item.xerovalue = num ;
    }
    
    decrUpDown(item) {
        let numstr = item.textContent ;
        let num = parseInt(numstr) ;
        if (num > item.minimumValue) {
            num-- ;
        }
        item.textContent = num ;
        item.xeroValue = num ;
    }
    
    formViewCreateUpdown(item) {
        let div = document.createElement('div') ;
        div.className = 'form-item-updown-div' ;
        let label = document.createElement('p') ;
        label.className = 'form-item-label' ;
        label.textContent = item.name ;
    
        let count = document.createElement('p') ;
        count.innerText = '0' ;
        count.xerotag = item.tag ;
        count.xerotype = 'updown' ;
        count.className = 'form-item-updown' ;
        count.minimumValue = item.minimum;
        count.maximumValue = item.maximum ;
        count.xerovalue = 0 ;
    
        let plus = document.createElement('button') ;
        plus.className = 'form-item-updown-button' ;
        plus.textContent = '+' ;
        plus.onclick = () => { incrUpDown(count) } ;
    
        let minus = document.createElement('button') ;
        minus.className = 'form-item-updown-button' ;
        minus.textContent = '-' ;
        minus.onclick = () => { decrUpDown(count) } ;
    
        div.append(label) ;
        div.append(minus) ;
        div.append(count) ;
        div.append(plus) ;
        return div ;
    }
    
    formViewCreateItem(item) {
        let div ;
        if (item.type === 'text') {
            div = this.formViewCreateText(item) ;
        }
        else if (item.type === 'choice') {
            div = this.formViewCreateChoice(item) ;
        }
        else if (item.type === 'boolean') {
            div = this.formViewCreateBoolean(item) ;
        }
        else if (item.type === 'updown') {
            div = this.formViewCreateUpdown(item) ;
        }
        return div ;
    }
    
    formViewCreateSection(section) {
        let secname = this.formViewNormalizeName(section.name) ;
        let secdiv = document.createElement('div') ;
        secdiv.id = secname ;
        for(let item of section.items) {
            secdiv.append(this.formViewCreateItem(item)) ;
        }
    
        return secdiv ;
    }
    
    formViewJsonToForm(form) {
        this.formtop_ = document.createElement('div') ;
        this.sectnames_ = [] ;
        this.sections_ = [] ;

        //
        // Gather section names (normalized)
        //
        for(let section of form.sections) {
            this.sectnames_.push(this.formViewNormalizeName(section.name)) ;
        }

        //
        // Create the tab bar
        //
        this.tabbar_ = this.formViewCreateTabBar() ;
        this.formtop_.append(this.tabbar_) ;    

        //
        // Create the sections
        //
        for(let section of form.sections) {
            let secdiv = this.formViewCreateSection(section) ;
            this.sections_.push(secdiv) ;
            this.formtop_.append(secdiv) 
        }

        return this.formtop_ ;

    }
    
    returnResultRecursively(elem, result) {
        if (elem.xerotag) {
            let one = {
                tag: elem.xerotag,
                type: elem.xerotype,
                value: elem.xerovalue
            } ;
            result.push(one) ;
        }
    
        for(let child of elem.childNodes) {
            this.returnResultRecursively(child, result) ;
        }
    }
    
    requestResults() {
        //
        // Extract the results from the form and send to the main process
        //
        const element = document.getElementById("rightcontent");
        let result = [] ;
        this.returnResultRecursively(element, result) ;
        window.scoutingAPI.send("provide-result", result);
    }
    
    findElemByTag(elem, tag) {
        if (elem.xerotag === tag) {
            return elem ;
        }
    
        for(let child of elem.childNodes) {
            let answer = this.findElemByTag(child, tag)
            if (answer) {
                return answer ;
            }
        }
    
        return undefined ;
    }
    
    setXeroValue(elem, one) {
        if (one.value) {
            elem.xerovalue = one.value ;
            if (one.type === 'text') {
                elem.value = one.value ;
            }
            else if (one.type === 'updown') {
                elem.innerText = one.value ;
            }
            else if (one.type === 'boolean') {
                elem.checked = one.value ;
            }
            else if (one.type === 'choice') {
                elem.value = one.value ;
            }
        }
    }
    
    initializeForm(arg) {
        //
        // Initialize the form with existing form values
        //
        for(let one of arg[0]) {
            let elem = this.findElemByTag(this.formtop_, one.tag) ;
            this.setXeroValue(elem, one) ;
        }
    }
}

window.scoutingAPI.receive("send-form", (args) => { XeroView.callback_mgr_.dispatchCallback('send-form', args); });
window.scoutingAPI.receive("request-results", (args) => { XeroView.callback_mgr_.dispatchCallback('request-results', args); });
window.scoutingAPI.receive("send-initial-values", (args) => { XeroView.callback_mgr_.dispatchCallback('send-initial-values', args); });
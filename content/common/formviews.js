
class FormView extends XeroView {
    static buttonClassUnselected = 'form-tab-button-unselected' ;
    static buttonClassSelected = 'form-tab-button-selected' ;

    constructor(div, type, args) {
        super(div, type) ;

        // Should be team, match, or preview
        this.type_ = args[1] ;

        this.buildInitialView('Waiting on form ...') ;
        this.registerCallback('send-form', this.formCallback.bind(this));
        this.registerCallback('request-results',this.requestResults.bind(this)) ;
        this.registerCallback('send-initial-values',this.initializeForm.bind(this)) ;
        this.scoutingAPI('get-form', this.type_);

        this.nameToSectionMap_ = new Map() ;
    }

    requestResults() {
        let results = [] ;
        for(let sect of this.sections_) {
            results = [...results, ...sect.getValues()] ;
        }
        this.scoutingAPI("provide-result", results);
    }

    formCallback(args) {
        let obj = args[0] ;
        if (obj.message && obj.message.length > 0) {
            this.top_.innerText = obj.message ;
        }
        else {
            let color = 'blue' ;
            let reversed = false ;

            if (obj.color) {
                color = obj.color ;
            }

            if (obj.reversed) {
                reversed = obj.reversed ;
            }

            this.reset() ;
            this.image_descs_ = obj.form.images;
            this.loadImages() ;

            this.alltop_ = document.createElement('div') ;
            this.alltop_.className = 'form-view-topmost' ;

            this.titlediv_ = document.createElement('div') ;
            this.titlediv_.innerText = obj.form.title ;
            this.titlediv_.style.color = color ;
            if (obj.form.type === 'preview') {
                this.titlediv_.innerText += ' - ' + obj.form.json.form + (reversed ? ' - reversed' : '') ;
            }
            this.titlediv_.className = 'form-view-title' ;
            this.alltop_.append(this.titlediv_) ;
            this.alltop_.append(this.formViewJsonToForm(obj.form.json, color, reversed)) ;
            this.top_.append(this.alltop_) ;
            this.formViewSelect(this.sectnames_[0]) ;

        }
    }

    imageLoadComplete(im) {
        im.loaded_ = true ;

        if (this.current_section_) {
            this.formViewSelect(this.current_section_) ;
        }
    }
    
    findImage(name) {
        if (this.image_descs_) {
            for(let im of this.image_descs_) {
                if (im.name === name) {
                    return im ;
                }
            }
        }

        return undefined ;
    }

    loadImages() {
        if (this.image_descs_) {
            for(let im of this.image_descs_) {
                let imagedata = im.data ;
                im.image_ = document.createElement('img') ;
                im.loaded_ = false ;
                im.image_.src = `data:image/jpg;base64,${imagedata}`
                im.image_.onload = this.imageLoadComplete.bind(this, im) ;
            }
        }
    }
    
    formViewHideAll(sections) {
        for(let sectname of this.sectnames_) {
            let qstr = '#' + sectname + '-button' ;
            $(qstr).css("border", "none" );
        }

        for(let section of this.sections_) {
            section.top_.hidden = true ;
        }
    }
    
    formViewSelectButton(ev) {
        this.formViewSelect(ev.target.xerosectname) ;
    }

    formViewSelect(sectname) {
        let selsect = undefined ;
        this.current_section_ = sectname ;

        this.formViewHideAll() ;
        for(let sect of this.sections_) {
            if (sect.name_ === sectname) {
                selsect = sect ;
                break ; 
            }
        }

        if (selsect) {
            selsect.top_.hidden = false;
            if (selsect.isimage_) {
                selsect.drawImageSection(this) ;
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

    formViewCreateSection(section, color, reversed) {
        let secobj ;

        if (section.image) {
            let info = this.findImage(section.image) ;
            secobj = new XeroImageSection(info, section, color, reversed) ;
        }
        else {
            secobj = new XeroControlSection(section, color) ;
        }

        return secobj ;
    }

    formViewJsonToForm(form, color, reversed) {
        this.formtop_ = document.createElement('div') ;
        this.formtop_.className = 'form-top-div' ;
        this.sectnames_ = [] ;
        this.sections_ = [] ;

        //
        // Gather section names (normalized)
        //
        for(let section of form.sections) {
            this.sectnames_.push(XeroBaseSection.formViewNormalizeName(section.name)) ;
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
            let secobj = this.formViewCreateSection(section, color, reversed) ;
            for(let tag of secobj.tags_) {
                this.nameToSectionMap_.set(tag, secobj) ;
            }
            secobj.top_.className = 'form-section-contents' ;
            this.sections_.push(secobj) ;
            this.formtop_.append(secobj.top_) 
        }

        return this.formtop_ ;
    }
    
    initializeForm(arg) {
        //
        // Initialize the form with existing form values
        //
        for(let one of arg[0]) {
            if (this.nameToSectionMap_.has(one.tag)) {
                this.nameToSectionMap_.get(one.tag).setValue(one.tag, one.type, one.value) ;
            }
        }

        if (this.current_section_) {
            this.formViewSelect(this.current_section_) ;
        }
    }
}

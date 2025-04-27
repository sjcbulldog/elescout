
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
        this.registerCallback('initialize-form', this.initializeForm.bind(this)) ;
        this.registerCallback('send-image-data', this.receiveImageData.bind(this)) ;

        this.scoutingAPI('get-form', this.type_);

        this.currentSectionIndex_ = -1 
        this.formctrlitems_ = [] ;
        this.nameToImageMap = new Map() ;
    }

    initDisplay() {
        this.reset() ;

        this.alltop_ = document.createElement('div') ;
        this.alltop_.className = 'form-view-topmost' ;

        this.titlediv_ = document.createElement('div') ;
        let tname = this.type_.charAt(0).toUpperCase() + this.type_.slice(1) ;
        this.titlediv_.innerText = tname + ' Form' ;
        this.titlediv_.className = 'form-view-title' ;
        this.alltop_.append(this.titlediv_) ;

        this.bardiv_ = document.createElement('div') ;
        this.bardiv_.className = 'form-view-tab' ;
        this.alltop_.append(this.bardiv_) ;

        this.formimg_ = document.createElement('img') ;
        this.formimg_.className = 'form-view-form' ;
        this.formimg_.style.pointerEvents = 'none' ;
        this.alltop_.style.userSelect = 'none' ;
        this.alltop_.append(this.formimg_) ;

        this.top_.append(this.alltop_) ;
        this.top_.style.userSelect = 'none' ;
    }

    formViewSelectButton(event) {
        if (this.currentSectionIndex_ !== -1) {
            this.bardiv_.children.item(this.currentSectionIndex_).className = FormView.buttonClassUnselected ;
        }

        if (event.target.section_index !== undefined) {
            this.setCurrentSectionByIndex(event.target.section_index) ;
        }
    }

    formViewUpdateTabBar() {
        this.bardiv_.innerHTML = '' ;
        let index = 0 ;
        for(let section of this.form_.sections) {
            let button = document.createElement('button') ;
            button.innerText = section.name ;
            button.className = FormView.buttonClassUnselected ;
            button.id = section + '-button' ;
            button.section_index = index++ ;
            button.xerosectname = section;
            button.onclick = this.formViewSelectButton.bind(this) ;
            this.bardiv_.append(button) ;
        }  
        return this.bardiv_ ;
    }

    removeExistingControls() {
        for(let entry of this.formctrlitems_) {
            if (entry.ctrl) {
                if (this.alltop_.contains(entry.ctrl)) {
                    this.alltop_.removeChild(entry.ctrl) ;
                }
            }
        }
        this.formctrlitems_ = [] ;
    }

    editdone(changed) {
        // TODO: send scouting data changes to main process
    }

    updateControls() {
        this.removeExistingControls() ;

        let section = this.form_.sections[this.currentSectionIndex_] ;
        if (section.items) {
            for(let item of section.items) {
                let formctrl ;
                if (item.type === FormControl.ctrlTypeLabel) {
                    formctrl = new LabelFormControl(this.editdone.bind(this), item.tag, item.x, item.y, item.width, item.height) ;
                    formctrl.update(item) ;
                }
                else if (item.type === FormControl.ctrlTypeText) {
                    formctrl = new TextFormControl(this.editdone.bind(this), item.tag, item.x, item.y, item.width, item.height) ;
                    formctrl.update(item) ;
                }
                else if (item.type === FormControl.ctrlTypeBoolean) {  
                    formctrl = new BooleanFormControl(this.editdone.bind(this), item.tag, item.x, item.y, item.width, item.height) ;
                    formctrl.update(item) ;
                }
                else if (item.type === FormControl.ctrlTypeUpDown) {
                    formctrl = new UpDownFormControl(this.editdone.bind(this), item.tag, item.x, item.y, item.width, item.height) ;
                    formctrl.update(item) ;
                }
                else if (item.type === FormControl.ctrlTypeMultipleChoice) {
                    formctrl = new MultipleChoiceFormControl(this.editdone.bind(this), item.tag, item.x, item.y, item.width, item.height) ;
                    formctrl.update(item) ;
                }
                else if (item.type === FormControl.ctrlTypeSelect) {
                    formctrl = new SelectFormControl(this.editdone.bind(this), item.tag, item.x, item.y, item.width, item.height) ;
                    formctrl.update(item) ;
                }

                if (formctrl) {
                    this.formctrlitems_.push(formctrl) ;
                    formctrl.create(this.alltop_) ;
                }
            }
        }
    }

    updateSectionDisplay() {
        let imname = this.form_.sections[this.currentSectionIndex_].image ;
        let data = this.nameToImageMap.get(imname) ;
        this.formimg_.src = `data:image/jpg;base64,${data}`
        this.updateControls() ;
    }

    setCurrentSectionByIndex(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.form_.sections.length) {
            return false ;
        }
        this.currentSectionIndex_ = sectionIndex ;
        this.bardiv_.children.item(this.currentSectionIndex_).className = FormView.buttonClassSelected ;
        this.updateSectionDisplay() ;
        return true ;
    }

    receiveImageData(args) {
        let name = args[0].name ;
        let data = args[0].data ;

        this.nameToImageMap.set(name, data) ;

        if (this.form_ && this.form_.sections && this.form_.sections.length !== 0) {
            let section = this.form_.sections[this.currentSectionIndex_] ;
            if (section.image === name) {
                this.updateSectionDisplay() ;
            }
        }
    }

    initializeForm(data) {
    }

    formCallback(data) {
        let info = data[0] ;
        if (info == null) {
            this.buildInitialView('No form found') ;
            return ;
        }

        if (info.form == null || info.form.json == null) {
            this.buildInitialView('Invalid form data') ;
            return ;
        }
        this.form_ = info.form.json ;

        if (this.form_.form == null || this.form_.sections == null || !Array.isArray(this.form_.sections) || this.form_.sections.length == 0) {
            this.buildInitialView('Invalid form data') ;
            return ;
        }

        this.initDisplay() ;
        this.formViewUpdateTabBar() ;
        this.setCurrentSectionByIndex(0) ;
    }

    requestResults(data) {
        let formdata = {} ;
        for(let entry of this.formctrlitems_) {
            if (entry) {
                let value = entry.getData() ;
                if (value) {
                    formdata[entry.tag] = value ;
                }
            }
        }

        let form = { form: this.form_, data: formdata } ;
        this.scoutingAPI('send-form', form) ;
    }
}

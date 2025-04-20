
class EditFormView extends XeroView {
    constructor(div, type, args) {
        super(div, type) ;

        this.popup_ = undefined ;

        // Should be team, match
        this.type_ = args[1] ;
        this.select_section_index_ = -1 ;
        this.currentSectionIndex_ = -1 ;

        this.buildInitialView('Waiting on form ...') ;
        this.registerCallback('send-form', this.formCallback.bind(this));
        this.registerCallback('send-images', this.receiveImages.bind(this)) ;
        this.registerCallback('send-image-data', this.receiveImageData.bind(this)) ;

        this.scoutingAPI('get-images') ;
        this.scoutingAPI('get-form', this.type_);

        this.nameToSectionMap_ = new Map() ;
        this.nameToImageMap = new Map() ;
    }

    close() {
        this.scoutingAPI('save-form', { type: this.type_, contents: this.form_}) ;
        this.top_.removeEventListener('contextmenu', this.contextMenu.bind(this)) ;
    }

    selectBackgroundImage() {

    }

    receiveImages(args) {
        this.image_names_ = args[0] ;

        let items = [] ;
        for(let im of this.image_names_) {
            let item = new PopupMenuItem(im, this.selectBackgroundImage.bind(this, im)) ;
            items.push(item) ;
        }
        this.image_menu_ = new PopupMenu(items) ;
    }

    receiveImageData(args) {
        let name = args[0].name ;
        let data = args[0].data ;
        this.nameToImageMap.set(name, data) ;

        if (this.form_.sections.length !== 0) {
            let section = this.form_.sections[this.currentSectionIndex_] ;
            if (section.image === name) {
                this.formdiv_.src = `data:image/jpg;base64,${data}`
            }
        }
    }

    formCallback(args) {
        this.initDisplay() ;

        this.form_ = args[0].form.json ;
        if (this.form_.sections.length === 0) {
            this.addSection() ;
        }
        else {
            this.setCurrentSectionByIndex(0) ;
        }
        this.formViewUpdateTabBar() ;
    }

    //
    // Create the display for the form view.
    // This is the main display for the form view. It will be a tabbed view with a tab for each section.
    // Each tab will have a button to select it. The tab will be a div with the name of the section.
    // The tab will be a button that will select the section when clicked.
    //
    initDisplay() {
        this.reset() ;

        this.alltop_ = document.createElement('div') ;
        this.alltop_.className = 'form-edit-topmost' ;

        this.titlediv_ = document.createElement('div') ;
        this.titlediv_.innerText = this.type_ + ' Form' ;
        this.titlediv_.className = 'form-edit-title' ;
        this.alltop_.append(this.titlediv_) ;

        this.bardiv_ = document.createElement('div') ;
        this.bardiv_.className = 'form-edit-tab' ;
        this.alltop_.append(this.bardiv_) ;

        this.formdiv_ = document.createElement('img') ;
        this.formdiv_.className = 'form-edit-form' ;
        this.alltop_.append(this.formdiv_) ;

        this.formdiv_.addEventListener('contextmenu', this.contextMenu.bind(this)) ;

        this.top_.append(this.alltop_) ;
    }

    formViewSelectButton(event) {
        console.log(event) ;
    }

    formViewUpdateTabBar() {
        this.bardiv_.innerHTML = '' ;
        for(let section of this.form_.sections) {
            let button = document.createElement('button') ;
            button.innerText = section.name ;
            button.className = FormView.buttonClassUnselected ;
            button.id = section + '-button' ;
            button.xerosectname = section;
            button.onclick = this.formViewSelectButton.bind(this) ;
            this.bardiv_.append(button) ;
        }  
        return this.bardiv_ ;
    }
    
    loadFormImage(name) {
        let ret = new Promise((resolve, reject) => {
            if (this.nameToImageMap.has(name)) {
                resolve(this.nameToImageMap.get(name)) ;
            }
            else {
                
            }
        }) ;

        return ret;
    }

    setCurrentSectionByIndex(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.form_.sections.length) {
            return false ;
        }

        let section = this.form_.sections[sectionIndex] ;
        let image = section.image ;
        this.currentSectionIndex_ = sectionIndex ;
        return true ;
    }

    setCurrentSectionByName(name) {
        for(let i = 0; i < this.form_.sections.length; i++) {
            if (this.form_.sections[i].name === name) {
                this.setCurrentSectionByIndex(i) ;
                return true ;
            }
        }
        return false ;
    }

    findSectionByName(name) {
        for(let sect of this.form_.sections) {
            if (sect.name === name) {
                return sect ;
            }
        }

        return undefined ;
    }

    findNewSectionName() {
        let name = 'New Section' ;
        if (this.findSectionByName(name) === undefined) {
            return name ;
        }

        let i = 1 ;
        while(true) {
            let newname = name + ' ' + i ;
            if (this.findSectionByName(newname) === undefined) {
                return newname ;
            }
            i++ ;
        }
    }

    updateImages() {
        this.form_.images = [] ;
        for(let i = 0; i < this.form_.sections.length; i++) {
            let section = this.form_.sections[i] ;
            if (this.form_.images.indexOf(section.image) === -1) {
                this.form_.images.push(section.image) ;
            }
        }

        for(let i = 0; i < this.form_.images.length; i++) {
            let image = this.form_.images[i] ;
            if (this.nameToImageMap.has(image)) {
                continue ;
            }
            this.scoutingAPI('get-image-data', image) ;
        }        
    }

    addSection() {
        let name = this.findNewSectionName() ;
        this.form_.sections.push({
            name: name,
            image: 'field2025',
        }) ;
        this.updateImages() ;
        this.formViewUpdateTabBar() ;
        this.setCurrentSectionByIndex(this.form_.sections.length - 1) ;
    }

    importImage() {
        this.scoutingAPI('import-image') ;
    }

    contextMenu(event) {
        event.preventDefault() ;

        if (this.popup_) {
            this.popup_.closeMenu() ;
            this.popup_ = undefined ;
        }

        let items = [
            new PopupMenuItem('Add Section', this.addSection.bind(this)),
            new PopupMenuItem('Import Image', this.importImage.bind(this)),
            new PopupMenuItem('Select Background Image', undefined, this.image_menu_),
        ]
        this.popup_ = new PopupMenu(items) ;
        this.popup_.showRelative(event.target.parentElement, event.clientX, event.clientY) ;
    }
}

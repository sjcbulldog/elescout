
class EditFormView extends XeroView {
    static ctrlTypeText = 'text' ;
    static ctrlTypeBoolean = 'boolean' ;
    static ctrlTypeUpDown = 'updown' ;
    static ctrlTypeMultipleChoice = 'choice' ;

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

        let ctrlitems = [
            new PopupMenuItem('Text Field', this.addNewTextCtrl.bind(this)),
            new PopupMenuItem('Up/Down Field', this.addNewUpDownCtrl.bind(this)),
            new PopupMenuItem('Boolean Field', this.addNewBooleanCtrl.bind(this)),
            new PopupMenuItem('Multiple Choice', this.addNewMultipleChoiceCtrl.bind(this)),
        ]
        this.ctrl_menu_ = new PopupMenu(ctrlitems) ;
    }

    findItemByTag(name) {
        for(let section of this.form_.sections) {
            for(let item of section.items) {
                if (item.tag === name) {
                    return item ;
                }
            }
        }
        return undefined ;
    }

    getUniqueTagName() {
        let index = 1 ;
        let name = 'tag_ ' + index ;

        while(true) {
            if (this.findItemByTag(name) === undefined) {
                break ;
            }
            index++ ;
            name = 'tag_' + index ;
        }

        return name ;
    }

    putControl(item) {
        switch(item.type) {
            case EditFormView.ctrlTypeText:
                this.putTextControl(item) ;
                break ;
            case EditFormView.ctrlTypeBoolean:
                this.putBooleanControl(item) ;
                break ;
            case EditFormView.ctrlTypeUpDown:
                this.putUpDownControl(item) ;
                break ;
            case EditFormView.ctrlTypeMultipleChoice:
                this.putMultipleChoiceControl(item) ;
                break ;
        }
    }

    putTextControl(item) {
        let label = document.createElement('label') ;
        label.innerText = item.label.text ;
        label.style.position = 'absolute' ;
        label.style.left = item.label.x + 'px' ;
        label.style.top = item.label.y + 'px' ;
        label.style.width = item.label.width + 'px' ;
        label.style.height = item.label.height + 'px' ;
        label.style.font = item.label.font ;
        label.style.fontSize = item.label.fontsize + 'px' ;
        label.style.color = item.label.color ;
        label.style.zIndex = 1000 ;

        this.formimg_.parentElement.append(label) ;

        let input = document.createElement('input') ;
        input.type = 'text' ;
        input.placeholder = item.placeholder ;
        input.style.width = item.input.width + 'px' ;
        input.style.height = item.input.height + 'px' ;
        input.style.font = item.input.font ;
        input.style.fontSize = item.input.fontsize + 'px' ;
        input.style.color = item.input.color ;
        input.tag = item.tag ;

        label.appendChild(input) ;
    }

    addNewTextCtrl(type) {
        let section = this.form_.sections[this.currentSectionIndex_] ;
        if (section.items === undefined) {
            section.items = [] ; 
        } ;

        let item = {
            type: EditFormView.ctrlTypeText,
            label : {
                text: 'Text Field',
                x: 100,
                y: 100,
                width: 100,
                height: 20,
                font: 'Arial',
                fontsize: 12,
                color: 'black',
            },
            input: {
                x: 200,
                y: 100,
                width: 200,
                height: 20,
                font: 'Arial',
                fontsize: 12,
                color: 'black',
            },
            tag: this.getUniqueTagName(),
            placeholder: 'Enter text here',
        } ;     

        section.items.push(item) ;
        this.putControl(item) ;
        this.modified() ;
    }

    putUpDownControl(item) {
    }

    addNewUpDownCtrl(type) {
    }

    putBooleanControl(item) {
    }

    addNewBooleanCtrl(type) {
    }

    putMultipleChoiceControl(item) {
    }
    
    addNewMultipleChoiceCtrl(type) {
    }

    modified() {
        this.scoutingAPI('save-form', { type: this.type_, contents: this.form_}) ;1
    }

    close() {
        this.top_.removeEventListener('contextmenu', this.contextMenu.bind(this)) ;
    }

    selectBackgroundImage(image) {
        this.form_.sections[this.currentSectionIndex_].image = image ;
        this.updateImages() ;
        
        if (this.nameToImageMap.has(image)) {
            console.log('found image - setting image to ' + image) ;
            this.formimg_.src = `data:image/jpg;base64,${this.nameToImageMap.get(image)}` ;
        }
        else {
            console.log('image not found - requesting image data') ;
        }

        this.modified() ;
        this.popup_.closeMenu() ;
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

        console.log('received image ' + name) ;

        this.nameToImageMap.set(name, data) ;

        if (this.form_ && this.form_.sections && this.form_.sections.length !== 0) {
            let section = this.form_.sections[this.currentSectionIndex_] ;
            if (section.image === name) {
                this.updateSectionDisplay() ;
            }
        }
    }

    formCallback(args) {
        this.initDisplay() ;

        this.form_ = args[0].form.json ;
        if (this.form_.sections.length === 0) {
            // This is an empty form, so we need to add a section.
            this.addSection() ;
        }
        else {
            // Make sure we have the images for the sections.
            this.updateImages() ;
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

        this.formimg_ = document.createElement('img') ;
        this.formimg_.className = 'form-edit-form' ;
        this.alltop_.append(this.formimg_) ;

        this.formimg_.addEventListener('contextmenu', this.contextMenu.bind(this)) ;

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

    updateControls() {
        let section = this.form_.sections[this.currentSectionIndex_] ;
        if (section.items) {
            for(let item of section.items) {
                this.putControl(item) ;
            }
        }
    }

    updateSectionDisplay() {
        let imname = this.form_.sections[this.currentSectionIndex_].image ;
        //
        // If we don't have the image, then we need to get it. It has already been requested
        // so we just need to wait for it to come back.  We will call this again when the image data comes back.
        //
        if (this.nameToImageMap.has(imname)) {
            let data = this.nameToImageMap.get(imname) ;
            this.formimg_.src = `data:image/jpg;base64,${data}`
            this.updateControls() ;
        }
    }
    
    setCurrentSectionByIndex(sectionIndex) {
        if (sectionIndex < 0 || sectionIndex >= this.form_.sections.length) {
            return false ;
        }
        this.currentSectionIndex_ = sectionIndex ;
        this.updateSectionDisplay() ;
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
            image: 'blank',
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
            new PopupMenuItem('Import Image', this.importImage.bind(this)),
            new PopupMenuItem('Add Section', this.addSection.bind(this)),
            new PopupMenuItem('Add Control', undefined, this.ctrl_menu_),
            new PopupMenuItem('Select Background Image', undefined, this.image_menu_),
        ]
        this.popup_ = new PopupMenu(items) ;
        this.popup_.showRelative(event.target.parentElement, event.clientX, event.clientY) ;
    }
}

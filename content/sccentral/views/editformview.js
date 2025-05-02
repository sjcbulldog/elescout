 
class EditFormView extends XeroView {
    static fuzzyEdgeSpacing = 10 ;
    static moveControlAmount = 1 ;
    static shiftMoveControlAmount = 10 ;
    static ctrlMoveControlAmount = 50 ;

    constructor(div, type, args) {
        super(div, type) ;

        this.formctrlitems_ = [] ;

        this.popup_ = undefined ;
        this.selected_ = undefined ;
        this.dragging_ = 'none' ;
        this.editing_ = false ;

        // Should be team, match
        this.type_ = args[1] ;
        this.currentSectionIndex_ = -1 ;

        this.buildInitialView('Waiting on form ...') ;

        this.registerCallback('send-form', this.formCallback.bind(this));
        this.registerCallback('send-images', this.receiveImages.bind(this)) ;
        this.registerCallback('send-image-data', this.receiveImageData.bind(this)) ;

        this.scoutingAPI('get-images') ;
        this.scoutingAPI('get-form', this.type_);

        this.nameToImageMap = new Map() ;

        let ctrlitems = [
            new PopupMenuItem('Label', this.addNewLabelCtrl.bind(this)),
            new PopupMenuItem('Text Field', this.addNewTextCtrl.bind(this)),
            new PopupMenuItem('Up/Down Field', this.addNewUpDownCtrl.bind(this)),
            new PopupMenuItem('Boolean Field', this.addNewBooleanCtrl.bind(this)),
            new PopupMenuItem('Multiple Choice', this.addNewMultipleChoiceCtrl.bind(this)),
            new PopupMenuItem('Select', this.addNewSelectCtrl.bind(this)),
        ]
        this.ctrl_menu_ = new PopupMenu(ctrlitems) ;
    }

    findItemByTag(name) {
        for(let section of this.form_.sections) {
            if (section.items) {
                for(let item of section.items) {
                    if (item.tag === name) {
                        return item ;
                    }
                }
            }
        }
        return undefined ;
    }

    findFormControlFromItem(item) {
        for(let entry of this.formctrlitems_) {
            if (entry.item === item) {
                return entry ;
            }
        }
        return undefined ;
    }

    findFormControlFromCtrl(ctrl) {
        for(let entry of this.formctrlitems_) {
            if (entry.ctrl === ctrl) {
                return entry ;
            }
        }
        return undefined ;
    }

    removeFormCtrlItem(frmctrl) {
        for(let i = 0; i < this.formctrlitems_.length; i++) {
            if (this.formctrlitems_[i] === frmctrl) {
                this.formctrlitems_.splice(i, 1) ;
                return true ;
            }
        }
        return false ;
    }

    getUniqueTagName() {
        let index = 1 ;
        let name = 'tag_' + index ;

        while(true) {
            if (this.findItemByTag(name) === undefined) {
                break ;
            }
            index++ ;
            name = 'tag_' + index ;
        }

        return name ;
    }

    onGlobalKey(event) {
        if (!this.editing_) {
            if (event.key === 'Delete') {
                this.deleteSelectedItem() ;
            }
            else if (event.key === 'v' && event.ctrlKey) {
                this.pasteSelectedItem() ;
            }
            else if (event.key === 'ArrowRight') {
                if (event.ctrlKey) {
                    this.moveSelectedItem(this.ctrlMoveControlAmount, 0) ;
                }
                else if (event.shiftKey) {
                    this.moveSelectedItem(this.shiftMoveControlAmount, 0) ;                    
                }
                else {
                    this.moveSelectedItem(this.moveControlAmount, 0) ;
                }
            }
            else if (event.key === 'ArrowLeft') {
                if (event.ctrlKey) {
                    this.moveSelectedItem(-this.ctrlMoveControlAmount, 0) ;
                }
                else if (event.shiftKey) {
                    this.moveSelectedItem(-this.shiftMoveControlAmount, 0) ;
                }
                else {
                    this.moveSelectedItem(-this.moveControlAmount, 0) ;
                }
            }
            else if (event.key === 'ArrowUp') {
                if (event.ctrlKey) {
                    this.moveSelectedItem(0, -this.ctrlMoveControlAmount) ;
                }
                else if (event.shiftKey) {
                    this.moveSelectedItem(0, -this.shiftMoveControlAmount) ;
                }
                else {
                    this.moveSelectedItem(0, -this.moveControlAmount) ;
                }
            }
            else if (event.key === 'ArrowDown') {
                if (event.ctrlKey) {
                    this.moveSelectedItem(0, this.ctrlMoveControlAmount) ;
                }
                else if (event.shiftKey) {
                    this.moveSelectedItem(0, this.shiftMoveControlAmount) ;
                }
                else {
                    this.moveSelectedItem(0, this.moveControlAmount) ;
                }
            }
        }
    }

    moveSelectedItem(dx, dy) {
        if (this.selected_) {
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl) {
                let x = parseInt(this.selected_.style.left) ;
                let y = parseInt(this.selected_.style.top) ;
                this.selected_.style.left = (x + dx) + 'px' ;
                this.selected_.style.top = (y + dy) + 'px' ;

                frmctrl.item.x = x + dx ;
                frmctrl.item.y = y + dy ;

                this.modified() ;
            }
        }
    }

    addItemToCurrentSection(item) {
        let section = this.form_.sections[this.currentSectionIndex_] ;
        if (section.items === undefined) {
            section.items = [] ;
        }
        section.items.push(item) ;
    }

    pasteSelectedItem() {
        if (this.selected_) {
            let curfrmctrl = this.findFormControlFromCtrl(this.selected_) ;
            let tag = this.getUniqueTagName() ;
            let frmctrl = curfrmctrl.clone(tag) ;
            frmctrl.item.x += 40 ;
            frmctrl.item.y += 40 ;
            this.formctrlitems_.push(frmctrl) ;
            frmctrl.createForEdit(this.alltop_) ;
            this.addItemToCurrentSection(frmctrl.item) ;
            this.unselectCurrent() ;
            this.select(frmctrl.ctrl) ;
            this.modified() ;
        }
    }

    deleteSelectedItem() {
        if (this.selected_) {
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl) {
                let section = this.form_.sections[this.currentSectionIndex_] ;
                let index = section.items.indexOf(frmctrl.item) ;
                if (index !== -1) {
                    section.items.splice(index, 1) ;
                    this.removeFormCtrlItem(frmctrl) ;
                    this.alltop_.removeChild(this.selected_) ;
                    this.selected_ = undefined ;
                    this.dragging_ = 'none' ;
                    this.modified() ;
                }
            }
        }
    }

    findControlByPosition(x, y) {
        for(let entry of this.formctrlitems_) {
            if (entry.ctrl === undefined) {
                continue ;
            }

            let ctrl = entry.ctrl ;
            let item = entry.item ;

            let rect = ctrl.getBoundingClientRect() ;
            if (x >= rect.left - EditFormView.fuzzyEdgeSpacing && x <= rect.right + EditFormView.fuzzyEdgeSpacing && y >= rect.top - EditFormView.fuzzyEdgeSpacing && y <= rect.bottom + EditFormView.fuzzyEdgeSpacing) {
                return ctrl ;
            }
        }
        return undefined ;
    }

    unselectCurrent() {
        if (this.selected_) {
            this.selected_.style.border = 'none' ;
            this.selected_.style.margin = '4px' ;
            this.selected_ = undefined ;
            this.dragging_ = 'none' ;
        }
    }

    mouseUp(event) {
        this.controlRelease(event) ;
    }

    updateMouseCursor(x, y) {
        let ctrl = this.findControlByPosition(x, y) ;
        if (ctrl === undefined) {
            this.unselectCurrent() ;
            this.alltop_.style.cursor = 'default' ;
            return ;
        }

        if (ctrl !== this.selected_) {
            this.unselectCurrent() ;
            this.select(ctrl) ;
        }      

        let top = this.isTopEdge(x, y, ctrl) ;
        let bottom = this.isBottomEdge(x, y, ctrl) ;
        let left = this.isLeftEdge(x, y, ctrl) ;
        let right = this.isRightEdge(x, y, ctrl) ;

        if (top && left) {
            this.alltop_.style.cursor = 'nwse-resize' ;
        }
        else if (top && right) {
            this.alltop_.style.cursor = 'nesw-resize' ;
        }
        else if (bottom && left) {
            this.alltop_.style.cursor = 'nesw-resize' ;
        }
        else if (bottom && right) {
            this.alltop_.style.cursor = 'nwse-resize' ;
        }                
        else if (right) {
            this.alltop_.style.cursor = 'ew-resize' ;
        }
        else if (left) {
            this.alltop_.style.cursor = 'ew-resize' ;
        }
        else if (top) {
            this.alltop_.style.cursor = 'ns-resize' ;
        }
        else if (bottom) {
            this.alltop_.style.cursor = 'ns-resize' ;
        }
        else {
            this.alltop_.style.cursor = 'move' ;
        }
    }

    mouseMove(event) {
        if (this.dragging_ === 'all') {
            let dx = event.pageX - this.basex ;
            let dy = event.pageY - this.basey ;
            this.selected_.style.left = (this.ctrlx + dx) + 'px' ;
            this.selected_.style.top = (this.ctrly + dy) + 'px' ;

            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.x = this.ctrlx + dx ;
                frmctrl.item.y = this.ctrly + dy ;
            }
            this.alltop_.style.cursor = 'move' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'ulcorner') {
            let dx = event.pageX - this.basex ;
            let dy = event.pageY - this.basey ;
            this.selected_.style.left = (this.ctrlx + dx) + 'px' ;
            this.selected_.style.top = (this.ctrly + dy) + 'px' ;
            this.selected_.style.width = (this.ctrlwidth - dx) + 'px' ;
            this.selected_.style.height = (this.ctrlheight - dy) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.x = this.ctrlx + dx ;
                frmctrl.item.y = this.ctrly + dy ;
                frmctrl.item.width = this.ctrlwidth - dx ;
                frmctrl.item.height = this.ctrlheight - dy ;
            }
            this.alltop_.style.cursor = 'nwse-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'urcorner') {
            let dx = event.pageX - this.basex ;
            let dy = event.pageY - this.basey ;
            this.selected_.style.top = (this.ctrly + dy) + 'px' ;
            this.selected_.style.width = (this.ctrlwidth + dx) + 'px' ;
            this.selected_.style.height = (this.ctrlheight - dy) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.y = this.ctrly + dy ;
                frmctrl.item.width = this.ctrlwidth + dx ;
                frmctrl.item.height = this.ctrlheight - dy ;
            }
            this.alltop_.style.cursor = 'nesw-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'llcorner') {
            let dx = event.pageX - this.basex ;
            let dy = event.pageY - this.basey ;
            this.selected_.style.left = (this.ctrlx + dx) + 'px' ;
            this.selected_.style.width = (this.ctrlwidth - dx) + 'px' ;
            this.selected_.style.height = (this.ctrlheight + dy) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {

                frmctrl.item.x = this.ctrlx + dx ;
                frmctrl.item.width = this.ctrlwidth - dx ;
                frmctrl.item.height = this.ctrlheight + dy ;
            }
            this.alltop_.style.cursor = 'nesw-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'lrcorner') {
            let dx = event.pageX - this.basex ;
            let dy = event.pageY - this.basey ;
            this.selected_.style.width = (this.ctrlwidth + dx) + 'px' ;
            this.selected_.style.height = (this.ctrlheight + dy) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.width = this.ctrlwidth + dx ;
                frmctrl.item.height = this.ctrlheight + dy ;
            }
            this.alltop_.style.cursor = 'nwse-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'right') {
            let dx = event.pageX - this.basex ;
            this.selected_.style.width = (this.ctrlwidth + dx) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.width = this.ctrlwidth + dx ;
            }
            this.alltop_.style.cursor = 'ew-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'left') {
            let dx = event.pageX - this.basex ;
            this.selected_.style.left = (this.ctrlx + dx) + 'px' ;
            this.selected_.style.width = (this.ctrlwidth - dx) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.x = this.ctrlx + dx ;
                frmctrl.item.width = this.ctrlwidth - dx ;
            }
            this.alltop_.style.cursor = 'ew-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'top') {
            let dy = event.pageY - this.basey ;
            this.selected_.style.top = (this.ctrly + dy) + 'px' ;
            this.selected_.style.height = (this.ctrlheight - dy) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.y = this.ctrly + dy ;
                frmctrl.item.height = this.ctrlheight - dy ;
            }
            this.alltop_.style.cursor = 'ns-resize' ;
            this.modified() ;
        }
        else if (this.dragging_ === 'bottom') {
            let dy = event.pageY - this.basey ;
            this.selected_.style.height = (this.ctrlheight + dy) + 'px' ;
            let frmctrl = this.findFormControlFromCtrl(this.selected_) ;
            if (frmctrl && frmctrl.item) {
                frmctrl.item.height = this.ctrlheight + dy ;
            }
            this.alltop_.style.cursor = 'ns-resize' ;
            this.modified() ;
        }
        else {
            this.updateMouseCursor(event.pageX, event.pageY) ;
        }
    }

    isRightEdge(x, y, ctrl) {
        let rect = ctrl.getBoundingClientRect() ;
        if (x >= rect.right - EditFormView.fuzzyEdgeSpacing && x <= rect.right + EditFormView.fuzzyEdgeSpacing && y >= rect.top && y <= rect.bottom) {
            return true ;
        }
        return false ;
    }

    isLeftEdge(x, y, ctrl) {
        let rect = ctrl.getBoundingClientRect() ;
        if (x >= rect.left - EditFormView.fuzzyEdgeSpacing && x <= rect.left + EditFormView.fuzzyEdgeSpacing && y >= rect.top && y <= rect.bottom) {
            return true ;
        }
        return false ;
    }

    isTopEdge(x, y, ctrl) {
        let rect = ctrl.getBoundingClientRect() ;
        if (x >= rect.left && x <= rect.right && y >= rect.top - EditFormView.fuzzyEdgeSpacing && y <= rect.top + EditFormView.fuzzyEdgeSpacing) {
            return true ;
        }
        return false ;
    }

    isBottomEdge(x, y, ctrl) {
        let rect = ctrl.getBoundingClientRect() ;
        if (x >= rect.left && x <= rect.right && y >= rect.bottom - EditFormView.fuzzyEdgeSpacing && y <= rect.bottom + EditFormView.fuzzyEdgeSpacing) {
            return true ;
        }
        return false ;
    }

    select(ctrl) {
        this.selected_ = ctrl ;
        this.selected_.style.borderStyle = 'solid' ;
        this.selected_.style.borderWidth = '4px' ;
        this.selected_.style.borderColor = 'red' ;
        this.selected_.style.margin = '0px' 
    }

    mouseDown(event) {
        if (this.selected_) {
            let top = this.isTopEdge(event.pageX, event.pageY, this.selected_) ;
            let bottom = this.isBottomEdge(event.pageX, event.pageY, this.selected_) ;
            let left = this.isLeftEdge(event.pageX, event.pageY, this.selected_) ;
            let right = this.isRightEdge(event.pageX, event.pageY, this.selected_) ;

            if (top && left) {
                this.dragging_ = 'ulcorner' ;
            }
            else if (top && right) {
                this.dragging_ = 'urcorner' ;
            }
            else if (bottom && left) {
                this.dragging_ = 'llcorner' ;
            }
            else if (bottom && right) {
                this.dragging_ = 'lrcorner' ;
            }                
            else if (right) {
                this.dragging_ = 'right' ;
            }
            else if (left) {
                this.dragging_ = 'left' ;
            }
            else if (top) {
                this.dragging_ = 'top' ;
            }
            else if (bottom) {
                this.dragging_ = 'bottom' ;
            }
            else {
                this.dragging_ = 'all' ;
            }

            this.basex = event.pageX ;
            this.basey = event.pageY ;
            this.ctrlx = this.selected_.offsetLeft ;
            this.ctrly = this.selected_.offsetTop ;
            this.ctrlwidth = this.selected_.offsetWidth ;
            this.ctrlheight = this.selected_.offsetHeight ;
        }
    }    

    controlRelease(event) {
        this.dragging_ = 'none' ;
        this.modified() ;
    }

    addNewLabelCtrl(type) {
        let imgrect = this.formimg_.getBoundingClientRect() ;
        let formctrl = new LabelFormControl(this.editdone.bind(this), this.getUniqueTagName(), 0, imgrect.top, 250, 50) ;

        this.addItemToCurrentSection(formctrl.item) ;
        this.formctrlitems_.push(formctrl) ;

        formctrl.createForEdit(this.alltop_) ;
        this.modified() ;        
    }

    addNewTextCtrl(type) {
        let imgrect = this.formimg_.getBoundingClientRect() ;
        let formctrl = new TextFormControl(this.editdone.bind(this), this.getUniqueTagName(), 0, imgrect.top, 250, 50) ;

        this.addItemToCurrentSection(formctrl.item) ;
        this.formctrlitems_.push(formctrl) ;

        formctrl.createForEdit(this.alltop_) ;
        this.modified() ;  
    }
    
    addNewUpDownCtrl(type) {
        let imgrect = this.formimg_.getBoundingClientRect() ;
        let formctrl = new UpDownFormControl(this.editdone.bind(this), this.getUniqueTagName(), 0, imgrect.top, 250, 100) ;

        this.addItemToCurrentSection(formctrl.item) ;
        this.formctrlitems_.push(formctrl) ;

        formctrl.createForEdit(this.alltop_) ;
        this.modified() ;  
    }

    addNewBooleanCtrl(type) {
        let imgrect = this.formimg_.getBoundingClientRect() ;
        let formctrl = new BooleanFormControl(this.editdone.bind(this), this.getUniqueTagName(), 0, imgrect.top, 50, 50) ;

        this.addItemToCurrentSection(formctrl.item) ;
        this.formctrlitems_.push(formctrl) ;

        formctrl.createForEdit(this.alltop_) ;
        this.modified() ;  
    }

    addNewMultipleChoiceCtrl(type) {
        let imgrect = this.formimg_.getBoundingClientRect() ;
        let formctrl = new MultipleChoiceFormControl(this.editdone.bind(this), this.getUniqueTagName(), 0, imgrect.top, 150, 100) ;

        this.addItemToCurrentSection(formctrl.item) ;
        this.formctrlitems_.push(formctrl) ;

        formctrl.createForEdit(this.alltop_) ;
        this.modified() ;  
    }

    addNewSelectCtrl(type) {
        let imgrect = this.formimg_.getBoundingClientRect() ;
        let formctrl = new SelectFormControl(this.editdone.bind(this), this.getUniqueTagName(), 0, imgrect.top, 120, 35) ;

        this.addItemToCurrentSection(formctrl.item) ;
        this.formctrlitems_.push(formctrl) ;

        formctrl.createForEdit(this.alltop_) ;
        this.modified() ;  
    }

    editdone(changed) {
        if (changed) {
            this.modified() ;
        }
        this.editing_ = false ;
    }

    modified() {
        this.scoutingAPI('save-form', { type: this.type_, contents: this.form_}) ;
    }

    close() {
        super.close() ;
        
        document.removeEventListener('contextmenu', this.ctxbind_) ;
        document.removeEventListener('dblclick', this.dblclkbind_) ;
        document.removeEventListener('keydown', this.keydownbind_) ;
        document.removeEventListener('mouseup', this.mouseupbind_) ;
        document.removeEventListener('mousemove', this.mousemovebind_) ;
        document.removeEventListener('mousedown', this.mouusedownbind_) ;

        this.type_ = undefined ;
        this.form_ = undefined ;
    }

    selectBackgroundImage(image) {
        this.form_.sections[this.currentSectionIndex_].image = image ;
        this.updateImages() ;
        
        if (this.nameToImageMap.has(image)) {
            this.formimg_.src = `data:image/jpg;base64,${this.nameToImageMap.get(image)}` ;
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
            this.formViewUpdateTabBar() ;
            this.modified() ;
        }
        else {
            // Make sure we have the images for the sections.
            this.updateImages() ;
            this.formViewUpdateTabBar() ;
            this.setCurrentSectionByIndex(0) ;
        }
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
        let tname = this.type_.charAt(0).toUpperCase() + this.type_.slice(1) ;
        this.titlediv_.innerText = tname + ' Form' ;
        this.titlediv_.className = 'form-edit-title' ;
        this.alltop_.append(this.titlediv_) ;

        this.bardiv_ = document.createElement('div') ;
        this.bardiv_.className = 'form-edit-tab' ;
        this.alltop_.append(this.bardiv_) ;

        this.formimg_ = document.createElement('img') ;
        this.formimg_.className = 'form-edit-form' ;
        this.formimg_.style.pointerEvents = 'none' ;
        this.alltop_.style.userSelect = 'none' ;
        this.alltop_.append(this.formimg_) ;

        this.ctxbind_ = this.contextMenu.bind(this) ;
        document.addEventListener('contextmenu', this.ctxbind_) ;

        this.dblclkbind_ = this.doubleClick.bind(this) ;
        document.addEventListener('dblclick', this.dblclkbind_) ;

        this.keydownbind_ = this.onGlobalKey.bind(this) ;
        document.addEventListener('keydown', this.keydownbind_) ;

        this.mouseupbind_ = this.mouseUp.bind(this) ;
        document.addEventListener('mouseup', this.mouseupbind_) ;

        this.mousemovebind_ = this.mouseMove.bind(this) ;
        document.addEventListener('mousemove', this.mousemovebind_) ;

        this.mouusedownbind_ = this.mouseDown.bind(this) ;
        document.addEventListener('mousedown', this.mouusedownbind_) ;

        this.top_.append(this.alltop_) ;
        this.top_.style.userSelect = 'none' ;
    }

    doubleClick(event) {
        if (this.selected_ && !this.editing_) {
            let formctrl = this.findFormControlFromCtrl(this.selected_) ;
            this.dragging_ = 'none' ;
            if (formctrl) {
                this.editing_ = true ;
                formctrl.edit(this.top_.parentElement) ;
            }
        }
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
                    formctrl.createForEdit(this.alltop_) ;
                }
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
        this.bardiv_.children.item(this.currentSectionIndex_).className = FormView.buttonClassSelected ;
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

    deleteSection() {
        if (this.currentSectionIndex_ === -1) {
            return ;
        }

        if (this.form_.sections.length === 1) {
            window.alert('You cannot delete the last section - there must be at least one section.') ;
            return ;
        }

        let section = this.form_.sections[this.currentSectionIndex_] ;
        this.form_.sections.splice(this.currentSectionIndex_, 1) ;

        this.bardiv_.removeChild(this.bardiv_.children.item(this.currentSectionIndex_)) ;
        this.currentSectionIndex_ = -1 ;
        this.formViewUpdateTabBar() ;
        this.setCurrentSectionByIndex(0) ;
    }

    importImage() {
        this.scoutingAPI('import-image') ;
    }

    sectionNameDialogDone(changed) {
        if (changed) {
            this.modified() ;
            this.bardiv_.children.item(this.currentSectionIndex_).innerText = this.form_.sections[this.currentSectionIndex_].name ;
        }
        this.editing_ = false ;
    }

    renameSection() {
        this.editing_ = true ;
        let dialog = new EditSectionNameDialog(this.sectionNameDialogDone.bind(this), this.form_.sections[this.currentSectionIndex_]) ;
        dialog.showRelative(this.top_.parentElement) ;
    }

    contextMenu(event) {
        event.preventDefault() ;

        if (this.popup_) {
            this.popup_.closeMenu() ;
            this.popup_ = undefined ;
        }

        let sectionItems = [
            new PopupMenuItem('Add Section', this.addSection.bind(this)),
            new PopupMenuItem('Delete Section', this.deleteSection.bind(this)),
            new PopupMenuItem('Rename Section', this.renameSection.bind(this))
        ]
        this.section_menu_ = new PopupMenu(sectionItems) ;

        let items = [
            new PopupMenuItem('Import Image', this.importImage.bind(this)),
            new PopupMenuItem('Sections', undefined, this.section_menu_),
            new PopupMenuItem('Add Control', undefined, this.ctrl_menu_),
            new PopupMenuItem('Select Background Image', undefined, this.image_menu_),
        ]
        this.popup_ = new PopupMenu(items) ;
        this.popup_.showRelative(event.target.parentElement, event.clientX, event.clientY) ;
    }
}

class EditFormDialog {

    constructor(close, title) {
        this.title_ = title ;
        this.closecb = close ;
        this.moving_ = false ;
    }

    showRelative(win) {
        this.parent_ = win ;
        this.popup_ = document.createElement('div') ;
        this.popup_.enabled = true ;
        this.popup_.className = 'popup-form-edit-dialog' ;

        this.topbar_ = document.createElement('div') ;
        this.topbar_.className = 'popup-form-edit-dialog-topbar' ;
        if (this.title_) {
            this.topbar_.innerHTML = this.title_ ;
        }
        this.popup_.appendChild(this.topbar_) ;

        this.client_area_ = document.createElement('div') ;
        this.client_area_.className = 'popup-form-edit-dialog-client' ;
        this.popup_.appendChild(this.client_area_) ;

        this.button_area_ = document.createElement('div') ;
        this.button_area_.className = 'popup-form-edit-dialog-buttons' ;
        this.popup_.appendChild(this.button_area_) ;

        this.populateDialog(this.client_area_) 
        this.populateButtons(this.button_area_) ;

        let prect = win.getBoundingClientRect() ;
        let drect = this.popup_.getBoundingClientRect() ;
        let x = (prect.width - drect.width) / 2 ;
        let y = (prect.height - drect.height) / 8 ;

        this.popup_.style.left = x + 'px' ;
        this.popup_.style.top = y + 'px' ;

        this.parent_.appendChild(this.popup_) ;
        this.onInit() ;

        this.keydownbind_ = this.keyDown.bind(this) ;
        document.addEventListener('keydown', this.keydownbind_) ;
        this.topbar_.addEventListener('mousedown', this.mouseDown.bind(this)) ;
    }

    mouseDown(event) {
        if (event.button === 0) {
            this.moving_ = true ;
            this.startx_ = event.clientX ;
            this.starty_ = event.clientY ;

            this.startleft_ = parseInt(this.popup_.style.left) ;
            this.starttop_ = parseInt(this.popup_.style.top) ;

            document.addEventListener('mousemove', this.mouseMove.bind(this)) ;
            document.addEventListener('mouseup', this.mouseUp.bind(this)) ;
        }
    }

    mouseMove(event) {
        if (this.moving_) {
            let dx = event.clientX - this.startx_ ;
            let dy = event.clientY - this.starty_ ;
            let left = this.startleft_ + dx ;
            let top = this.starttop_ + dy ;
            this.popup_.style.left = left + 'px' ;
            this.popup_.style.top = top + 'px' ;
        }
    }

    mouseUp(event) {
        if (this.moving_) {
            this.moving_ = false ;
            document.removeEventListener('mousemove', this.mouseMove.bind(this)) ;
            document.removeEventListener('mouseup', this.mouseUp.bind(this)) ;
        }
    }

    keyDown(event) {
        if (event.key === 'Escape') {
            this.cancelButton(event) ;
        }
        else if (event.key === 'Enter') {
            this.okButton(event) ;
        }
    }

    onInit() {
    }

    okButton(event) {
        this.close(true) ;
    }

    cancelButton(event) {
        this.close(false) ;
    }

    populateButtons(div) {
        let okbutton = document.createElement('button') ;
        okbutton.innerText = 'OK' ;
        okbutton.className = 'popup-form-edit-dialog-button' ;
        okbutton.onclick = this.okButton.bind(this) ;
        div.appendChild(okbutton) ;

        let cancelbutton = document.createElement('button') ;
        cancelbutton.innerText = 'Cancel' ;
        cancelbutton.className = 'popup-form-edit-dialog-button' ;
        cancelbutton.onclick = this.cancelButton.bind(this) ;
        div.appendChild(cancelbutton) ;
    }

    close(changed) {
        document.removeEventListener('keydown', this.keydownbind_) ;

        if (this.popup_ && this.parent_.contains(this.popup_)) {
            this.parent_.removeChild(this.popup_) ;
            this.popup_ = null ;
        }

        if (this.closecb) {
            this.closecb(changed) ;
        }
    }
}

class EditSectionNameDialog extends EditFormDialog {
    constructor(close, section) {
        super(close) ;
        this.section_ = section ;
    }

    async populateDialog(pdiv) {
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.section_name_ = document.createElement('input') ;
        this.section_name_.type = 'text' ;
        this.section_name_.className = 'popup-form-edit-dialog-input' ;
        this.section_name_.value = this.section_.name ;

        let label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Section Name' ;
        label.appendChild(this.section_name_) ;
        div.appendChild(label) ;

        pdiv.appendChild(div) ;
    }

    onInit() {
        this.section_name_.focus() ;
        this.section_name_.select() ;
    }

    okButton(event) {
        let name = this.section_name_.value.trim() ;
        if (name !== this.section_.name) {
            this.section_.name = this.section_name_.value.trim() ;
        }
        super.okButton(event) ;
    }
}

class EditFormControlDialog extends EditFormDialog {
    constructor(close, title) {
        super(close, title) ;
    }

    okButton(event) {
        this.extractData() ;            // Extract the item data form the dialog
        this.updateFromItem() ;         // Make the control on the screen match the item data
        super.okButton(event) ;         // Finish the edit operation, save the form, and dismiss the dialog
    }

    extractData() {
    }
}

class EditFormLabelDialog extends EditFormControlDialog {
    constructor(close, formctrl) {
        super(close, 'Edit Label') ;

        this.formctrl_ = formctrl ;
    }

    async populateDialog(pdiv) {
        let label ;
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.text_string_ = document.createElement('input') ;
        this.text_string_.type = 'text' ;
        this.text_string_.className = 'popup-form-edit-dialog-input' ;
        this.text_string_.value = this.formctrl_.item.text ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Text' ;
        label.appendChild(this.text_string_) ;
        div.appendChild(label) ;

        this.font_name_ = document.createElement('select') ;
        this.font_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await window.queryLocalFonts() ;
        for(let font of fonts) {
            let option = document.createElement('option') ;
            option.value = font.fullName ;
            option.innerText = font.fullName ;
            this.font_name_.appendChild(option) ;
        }
        this.font_name_.value = this.formctrl_.item.font ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font' ;
        label.appendChild(this.font_name_) ;
        div.appendChild(label) ;       
        
        this.font_size_ = document.createElement('input') ;
        this.font_size_.type = 'number' ;
        this.font_size_.max = 48 ;
        this.font_size_.min = 8 ;
        this.font_size_.className = 'popup-form-edit-dialog-input' ;
        this.font_size_.value = this.formctrl_.item.fontsize ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Size' ;
        label.appendChild(this.font_size_) ;
        div.appendChild(label) ;  

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.className = 'popup-form-edit-dialog-input' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;
        
       
        pdiv.appendChild(div) ;
    }

    extractData() {
        this.formctrl_.item.text = this.text_string_.value ;
        this.formctrl_.item.font = this.font_name_.value ;
        this.formctrl_.item.fontsize = parseInt(this.font_size_.value) ;
        this.formctrl_.item.color = this.text_color_.value ;
    }
}

class EditFormTextDialog extends EditFormControlDialog {
    constructor(close, formctrl) {
        super(close) ;

        this.formctrl_ = formctrl ;
    }

    async populateDialog(pdiv) {
        let label , option ;

        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.tag_ = document.createElement('input') ;
        this.tag_.type = 'text' ;
        this.tag_.className = 'popup-form-edit-dialog-input' ;
        this.tag_.value = this.formctrl_.item.tag ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Tag' ;
        label.appendChild(this.tag_) ;
        div.appendChild(label) ;

        this.data_type_ = document.createElement('select') ;
        this.data_type_.className = 'popup-form-edit-dialog-select' ;
        option = document.createElement('option') ;
        option.value = 'string' ;
        option.innerText = 'String' ;
        this.data_type_.appendChild(option) ;
        option = document.createElement('option') ;
        option.value = 'integer' ;
        option.innerText = 'Integer' ;
        this.data_type_.appendChild(option) ;
        option = document.createElement('option') ;
        option.value = 'real' ;
        option.innerText = 'Float' ;
        this.data_type_.appendChild(option) ;
        this.data_type_.value = this.formctrl_.item.datatype ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Data Type' ;
        label.appendChild(this.data_type_) ;
        div.appendChild(label) ;

        this.placeholder_ = document.createElement('input') ;
        this.placeholder_.type = 'text' ;
        this.placeholder_.className = 'popup-form-edit-dialog-input' ;
        this.placeholder_.value = this.formctrl_.item.placeholder ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Placeholder' ;
        label.appendChild(this.placeholder_) ;
        div.appendChild(label) ;

        this.font_name_ = document.createElement('select') ;
        this.font_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await window.queryLocalFonts() ;
        for(let font of fonts) {
            option = document.createElement('option') ;
            option.value = font.fullName ;
            option.innerText = font.fullName ;
            this.font_name_.appendChild(option) ;
        }
        this.font_name_.value = this.formctrl_.item.font ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font' ;
        label.appendChild(this.font_name_) ;
        div.appendChild(label) ;       
        
        this.font_size_ = document.createElement('input') ;
        this.font_size_.type = 'number' ;
        this.font_size_.max = 48 ;
        this.font_size_.min = 8 ;
        this.font_size_.className = 'popup-form-edit-dialog-input' ;
        this.font_size_.value = this.formctrl_.item.fontsize ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Size' ;
        label.appendChild(this.font_size_) ;
        div.appendChild(label) ;  

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.className = 'popup-form-edit-dialog-input' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Text Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;

        pdiv.appendChild(div) ;
    }

    extractData() {
        this.formctrl_.item.tag = this.tag_.value ;
        this.formctrl_.item.datatype = this.data_type_.value ;
        this.formctrl_.item.placeholder = this.placeholder_.value ;
        this.formctrl_.item.font = this.font_name_.value ;
        this.formctrl_.item.fontsize = parseInt(this.font_size_.value) ;
        this.formctrl_.item.color = this.text_color_.value ;
    }
}

class EditFormBooleanDialog extends EditFormControlDialog {
    constructor(close, formctrl) {
        super(close) ;

        this.formctrl_ = formctrl ;
    }

    async populateDialog(pdiv) {
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.tag_ = document.createElement('input') ;
        this.tag_.type = 'text' ;
        this.tag_.className = 'popup-form-edit-dialog-input' ;
        this.tag_.value = this.formctrl_.item.tag ;

        let label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Tag' ;
        label.appendChild(this.tag_) ;
        div.appendChild(label) ;

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.className = 'popup-form-edit-dialog-checkbox' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;
       
        pdiv.appendChild(div) ;
    }

    extractData() {
        this.formctrl_.item.tag = this.tag_.value ;
        this.formctrl_.item.color = this.text_color_.value ;
    }
}

class EditFormUpDownDialog extends EditFormControlDialog {
    constructor(close, formctrl) {
        super(close) ;

        this.formctrl_ = formctrl ;
    }

    async populateDialog(pdiv) {
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.tag_ = document.createElement('input') ;
        this.tag_.type = 'text' ;
        this.tag_.className = 'popup-form-edit-dialog-input' ;
        this.tag_.value = this.formctrl_.item.tag ;

        let label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Tag' ;
        label.appendChild(this.tag_) ;
        div.appendChild(label) ;        

        this.min_value_ = document.createElement('input') ;
        this.min_value_.type = 'number' ;
        this.min_value_.className = 'popup-form-edit-dialog-input' ;
        this.min_value_.value = this.formctrl_.item.minvalue ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Minimum Value' ;
        label.appendChild(this.min_value_) ;
        div.appendChild(label) ;  

        this.max_value_ = document.createElement('input') ;
        this.max_value_.type = 'number' ;
        this.max_value_.className = 'popup-form-edit-dialog-input' ;
        this.max_value_.value = this.formctrl_.item.maxvalue ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Minimum Value' ;
        label.appendChild(this.max_value_) ;
        div.appendChild(label) ;  

        this.font_name_ = document.createElement('select') ;
        this.font_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await window.queryLocalFonts() ;
        for(let font of fonts) {
            let option = document.createElement('option') ;
            option.value = font.fullName ;
            option.innerText = font.fullName ;
            this.font_name_.appendChild(option) ;
        }
        this.font_name_.value = this.formctrl_.item.font ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font' ;
        label.appendChild(this.font_name_) ;
        div.appendChild(label) ;       
        
        this.font_size_ = document.createElement('input') ;
        this.font_size_.type = 'number' ;
        this.font_size_.max = 48 ;
        this.font_size_.min = 8 ;
        this.font_size_.className = 'popup-form-edit-dialog-input' ;
        this.font_size_.value = this.formctrl_.item.fontsize ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Size' ;
        label.appendChild(this.font_size_) ;
        div.appendChild(label) ;  

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.className = 'popup-form-edit-dialog-input' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Text Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;

        pdiv.appendChild(div) ;
    }

    extractData() {
        this.formctrl_.item.tag = this.tag_.value ;
        this.formctrl_.item.minvalue = parseInt(this.min_value_.value) ;
        this.formctrl_.item.maxvalue = parseInt(this.max_value_.value) ;
        this.formctrl_.item.color = this.text_color_.value ;
        this.formctrl_.item.font = this.font_name_.value ;
        this.formctrl_.item.fontsize = parseInt(this.font_size_.value) ;
    }
}

class EditFormMultipleSelectDialog extends EditFormControlDialog {
    static addNewChoiceValue = 'Add New Choice Value' ;

    constructor(close, formctrl) {
        super(close) ;

        this.formctrl_ = formctrl ;
    }

    deleteChoice(e, cell) {
        let data = cell.getRow().getData().choice ;
        if (data === EditFormMultipleSelectDialog.addNewChoiceValue) {
            return ;
        }
        cell.getRow().delete() ;
    }

    getChoiceData() {
        let data = [] ;
        for(let choice of this.formctrl_.item.choices) {
            data.push(
                { 
                    choice: choice.text,
                    value: choice.value
                }
            ) ;
        }
        return data ;
    }

    async populateDialog(pdiv) {
        let label ;

        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.tag_ = document.createElement('input') ;
        this.tag_.type = 'text' ;
        this.tag_.className = 'popup-form-edit-dialog-input' ;
        this.tag_.value = this.formctrl_.item.tag ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Tag' ;
        label.appendChild(this.tag_) ;
        div.appendChild(label) ;        


        this.font_name_ = document.createElement('select') ;
        this.font_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await window.queryLocalFonts() ;
        for(let font of fonts) {
            let option = document.createElement('option') ;
            option.value = font.fullName ;
            option.innerText = font.fullName ;
            this.font_name_.appendChild(option) ;
        }
        this.font_name_.value = this.formctrl_.item.font ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font' ;
        label.appendChild(this.font_name_) ;
        div.appendChild(label) ;       
        
        this.font_size_ = document.createElement('input') ;
        this.font_size_.type = 'number' ;
        this.font_size_.max = 48 ;
        this.font_size_.min = 8 ;
        this.font_size_.className = 'popup-form-edit-dialog-input' ;
        this.font_size_.value = this.formctrl_.item.fontsize ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Size' ;
        label.appendChild(this.font_size_) ;
        div.appendChild(label) ;  

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.className = 'popup-form-edit-dialog-input' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;       

        this.radio_size_ = document.createElement('input') ;
        this.radio_size_.type = 'number' ;
        this.radio_size_.className = 'popup-form-edit-dialog-input' ;
        this.radio_size_.value = this.formctrl_.item.radiosize ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Radio Button Size' ;
        label.appendChild(this.radio_size_) ;
        div.appendChild(label) ;  

        this.orientation_ = document.createElement('select') ;
        this.orientation_.className = 'popup-form-edit-dialog-select' ;
        let option = document.createElement('option') ;
        option.value = 'vertical' ;
        option.innerText = 'Vertical' ;
        this.orientation_.appendChild(option) ;

        option = document.createElement('option') ;
        option.value = 'horizontal' ;
        option.innerText = 'Horizontal' ;
        this.orientation_.appendChild(option) ;
        this.orientation_.value = this.formctrl_.item.orientation ;
        div.appendChild(this.orientation_) ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Orientation' ;
        label.appendChild(this.orientation_) ;
        div.appendChild(label) ;      

        this.list_ = document.createElement('div') ;
        div.appendChild(this.list_) ;

        this.table_ = new Tabulator(this.list_, 
            {
                height: "200px",
                width: "100%",
                data: this.getChoiceData(),
                layout:"fitDataStretch",
                resizableColumnFit:false,
                columns: [
                    {
                        formatter:"buttonCross", 
                        width:40, 
                        cellClick: this.deleteChoice.bind(this),
                        editable: false,
                        headerSort: false
                    },
                    {
                        title: "Choice", 
                        field: "choice", 
                        hozAlign: "left",
                        editable: true,
                        editor: "input",
                        headerSort: false
                    },
                    {
                        title: "Value", 
                        field: "value", 
                        hozAlign: "left",
                        editable: this.valueEditable.bind(this),
                        editor: "input",
                        headerSort: false
                    }
                ]
            }
        );
        this.list_.style.marginTop = '8px' ;

        this.table_.on('cellEdited', this.cellEdited.bind(this)) ;
        this.table_.on('tableBuilt', this.tableBuilt.bind(this)) ;

        pdiv.appendChild(div) ;
    }

    valueEditable(cell) {
        let data = cell.getRow().getData().choice ;
        if (data === EditFormMultipleSelectDialog.addNewChoiceValue) {
            return false ;
        }

        return true ;
    }

    tableBuilt() {
        this.table_.addRow({ choice: EditFormMultipleSelectDialog.addNewChoiceValue }) ;
    }

    cellEdited(cell) {
        if (cell.getValue() === EditFormMultipleSelectDialog.addNewChoiceValue) {
            cell.restoreOldValue() ;
        }
        else if  (cell.getOldValue() === EditFormMultipleSelectDialog.addNewChoiceValue) {
            this.table_.addRow({ choice: EditFormMultipleSelectDialog.addNewChoiceValue }) ;
        }
    }

    extractData() {
        this.formctrl_.item.tag = this.tag_.value ;
        this.formctrl_.item.color = this.text_color_.value ;
        this.formctrl_.item.font = this.font_name_.value ;
        this.formctrl_.item.fontsize = parseInt(this.font_size_.value) ;
        this.formctrl_.item.orientation = this.orientation_.value ;
        this.formctrl_.item.radiosize = parseInt(this.radio_size_.value)       
        this.formctrl_.item.choices = [] ;
        let values = [] ;
        for(let rows of this.table_.getRows()) {
            let choice = rows.getData().choice ;
            if (choice === EditFormMultipleSelectDialog.addNewChoiceValue) {
                break ;
            }
            let value = rows.getData().value ;
            values.push(value) ;
            this.formctrl_.item.choices.push({ text: choice, value: value }) ;
        }
        this.formctrl_.item.datatype = this.formctrl_.deduceDataType(values) ;
    }
}

class EditFormSelectDialog extends EditFormControlDialog {
    static addNewChoiceValue = 'Add New Choice Value' ;

    constructor(close, formctrl) {
        super(close) ;

        this.formctrl_ = formctrl ;
    }

    deleteChoice(e, cell) {
        let data = cell.getRow().getData().choice ;
        if (data === EditFormSelectDialog.addNewChoiceValue) {
            return ;
        }
        cell.getRow().delete() ;
    }

    getChoiceData() {
        let data = [] ;
        for(let choice of this.formctrl_.item.choices) {
            data.push(
                { 
                    choice: choice.text,
                    value: choice.value
                }
            ) ;
        }
        return data ;
    }

    async populateDialog(pdiv) {
        let label ;

        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.tag_ = document.createElement('input') ;
        this.tag_.type = 'text' ;
        this.tag_.className = 'popup-form-edit-dialog-input' ;
        this.tag_.value = this.formctrl_.item.tag ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Tag' ;
        label.appendChild(this.tag_) ;
        div.appendChild(label) ;    

        this.font_name_ = document.createElement('select') ;
        this.font_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await window.queryLocalFonts() ;
        for(let font of fonts) {
            let option = document.createElement('option') ;
            option.value = font.fullName ;
            option.innerText = font.fullName ;
            this.font_name_.appendChild(option) ;
        }
        this.font_name_.value = this.formctrl_.item.font ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font' ;
        label.appendChild(this.font_name_) ;
        div.appendChild(label) ;       
        
        this.font_size_ = document.createElement('input') ;
        this.font_size_.type = 'number' ;
        this.font_size_.max = 48 ;
        this.font_size_.min = 8 ;
        this.font_size_.className = 'popup-form-edit-dialog-input' ;
        this.font_size_.value = this.formctrl_.item.fontsize ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Font Size' ;
        label.appendChild(this.font_size_) ;
        div.appendChild(label) ;  

        this.text_color_ = document.createElement('input') ;
        this.text_color_.type = 'color' ;
        this.text_color_.className = 'popup-form-edit-dialog-input' ;
        this.text_color_.value = this.formctrl_.item.color ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Color' ;
        label.appendChild(this.text_color_) ;
        div.appendChild(label) ;       

        this.list_ = document.createElement('div') ;
        div.appendChild(this.list_) ;

        this.table_ = new Tabulator(this.list_, 
            {
                height: "200px",
                width: "100%",
                data: this.getChoiceData(),
                layout:"fitDataStretch",
                resizableColumnFit:false,
                columns: [
                    {
                        formatter:"buttonCross", 
                        width:40, 
                        cellClick: this.deleteChoice.bind(this),
                        editable: false,
                        headerSort: false
                    },
                    {
                        title: "Choice", 
                        field: "choice", 
                        hozAlign: "left",
                        editable: true,
                        editor: "input",
                        headerSort: false
                    },
                    {
                        title: "Value", 
                        field: "value", 
                        hozAlign: "left",
                        editable: this.valueEditable.bind(this),
                        editor: "input",
                        headerSort: false
                    }
                ]
            }
        );
        this.list_.style.marginTop = '8px' ;

        this.table_.on('cellEdited', this.cellEdited.bind(this)) ;
        this.table_.on('tableBuilt', this.tableBuilt.bind(this)) ;

        pdiv.appendChild(div) ;
    }

    valueEditable(cell) {
        let data = cell.getRow().getData().choice ;
        if (data === EditFormMultipleSelectDialog.addNewChoiceValue) {
            return false ;
        }

        return true ;
    }

    tableBuilt() {
        this.table_.addRow({ choice: EditFormMultipleSelectDialog.addNewChoiceValue }) ;
    }

    cellEdited(cell) {
        if (cell.getValue() === EditFormMultipleSelectDialog.addNewChoiceValue) {
            cell.restoreOldValue() ;
        }
        else if  (cell.getOldValue() === EditFormMultipleSelectDialog.addNewChoiceValue) {
            this.table_.addRow({ choice: EditFormMultipleSelectDialog.addNewChoiceValue }) ;
        }
    }

    extractData() {
        this.formctrl_.item.tag = this.tag_.value ;
        this.formctrl_.item.color = this.text_color_.value ;
        this.formctrl_.item.font = this.font_name_.value ;
        this.formctrl_.item.fontsize = parseInt(this.font_size_.value) ;

        this.formctrl_.item.choices = [] ;
        let values = [] ;
        for(let rows of this.table_.getRows()) {
            let choice = rows.getData().choice ;
            if (choice === EditFormMultipleSelectDialog.addNewChoiceValue) {
                break ;
            }
            let value = rows.getData().value ;
            values.push(value) ;
            this.formctrl_.item.choices.push(
                { 
                    text: choice, 
                    value: value 
                }) ;
        }

        this.formctrl_.item.datatype = this.formctrl_.deduceDataType(values) ;
        if (this.formctrl_.item.datatype !== 'string') {
            //
            // Make sure all of the choice values are numbers
            //
            for(let choice of this.formctrl_.item.choices) {
                choice.value = parseFloat(choice.value) ;
            }
        }
    }
}

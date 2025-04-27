
class FormControl {
    static ctrlTypeText = 'text' ;
    static ctrlTypeBoolean = 'boolean' ;
    static ctrlTypeUpDown = 'updown' ;
    static ctrlTypeMultipleChoice = 'choice' ;
    static ctrlTypeSelect = 'select' ;

    constructor(editdone, item) {
        this.item = item ;
        this.ctrl = undefined ;
        this.editdone = editdone ;
    }

    update(pitem, clone) {
        if (!clone) {
            this.item = pitem ;
        }
        else {
            for(let key of Object.keys(pitem)) {
                if (key !== 'tag') {
                    this.item[key] = pitem[key] ;
                }
            }
        }
    }

    createForEdit(parent) {
    }

    edit(parent) {
    }

    callback(changed) {
        if (changed) {
            this.editdone(changed) ;
        }
    }
}

class LabelFormControl extends FormControl {
    constructor(editdone, ptag, px, py, pwidth, pheight) {
        super(      
            editdone,
            {
                type: FormControl.ctrlTypeLabel,
                x: px,
                y: py,
                width: pwidth,
                height: pheight,
                font: 'Arial',
                fontsize: 36,
                color: 'black',
                tag: ptag,
                text: 'Label'
            }) ;
    }

    clone(tag) {
        let ret = new LabelFormControl(this.editdone, tag, this.item.x, this.item.y, this.item.width, this.item.height) ;
        ret.update(this.item, true) ;
        return ret ;
    }

    createForEdit(parent) {
        let label = document.createElement('p') ;
        label.className = 'form-edit-label' ;
        label.style.position = 'absolute' ;
        label.style.left = this.item.x + 'px' ;
        label.style.top = this.item.y + 'px' ;
        label.style.width = this.item.width + 'px' ;
        label.style.height = this.item.height + 'px' ;
        label.innerText = this.item.text ;
        label.style.font = this.item.font ;
        label.style.fontSize = this.item.fontsize + 'px' ;
        label.style.color = this.item.color ;
        label.disabled = true ;
        label.style.margin = '4px' ;

        this.ctrl = label ;
        parent.appendChild(label) ;
    }
    
    edit(parent) {
        let dialog = new EditFormLabelDialog(this.callback.bind(this), this) ;
        dialog.showRelative(parent) ;
    }
}

class TextFormControl extends FormControl {
    constructor(editdone, ptag, px, py, pwidth, pheight) {
        super(
            editdone, 
            {
                type: FormControl.ctrlTypeText,
                x: px,
                y: py,
                width: pwidth,
                height: pheight,
                font: 'Arial',
                fontsize: 36,
                color: 'black',
                backcolor: '#f0f0f0f',
                tag: ptag,
                placeholder: 'Enter text here',
            }) ;
    }

    clone(tag) {
        let ret = new TextFormControl(this.editdone, tag, this.item.x, this.item.y, this.item.width, this.item.height) ;
        ret.update(this.item, true) ;
        return ret ;
    }

    createForEdit(parent) {
        let input = document.createElement('input') ;
        input.className = 'form-edit-text-input' ;
        input.type = 'text' ;
        input.style.position = 'absolute' ;
        input.style.left = this.item.x + 'px' ;
        input.style.top = this.item.y + 'px' ;
        input.style.width = this.item.width + 'px' ;
        input.style.height = this.item.height + 'px' ;
        input.value = this.item.placeholder ;
        input.style.font = this.item.font ;
        input.style.fontSize = this.item.fontsize + 'px' ;
        input.style.color = this.item.color ;
        input.style.backgroundColor = this.item.backcolor ;
        input.disabled = true ;
        input.style.margin = '4px' ;

        this.ctrl = input ;
        parent.appendChild(input) ;
    }

    edit(parent) {
        let dialog = new EditFormTextDialog(this.callback.bind(this), this) ;
        dialog.showRelative(parent) ;
    }
}

class BooleanFormControl extends FormControl {
    constructor(editdone, ptag, px, py, pwidth, pheight) {
        super(
            editdone, 
            {
                type: FormControl.ctrlTypeBoolean,
                x: px,
                y: py,
                width: pwidth,
                height: pheight,
                color: 'blue',
                backcolor: 'white',
                tag: ptag,
            }) ;
    }

    clone(tag) {
        let ret = new BooleanFormControl(this.editdone, tag, this.item.x, this.item.y, this.item.width, this.item.height) ;
        ret.update(this.item, true) ;
        return ret ;
    }

    createForEdit(parent) {
        let div = document.createElement('div') ;
        div.className = 'form-edit-checkbox-div' ;
        div.style.position = 'absolute' ;
        div.style.left = this.item.x + 'px' ;
        div.style.top = this.item.y + 'px' ;
        div.style.width = this.item.width + 'px' ;
        div.style.height = this.item.height + 'px' ;
        div.style.margin = '4px' ;

        let input = document.createElement('input') ;
        input.className = 'form-edit-checkbox' ;
        input.type = 'checkbox' ;
        input.style.accentColor = this.item.color ;
        input.disabled = true ;
        input.checked = true ;
        div.appendChild(input) ;

        this.ctrl = div ;
        parent.appendChild(div) ;
    }

    edit(parent) {
        let dialog = new EditFormBooleanDialog(this.callback.bind(this), this) ;
        dialog.showRelative(parent) ;
    }
}

class UpDownFormControl extends FormControl {
    constructor(editdone, ptag, px, py, pwidth, pheight) {
        super(
            editdone, 
            {
                type: FormControl.ctrlTypeUpDown,
                x: px,
                y: py,
                width: pwidth,
                height: pheight,
                color: 'black',
                backcolor: 'grey',
                tag: ptag,
            }) ;
    }

    clone(tag) {
        let ret = new UpDownFormControl(this.editdone, tag, this.item.x, this.item.y, this.item.width, this.item.height) ;
        ret.update(this.item, true)
        return ret ;
    }

    createForEdit(parent) {
        let div = document.createElement('div') ;
        div.style.position = 'absolute' ;
        div.style.left = this.item.x + 'px' ;
        div.style.top = this.item.y + 'px' ;
        div.style.width = this.item.width + 'px' ;
        div.style.height = this.item.height + 'px' ;
        div.style.margin = '4px' ;
        div.style.backgroundColor = this.item.backcolor ;
        div.disabled = true ;
        div.className = 'form-edit-updown' ;

        this.upbutton_ = document.createElement('button') ;
        this.upbutton_.className = 'form-edit-updown-button' ;
        this.upbutton_.disabled = false ;
        this.upbutton_.style.pointerEvents = 'none' ;
        this.upbutton_.innerHTML = '&uarr;' ;
        this.upbutton_.style.font = this.item.font ;
        this.upbutton_.style.fontSize = this.item.fontsize + 'px' ;
        this.upbutton_.style.color = this.item.color ;
        this.upbutton_.style.backgroundColor = this.item.backcolor ;
        div.appendChild(this.upbutton_) ;

        this.count_ = document.createElement('span') ;
        this.count_.className = 'form-edit-updown-count' ;
        this.count_.disabled = false ;
        this.count_.innerHTML = '12' ;
        this.count_.style.font = this.item.font ;
        this.count_.style.fontSize = this.item.fontsize + 'px' ;
        this.count_.style.color = this.item.color ;
        this.count_.style.backgroundColor = this.item.backcolor ;
        div.appendChild(this.count_) ;

        this.downbutton_ = document.createElement('button') ;
        this.downbutton_.className = 'form-edit-updown-button' ;
        this.downbutton_.disabled = false ;
        this.downbutton_.innerHTML = '&darr;' ;
        this.downbutton_.style.font = this.item.font ;
        this.downbutton_.style.fontSize = this.item.fontsize + 'px' ;
        this.downbutton_.style.color = this.item.color ;
        this.downbutton_.style.backgroundColor = this.item.backcolor ;
        div.appendChild(this.downbutton_) ;

        this.ctrl = div ;
        parent.appendChild(div) ;
    }

    edit(parent) {
        let dialog = new EditFormUpDownDialog(this.callback.bind(this), this) ;
        dialog.showRelative(parent) ;
    }
}

class MultipleChoiceFormControl extends FormControl {
    constructor(editdone, ptag, px, py, pwidth, pheight) {
        super(
            editdone, 
            {
                type: FormControl.ctrlTypeMultipleChoice,
                x: px,
                y: py,
                width: pwidth,
                height: pheight,
                radiosize: 20,
                tag: ptag,
                data: 'integer',
                orientation: 'vertical',
                choices: [
                    { text: 'Choice 1', value: 1},
                    { text: 'Choice 2', value: 2 },
                    { text: 'Choice 3', value: 3 },
                ],
            }) ;

        this.choices_ctrls_ = [] ;
    }

    update(item, clone) {
        super.update(item, clone) ;

        if (clone) {
            this.item.choices = [] ;
            for(let choice of item.choices) {
                this.item.choices.push({ text: choice.text, value: choice.value }) ;
            }
        }
    }

    clone(tag) {
        let ret = new MultipleChoiceFormControl(this.editdone, tag, this.item.x, this.item.y, this.item.width, this.item.height) ;
        ret.update(this.item, true)
        return ret ;
    }

    updateChoices() {
        this.choices_ctrls_ = [] ;
        if (this.table_ && this.ctrl.contains(this.table_)) {
            this.ctrl.removeChild(this.table_) ;
        }
        this.addAllChoices() ;
    }

    addAllChoices() {
        this.table_ = document.createElement('table') ;
        this.ctrl.appendChild(this.table_) ;

        if (this.item.orientation === 'vertical') {
            this.table_.className = 'form-edit-multiple-choice-table' ;
            for(let choice of this.item.choices) {
                let tabrow = document.createElement('tr') ;
                tabrow.className = 'form-edit-multiple-choice-item' ;

                let label = document.createElement('td') ;
                label.className = 'form-edit-multiple-choice-label' ;
                label.innerHTML = choice.text ;
                label.style.font = this.item.font ;
                label.style.fontSize = this.item.fontsize + 'px' ;
                label.style.color = this.item.color ;
                tabrow.appendChild(label) ;

                let iwrap = document.createElement('td') ;
                tabrow.appendChild(iwrap) ;

                let input = document.createElement('input') ;
                input.type = 'radio' ;
                input.className = 'form-edit-multiple-choice-radio' ;
                input.style.accentColor = this.item.color ;
                input.disabled = true ;
                input.checked = true ;
                input.name = this.item.tag ;
                input.id = this.item.tag + '_' + choice.value ;
                input.style.font = this.item.font ;
                input.style.fontSize = this.item.fontsize + 'px' ;
                input.style.color = this.item.color ;
                input.style.width = this.item.radiosize + 'px' ;
                input.style.height = this.item.radiosize + 'px' ;
                iwrap.appendChild(input) ;

                this.table_.appendChild(tabrow) ;
            }
        }
        else {
            this.table_.className = 'form-edit-multiple-choice-table-horizontal' ;
            let tabrow = document.createElement('tr') ;
            tabrow.className = 'form-edit-multiple-choice-item-horizontal' ;
            tabrow.style.width = '100%' ;
            this.table_.appendChild(tabrow) ;
            let first = true ;

            for(let choice of this.item.choices) {
                if (!first) {
                    let sep = document.createElement('td') ;
                    sep.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;' ;
                    sep.className = 'form-edit-multiple-choice-separator-horizontal' ;
                    tabrow.appendChild(sep) ;
                }

                let label = document.createElement('td') ;
                label.className = 'form-edit-multiple-choice-label-horizontal' ;
                label.innerHTML = choice.text ;
                label.style.font = this.item.font ;
                label.style.fontSize = this.item.fontsize + 'px' ;
                label.style.color = this.item.color ;
                tabrow.appendChild(label) ;

                let iwrap = document.createElement('td') ;
                iwrap.className = 'form-edit-multiple-choice-wrap-horizontal' ;
                tabrow.appendChild(iwrap) ;

                let input = document.createElement('input') ;
                input.type = 'radio' ;
                input.className = 'form-edit-multiple-choice-radio-horizontal' ;
                input.style.accentColor = this.item.color ;
                input.disabled = true ;
                input.checked = true ;
                input.name = this.item.tag ;
                input.id = this.item.tag + '_' + choice.value ;
                input.style.font = this.item.font ;
                input.style.fontSize = this.item.fontsize + 'px' ;
                input.style.color = this.item.color ;
                input.style.width = this.item.radiosize + 'px' ;
                input.style.height = this.item.radiosize + 'px' ;
                iwrap.appendChild(input) ;

                first = false ;
            }
        }
    }

    createForEdit(parent) {
        this.choices_ctrls_ = [] ;

        let div = document.createElement('div') ;
        div.className = 'form-edit-multiple-choice' ;
        div.style.position = 'absolute' ;
        div.style.left = this.item.x + 'px' ;
        div.style.top = this.item.y + 'px' ;
        div.style.width = this.item.width + 'px' ;
        div.style.height = this.item.height + 'px' ;
        div.style.margin = '4px' ;
        div.style.backgroundColor = this.item.backcolor ;
        div.style.flexDirection = this.item.orientation === 'vertical' ? 'column' : 'row' ;
        div.disabled = true ;
        this.ctrl = div ;

        this.addAllChoices() ;
        parent.appendChild(div) ;
    }    

    edit(parent) {
        let dialog = new EditFormMultipleSelectDialog(this.callback.bind(this), this) ;
        dialog.showRelative(parent) ;
    }    
}

class SelectFormControl extends FormControl {
    constructor(editdone, ptag, px, py, pwidth, pheight) {
        super(
            editdone, 
            {
                type: FormControl.ctrlTypeSelect,
                x: px,
                y: py,
                width: pwidth,
                height: pheight,
                tag: ptag,
                data: 'integer',
                choices: [
                    { text: 'Choice 1', value: 1},
                    { text: 'Choice 2', value: 2 },
                    { text: 'Choice 3', value: 3 },
                ],
            }) ;
        this.select_ctrls_ = [] ;
    }

    update(item, clone) {
        super.update(item, clone) ;

        if (clone) {
            this.item.choices = [] ;
            for(let choice of item.choices) {
                this.item.choices.push({ text: choice.text, value: choice.value }) ;
            }
        }
    }

    clone(tag) {
        let ret = new SelectFormControl(this.editdone, tag, this.item.x, this.item.y, this.item.width, this.item.height) ;
        ret.update(this.item, true)
        return ret ;
    }

    updateChoices() {
        this.choices_ctrls_ = [] ;
        if (this.select_ && this.ctrl.contains(this.select_)) {
            this.ctrl.removeChild(this.select_) ;
        }
        this.addAllChoices() ;
    }

    addAllChoices() {
        this.select_ = document.createElement('select') ;
        this.select_.className = 'form-edit-multiple-select' ;
        this.select_.style.font = this.item.font ;
        this.select_.style.fontSize = this.item.fontsize + 'px' ;
        this.select_.style.color = this.item.color ;
        this.ctrl.appendChild(this.select_) ;

        for(let choice of this.item.choices) {
            let opt = document.createElement('option') ;
            opt.value = choice.value ;
            opt.innerHTML = choice.text ;
            opt.style.font = this.item.font ;
            opt.style.fontSize = this.item.fontsize + 'px' ;
            opt.style.color = this.item.color ;
            this.select_.appendChild(opt) ;
        }
    }
    
    createForEdit(parent) {
        this.choices_ctrls_ = [] ;

        let div = document.createElement('div') ;
        div.className = 'form-edit-multiple-choice' ;
        div.style.position = 'absolute' ;
        div.style.left = this.item.x + 'px' ;
        div.style.top = this.item.y + 'px' ;
        div.style.width = this.item.width + 'px' ;
        div.style.height = this.item.height + 'px' ;
        div.style.zIndex = 1000 ;
        div.style.pointerEvents = 'none' ;
        div.style.margin = '4px' ;
        div.style.backgroundColor = this.item.backcolor ;
        div.style.flexDirection = this.item.orientation === 'vertical' ? 'column' : 'row' ;
        div.disabled = true ;
        this.ctrl = div ;

        this.addAllChoices() ;
        parent.appendChild(div) ;
    }    

    edit(parent) {
        let dialog = new EditFormSelectDialog(this.callback.bind(this), this) ;
        dialog.showRelative(parent) ;
    }       
}

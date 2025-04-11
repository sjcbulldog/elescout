
class FormulaEditor {

    constructor(name, formula, fields) {
        this.name = name ;
        this.formula = formula ;
        this.fields = fields ;

        this.callbacks_ = new Map();

        this.popup = document.createElement('div');
        this.popup.className = 'formula-editor';

        this.content = document.createElement('div');
        this.content.className = 'formula-editor-content';
        this.popup.appendChild(this.content);

        this.title = document.createElement('div');
        this.title.className = 'formula-editor-title';
        this.title.innerText = 'Editing Formula: ' + this.name ;
        this.content.appendChild(this.title);

        this.editor = document.createElement('div');
        this.editor.className = 'formula-editor-input';
        this.content.appendChild(this.editor);

        this.editor_input = document.createElement('input');
        this.editor_input.type = 'text';
        this.editor_input.className = 'formula-editor-input-text';
        this.editor_input.value = this.formula ;
        this.editor_input.addEventListener('input', this.inputChanged.bind(this)) ;
        this.editor_input.addEventListener('keydown', this.keydown.bind(this)) ;
        this.editor.appendChild(this.editor_input);

        this.editor_complete = document.createElement('div');
        this.editor_complete.className = 'formula-editor-input-autocomplete';
        this.editor.appendChild(this.editor_complete);
        this.editor_complete.innerText = '-' ;

        this.buttondiv = document.createElement('div');
        this.buttondiv.className = 'formula-editor-buttondiv';
        this.content.appendChild(this.buttondiv);

        this.okbutton = document.createElement('button');
        this.okbutton.className = 'formula-editor-button';
        this.okbutton.innerText = 'OK';
        this.buttondiv.appendChild(this.okbutton);
        this.okbutton.onclick = this.okPressed.bind(this) ;

        this.cancelbutton = document.createElement('button');
        this.cancelbutton.className = 'formula-editor-button';
        this.cancelbutton.innerText = 'Cancel';
        this.buttondiv.appendChild(this.cancelbutton);
        this.cancelbutton.onclick = this.cancelPressed.bind(this) ;
    }

    setFocus() {
        this.editor_input.focus() ;
        this.editor_input.setSelectionRange(this.editor_input.value.length, this.editor_input.value.length) ;
    }

    extractLastText() {
        let input = this.editor_input.value ;
        let lastText = input.split(' ').pop() ;
        return lastText ;
    }

    fillAutoComplete() {
        let input = this.extractLastText() ;
        let text = '-' ;
        if (input.length !== 0) {
            text = '' ;
            for(let field of this.fields) {
                if (field.startsWith(input)) {
                    if (text.length > 0) {
                        text += '<br>'
                    }
                    text += field ;
                }
            }

            if (text.length === 0) {
                 text = '-' ;
            }
            else {
                text += '<br>' ;
            }
        }

        this.editor_complete.innerHTML = text ;
        this.editor_complete.style.display = 'block' ;
    }

    keydown(event) {
        if (event.key === 'Enter') {
            this.okPressed() ;
        } else if (event.key === 'Escape') {
            this.cancelPressed() ;
        }
    }
    
    inputChanged(event) {
        if (event.key === 'Enter') {
            this.okPressed() ;
        } else if (event.key === 'Escape') {
            this.cancelPressed() ;
        } else {
            this.fillAutoComplete() ;
        }
    }

    registerCallback(name, func) {

        if (!this.callbacks_.has(name)) {
            this.callbacks_.set(name, []);
        }

        if (!this.callbacks_.get(name).includes(func)) {
            this.callbacks_.get(name).push(func);
        }
    }

    okPressed() {
        if (this.callbacks_.has('ok')) {
            for(let func of this.callbacks_.get('ok')) {
                func(this.editor_input.value) ;
            }
        }
    }

    cancelPressed() {
        if (this.callbacks_.has('cancel')) {
            for(let func of this.callbacks_.get('cancel')) {
                func() ;
            }
        }
    }
    
    show(x, y, width, height) {
        this.popup.style.left = `${x}px`;
        this.popup.style.top = `${y}px`;
        this.popup.style.width = `${width}px`;
        this.popup.style.height = `${height}px`;

        document.body.appendChild(this.popup);
    }
    
    hide() {
        if (this.popup === null) {
            return;
        }
        this.popup.style.display = 'none';
    }

    destroy() {
        this.hide() ;
        this.callbacks_.clear() ;
        document.body.removeChild(this.popup);
        this.popup = null ;
    }
}
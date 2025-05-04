
class FormulaEditor {

    constructor(name, formula, fields) {
        this.name = name ;
        this.formula = formula ;
        this.fields = fields ;
        this.current_list = [] ;

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
        this.editor_input.spellcheck = false ;
        this.editor_input.addEventListener('input', this.inputChanged.bind(this)) ;
        this.editor_input.addEventListener('keydown', this.keydown.bind(this)) ;
        this.editor.appendChild(this.editor_input);

        this.editor_complete = document.createElement('div');
        this.editor_complete.className = 'formula-editor-input-autocomplete';
        this.editor.appendChild(this.editor_complete);
        this.editor_complete.innerText = '-' ;
        this.editor_complete.addEventListener('dblclick', this.autoClicked.bind(this)) ;

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

    extractLastText() {
        let input = this.editor_input.value ;
        let lastText = input.split(' ').pop() ;
        return lastText ;
    }

    fillAutoComplete() {
        let added = false ;
        this.current_list = [] ;

        while (this.editor_complete.firstChild) {
            this.editor_complete.removeChild(this.editor_complete.firstChild);
        }

        let input = this.extractLastText() ;
        if (input.length !== 0) {
            for(let field of this.fields) {
                if (field.startsWith(input)) {
                    this.current_list.push(field) ;
                    let span = document.createElement('span') ;
                    this.editor_complete.appendChild(span) ;
                    span.className = 'formula-editor-input-autocomplete-item' ;
                    span.innerText = field ;
                    added = true ;
                    span.addEventListener('click', this.autoClicked.bind(this)) ;
                }
            }
        }
    }

    replaceWithKeyword(keyword) {
        let input = this.editor_input.value ;
        let lastText = input.split(' ').pop() ;
        let newInput = input.slice(0, -lastText.length) + keyword + ' ' ;
        this.editor_input.value = newInput ;
        this.fillAutoComplete() ;

        this.editor_input.focus() ;
        this.editor_input.setSelectionRange(newInput.length, newInput.length) ;
    }

    autoClicked(event) {
        this.replaceWithKeyword(event.target.innerText) ;
    }

    keydown(event) {
        if (event.key === 'Enter') {
            this.okPressed() ;
        } else if (event.key === 'Escape') {
            this.cancelPressed() ;
        }
        else if (event.key === 'Tab') {
            event.preventDefault() ;
            if (this.current_list.length === 1) {
                this.replaceWithKeyword(this.current_list[0]) ;
            }
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
    
    setFocus() {
        this.editor_input.setSelectionRange(this.editor_input.value.length, this.editor_input.value.length) ;
        this.editor_input.focus() ;
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
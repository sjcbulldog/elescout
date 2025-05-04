
class PopupEditor {

    constructor(title, data, selected) {
        this.data = data ;
        this.selected = selected ;

        this.callbacks_ = new Map();

        let tdata = [] ;
        for(let one of data) {
            let selected = false ;
            if (this.selected.indexOf(one) !== -1) {
                selected = true ;
            }
            tdata.push(
                {
                    selected: selected,
                    item: one 
                }) ;
        }

        this.popup = document.createElement('div');
        this.popup.className = 'popup-editor';

        this.content = document.createElement('div');
        this.content.className = 'popup-editor-content';
        this.popup.appendChild(this.content);

        this.title = document.createElement('div');
        this.title.className = 'popup-editor-title';
        this.title.innerText = title;
        this.content.appendChild(this.title);

        this.list = document.createElement('div');
        this.list.className = 'popup-editor-title';
        this.content.appendChild(this.list);

        this.buttondiv = document.createElement('div');
        this.buttondiv.className = 'popup-editor-buttondiv';
        this.content.appendChild(this.buttondiv);

        this.okbutton = document.createElement('button');
        this.okbutton.className = 'popup-editor-button';
        this.okbutton.innerText = 'OK';
        this.buttondiv.appendChild(this.okbutton);
        this.okbutton.onclick = this.okPressed.bind(this) ;

        this.cancelbutton = document.createElement('button');
        this.cancelbutton.className = 'popup-editor-button';
        this.cancelbutton.innerText = 'Cancel';
        this.buttondiv.appendChild(this.cancelbutton);
        this.cancelbutton.onclick = this.cancelPressed.bind(this) ;

        this.selectallbutton = document.createElement('button');
        this.selectallbutton.className = 'popup-editor-button';
        this.selectallbutton.innerText = 'Select All';
        this.buttondiv.appendChild(this.selectallbutton);
        this.selectallbutton.onclick = this.selectAll.bind(this) ;

        this.unselectallbutton = document.createElement('button');
        this.unselectallbutton.className = 'popup-editor-button';
        this.unselectallbutton.innerText = 'Unselect All';
        this.buttondiv.appendChild(this.unselectallbutton);
        this.unselectallbutton.onclick = this.unselectAll.bind(this) ;

        this.table_ = new Tabulator(this.list, 
            {
                height: "85%",
                data: tdata,
                layout:"fitData",
                resizableColumnFit:false,
                columns: [
                    {
                        title: "Selected",
                        field: "selected",
                        formatter: "tickCross",
                        editor: "tickCross",
                    },
                    {
                        title: "Item", 
                        field: "item", 
                        hozAlign: "left",
                    }
                ]
            });
    }
    registerCallback(name, func) {

        if (!this.callbacks_.has(name)) {
            this.callbacks_.set(name, []);
        }

        if (!this.callbacks_.get(name).includes(func)) {
            this.callbacks_.get(name).push(func);
        }
    }


    selectAll() {
        for(let row of this.table_.getRows()) {
            row.getCell("selected").setValue(true);
        }
    }

    unselectAll() {
        for(let row of this.table_.getRows()) {
            row.getCell("selected").setValue(false);
        }
    }

    extractData() {
        let data = [] ;
        for(let row of this.table_.getRows()) {
            let selected = row.getCell("selected").getValue() ;
            if (selected) {
                data.push(row.getData().item) ;
            }
        }

        return data ;
    }

    okPressed() {
        if (this.callbacks_.has('ok')) {
            let data = this.extractData() ;
            for(let func of this.callbacks_.get('ok')) {
                func(data) ;
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
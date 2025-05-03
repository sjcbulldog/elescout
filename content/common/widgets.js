class XeroSelector {
	constructor(title, radio) {
		this.radio_ = radio ;
		let detail = document.createElement('details');
		detail.className = 'selector-details';

		let summary = document.createElement('summary');
		summary.innerText = title;
		detail.append(summary);

		let fieldset = document.createElement('fieldset');
		detail.append(fieldset);

		let legend = document.createElement('legend');
		legend.innerText = title;
		fieldset.append(legend);

		let list = document.createElement('ul');
		fieldset.append(list);

		this.detail = detail;
		this.summary = summary;
		this.fieldset = fieldset;
		this.list = list;
	}

	setTitle(title) {
		this.summary.innerText = title;
	}

	reset() {
		this.clear(this.list) ;
	}

	clear(elem) {
		while (elem.firstChild) {
			elem.removeChild(elem.firstChild);
		}
	}

	select(data) {
		for (let item of this.items) {
			if (item.xerodata === data) {
				item.checked = true;
			}
		}
	}

    selectItems(items) {
        for(let item of items) {
            this.select(item) ;
        }
    }

    getItems() {
		let data = [];
		if (this.items) {
			for (let item of this.items) {
					data.push(item.xerodata);
			}
		}

		return data;        
    }

    getSelectedItem() {
        let data = [];
		if (this.items) {
			for (let item of this.items) {
				if (item.checked) {
					data.push(item.xerodata);
				}
			}
		}
        if (data.length !== 1) {
            return undefined ;
        }

        return data[0] ;
    }

	getSelectedItems() {
		let data = [];
		if (this.items) {
			for (let item of this.items) {
				if (item.checked) {
					data.push(item.xerodata);
				}
			}
		}

		return data;
	}

	selectAll() {
		for(let item of this.items) {
			item.checked = true ;
		}
	}

    unselectAll() {
        for(let item of this.items) {
			item.checked = false ;
		}
    }

	addDataToSelectors(list, cb) {
		this.items = [];
		this.clear(this.list);

		for (let item of list) {
			let text = item;

			let li = document.createElement('li');
			let label = document.createElement('label');
			label.innerText = text;
			li.append(label);

			let check = document.createElement('input');
			if (this.radio_) {
				check.type = 'radio';
			}
			else {
				check.type = 'checkbox' ;
			}

			check.name = 'select';
			check.xerodata = item;
			check.onchange = cb;
			this.items.push(check);
			label.append(check);

			this.list.append(li);
		}
	}
}

class XeroFoldable {
    constructor(parent, child, title, width) {
        this.title = title;
        this.parent = parent;
        this.child = child;
        this.folded = false ;
        this.width = width || 200 ;

        // The top level element for the foldable
        this.elem = document.createElement('div') ;
        this.elem.className = 'xero-foldable' ;
        this.elem.style.width = this.width + 'px' ;
        parent.appendChild(this.elem) ;

        // The title element for the foldable
        this.titleelem = document.createElement('span') ;
        this.titleelem.className = 'xero-foldable-title' ;
        this.elem.appendChild(this.titleelem) ;

        this.titletext = document.createElement('span') ;
        this.titletext.className = 'xero-foldable-title-text' ;
        this.titletext.innerText = title ;
        this.titleelem.appendChild(this.titletext) ;

        this.titlearrow = document.createElement('span') ;
        this.titlearrow.className = 'xero-foldable-title-arrow' ;
        this.titlearrow.innerHTML = '&#11164' ;
        this.titleelem.appendChild(this.titlearrow) ;
        this.titlearrow.addEventListener('click', this.foldButtonClicked.bind(this)) ;

        // The content element for the foldable 
        this.content = document.createElement('div') ;
        this.content.className = 'xero-foldable-content' ;
        this.elem.appendChild(this.content) ;
    }

    foldButtonClicked() {
        this.folded = !this.folded ;
        if (this.folded) {
            this.titlearrow.innerHTML = '&#11166' ;
            this.content.style.display = 'none' ;
            this.titletext.style.display = 'none' ;
            this.elem.style.width = this.titlearrow.offsetWidth + 'px' ;
        }
        else {
            this.titlearrow.innerHTML = '&#11164' ;;
            this.content.style.display = 'block' ;
            this.titletext.style.display = 'block' ;
            this.elem.style.width = this.width + 'px' ;
        }
    }

    setTitle(title) {
        this.title = title;
        this.detail.querySelector('summary').innerText = title;
    }
}
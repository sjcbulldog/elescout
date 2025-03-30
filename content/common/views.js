class XeroSelector {
	constructor(title, radio) {
		this.radio_ = radio ;
		let detail = document.createElement('details');
		detail.className = 'zebra-selector-details';

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

			check.name = 'zebra-select';
			check.xerodata = item;
			check.onchange = cb;
			this.items.push(check);
			label.append(check);

			this.list.append(li);
		}
	}
}

class CallbackMgr {
    static verbose = false ;

    constructor() {
        this.callbacks_ = new Map();
        this.registeredReceive = [] ;
    }

    logMessage(type, message, args) {
        if (CallbackMgr.verbose || type === 'error' || type === 'warning') {
            window.scoutingAPI.send('client-log', { type: 'silly', message: message, args: args }) ;
        }
    }

    registerCallback(name, func) {
        this.logMessage('silly', 'CallbackMgr.registerCallback - ' + name) ;

        if (!this.registeredReceive.includes(name)) {
            window.scoutingAPI.receive(name, (args) => { XeroView.callback_mgr_.dispatchCallback(name, args); });
            this.registeredReceive.push(name) ;
        }

        if (!this.callbacks_.has(name)) {
            this.callbacks_.set(name, []);
        }

        if (!this.callbacks_.get(name).includes(func)) {
            this.callbacks_.get(name).push(func);
        }
    }

    unregisterCallback(name, func) {
        this.logMessage('silly', 'CallbackMgr.unregisterCallback - ' + name) ;
        if (this.callbacks_.has(name)) {
            let cblist = this.callbacks_.get(name);
            const index = cblist.indexOf(func);
            if (index > -1) {
                cblist.splice(index, 1);
            }

            if (cblist.length === 0) {
                this.callbacks_.delete(name);
            }
        }
    }

    dispatchCallback(name, arg) {
        this.logMessage('silly', 'CallbackMgr.dispatch - ' + name) ;
        if (this.callbacks_.has(name)) {
            let cblist = this.callbacks_.get(name);
            let count = 1 ;

            for (let cb of cblist) {
                this.logMessage('silly', '    CallbackMgr.dispatch - ' + name + ', which ' + count++) ;
                cb(arg);
            }
        }
    }
}

class XeroView {
    static serial_num_global_ = 0 ;

    static callback_mgr_ = new CallbackMgr();

    constructor(div, viewtype) {
        this.serial_ = XeroView.serial_num_global_++ ;
        this.top_ = div;
        this.viewtype_ = viewtype ;
        this.callbacks_ = [];
    }

    keyToNumber(key) {
        return +this.stripKeyString(key) ;
    }

    stripKeyString(key) {
        let ret = key ;

        if (key.startsWith('frc')) {
            ret = key.substring(3) ;
        }

        return ret ;
    }

    logMessage(type, message, args) {
        window.scoutingAPI.send('client-log', { type: type, message: message, args: args }) ;
    }

    registerCallback(name, func) {
        let cb = {
            name: name,
            func: func
        };
        this.callbacks_.push(cb);
        XeroView.callback_mgr_.registerCallback(name, func);
    }

    close() {
        for (let cbs of this.callbacks_) {
            XeroView.callback_mgr_.unregisterCallback(cbs.name, cbs.func);
        }
    }

    scoutingAPI(request, ...args) {
        if (args.length > 1) {
            window.scoutingAPI.send('client-log', { type: 'warning', message: 'invalid number of arguments to scoutingAPI', args: args }) ;
            return ;
        }
        if (args.length === 0) {
            window.scoutingAPI.send(request) ;
        }
        else {
            window.scoutingAPI.send(request, args[0]) ;
        }
    }

    clear(elem) {
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
    }

    refresh() {
    }

    reset() {
        this.clear(this.top_);
    }

    buildInitialView(text) {
        this.reset();

        this.preview_div_ = document.createElement("div");
        this.preview_div_.innerHTML = "<b>" + text + "</b>";
        this.preview_div_.id = "info";
        this.top_.append(this.preview_div_) ;
    }

    mapMatchType(mtype) {
        let ret= -1 ;

        if (mtype === 'f') {
            ret = 3 ;
        }
        else if (mtype === 'sf') {
            ret = 2 ;
        }
        else {
            ret = 1 ;
        }

        return ret;
    }

    sortCompFunBA(a, b) {
        let ret = 0;

        let atype = this.mapMatchType(a.comp_level);
        let btype = this.mapMatchType(b.comp_level);

        if (atype < btype) {
            ret = -1;
        }
        else if (atype > btype) {
            ret = 1;
        }
        else {
            if (a.match_number < b.match_number) {
                ret = -1;
            }
            else if (a.match_number > b.match_number) {
                ret = 1;
            }
            else {
                if (a.set_number < b.set_number) {
                    ret = -1;
                }
                else if (a.set_number > b.set_number) {
                    ret = 1;
                }
                else {
                    ret = 0;
                }
            }
        }
        return ret;
    }

}

class TabulatorView extends XeroView {
    constructor(div, mtype) {
        super(div, mtype);
    }

    sortCompFun(a, b, aRow, bRow, col, dir, sorterParams) {
        let ret = 0;

        let atype = this.mapMatchType(a);
        let btype = this.mapMatchType(b);

        if (atype < btype) {
            ret = -1;
        }
        else if (atype > btype) {
            ret = 1;
        }
        else {
            let amat = aRow.getData().match_number;
            let bmat = bRow.getData().match_number;
            if (amat < bmat) {
                ret = -1;
            }
            else if (amat > bmat) {
                ret = 1;
            }
            else {
                let aset = aRow.getData().set_number;
                let bset = bRow.getData().set_number;
                if (aset < bset) {
                    ret = -1;
                }
                else if (aset > bset) {
                    ret = 1;
                }
                else {
                    ret = 0;
                }
            }
        }
        return ret;
    }

    getTableColByID(table, id) {
        for (let col of table.getColumns()) {
            if (col.getField() === id) {
                return col;
            }
        }

        return undefined;
    }

    freezingColumn() {
    }

    freezeColumn(e, c) {
        let table = c.getTable();

        this.frozenColumnCount_ = 0;
        for (let col of table.getColumns()) {
            this.frozenColumnCount_++;
            if (col === c) {
                break;
            }
        }
        this.freezingColumn() ;
        this.refresh() ;
    }

    unfreezeColumn(e, c) {
        this.frozenColumnCount_ = -1 ;
        this.refresh() ;
    }

    headerMenu(e, c) {
        var menu = [];
        var columns = this.table_.getColumns();

        for (let column of columns) {

            //create checkbox element using font awesome icons
            let icon = document.createElement("i");
            icon.innerHTML = column.isVisible() ? '&check;' : ' ';

            //build label
            let label = document.createElement("span");
            let title = document.createElement("span");

            title.textContent = " " + column.getDefinition().title;

            label.appendChild(icon);
            label.appendChild(title);

            //create menu item
            menu.push({
                label: label,
                action: function (e) {
                    //prevent menu closing
                    e.stopPropagation();

                    //toggle current column visibility
                    column.toggle();

                    //change menu item icon
                    let f = column.getDefinition().field;
                    if (column.isVisible()) {
                        icon.innerHTML = '&check;'
                    } else {
                        icon.innerHTML = ' ';
                    }
                }
            });
        }

        menu.push({ separator: true });

        menu.push({
            label: 'Freeze',
            action: this.freezeColumn.bind(this)
        });

        menu.push({
            label: 'Unfreeze All',
            action: this.unfreezeColumn.bind(this)
        });
        return menu;
    };
}
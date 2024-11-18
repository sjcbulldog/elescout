class CallbackMgr {
    constructor() {
        this.callbacks_ = new Map();
    }

    registerCallback(name, func) {
        if (!this.callbacks_.has(name)) {
            this.callbacks_.set(name, []);
        }

        if (!this.callbacks_.get(name).includes(func)) {
            this.callbacks_.get(name).push(func);
        }
    }

    unregisterCallback(name, func) {
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
        if (this.callbacks_.has(name)) {
            let cblist = this.callbacks_.get(name);
            for (let cb of cblist) {
                cb(arg);
            }
        }
    }
}

class XeroView {

    static callback_mgr_ = new CallbackMgr();

    constructor(div, viewtype) {
        this.top_ = div;
        this.viewtype_ = viewtype ;
        this.callbacks_ = [];
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

    clear(elem) {
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
    }

    reset() {
        this.clear(this.top_);
    }

    buildInitialView(text) {
        this.reset();

        this.preview_div_ = document.createElement("div");
        this.preview_div_.innerHTML = "<b>" + text + "</b>";
        this.preview_div_.id = "info";
    }

    render() {
        this.top_.append(this.preview_div_) ;
    }
}

class TabulatorView extends XeroView {
    constructor(div, mtype) {
        super(div, mtype);
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

    freezeColumn(e, c) {
        let table = c.getTable();

        this.frozenColumnCount_ = 0;
        for (let col of table.getColumns()) {
            this.frozenColumnCount_++;
            if (col === c) {
                break;
            }
        }
        updateMainWindow(this.viewtype_) ;
    }

    unfreezeColumn(e, c) {
        this.frozenColumnCount_ = -1;
        updateMainWindow(this.viewtype_) ;
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
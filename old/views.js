class XeroView {
    constructor(div, viewtype) {
        this.serial_ = XeroView.serial_num_global_++ ;
        this.top_ = div;
        this.viewtype_ = viewtype ;
        this.callbacks_ = [];
    }

    getAbsPosition(element) {
        let offset = {
            x: 0,
            y: 0,
        }
        while (element) {
            offset.x += element.offsetLeft;
            offset.y += element.offsetTop;
            element = element.offsetParent;
        }
        return offset ;
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
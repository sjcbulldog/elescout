function sortCompFun(a, b, aRow, bRow, col, dir, sorterParams) {
    let ret = 0 ;

    let atype = mapMatchType(a) ;
    let btype = mapMatchType(b) ;

    if (atype < btype) {
        ret = -1 ;
    }
    else if (atype > btype) {
        ret = 1 ;
    }
    else {
        let amat = aRow.getData().match_number ;
        let bmat = bRow.getData().match_number ;
        if (amat < bmat) {
            ret = -1 ;
        }
        else if (amat > bmat) {
            ret = 1 ;
        }
        else {
            let aset = aRow.getData().set_number ;
            let bset = bRow.getData().set_number ;
            if (aset < bset) {
                ret = -1 ;
            }
            else if (aset > bset) {
                ret = 1 ;
            }
            else {
                ret = 0 ;
            }
        }
    }
    return ret ;
}

function getTableColByID(table, id) {
    for(let col of table.getColumns()) {
        if (col.getField() === id) {
            return col ;
        }
    }

    return undefined ;
}

function headerMenu() {
    var menu = [];
    var columns = this.getColumns();

    for(let column of columns){

        //create checkbox element using font awesome icons
        let icon = document.createElement("i");
        icon.innerHTML = column.isVisible() ? '&check;' : ' ' ;

        //build label
        let label = document.createElement("span");
        let title = document.createElement("span");

        title.textContent = " " + column.getDefinition().title;

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
            label:label,
            action:function(e){
                //prevent menu closing
                e.stopPropagation();

                //toggle current column visibility
                column.toggle();

                //change menu item icon
                let f = column.getDefinition().field ;
                if(column.isVisible()){
                    icon.innerHTML = '&check;'
                }else{
                    icon.innerHTML = ' ' ;
                }
            }
        });
    }

   return menu;
};

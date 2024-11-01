const bwgTableUpArrow = "&#9206;"
const bwgTableDownArrow = "&#9207;"

function bwgTableRemoveDecorations(obj) {
    for(let i = 0 ; i < obj.columnheaders.length ; i++) {
        if (obj.columndecorators[i]) {
            obj.columnheaders[i].innerText = obj.columnlables[i] ;
            obj.columndecorators[i] = undefined ;
        }
    }
}

function bwgTableAddDecorations(obj, colno, decor) {
    let html = obj.columnlables[colno] + decor ;
    obj.columnheaders[colno].innerHTML = html ;
    obj.columndecorators[colno] = decor ;
}

function bwgTableChangeSort(obj, event) {

    let colno = event.currentTarget.columnNum ;

    if (obj.columndecorators[colno - 1] && obj.columndecorators[colno - 1] === bwgTableUpArrow) {   
        colno = -colno ;
    }

    bwgTableSetSortOrder(obj, colno) ;
}

function bwgTableCreateHeaderRow(obj) {

    obj.header = document.createElement("tr") ;
    obj.header.className = "bwgtable_header" ;
    obj.columnheaders = [] ;
    obj.columndecorators = [] ;

    let colno = 1 ;
    for(let hdr of obj.columnlables) {
        let colhdr = document.createElement("th") ;
        colhdr.columnNum = colno++ ;
        colhdr.onclick = (event) => { bwgTableChangeSort(obj, event) ; } ;
        colhdr.innerText = hdr ;
        obj.columnheaders.push(colhdr) ;
        obj.columndecorators.push(undefined) ;
        obj.header.append(colhdr) ;
    }
    obj.table.append(obj.header) ;    
}

function bwgTableGetTableElem(obj) {
    return obj.top ;
}

function bwgTableCreate(columns, idname) {
    let obj = {} ;

    obj.columnlables = columns ;
    obj.sortcol = undefined ;
    obj.sortdir = undefined ;

    obj.top = document.createElement("div") ;
    obj.top.id = idname ;

    obj.table = document.createElement("table") ;
    obj.table.className = "bwgtable_table" ;
    obj.top.append(obj.table);

    bwgTableCreateHeaderRow(obj, columns) ;

    obj.rows = [] ;
    obj.table.append(obj.header) ;

    return obj ;
}

function bwgTableAddRow(obj, data) {
    if (data.length !== obj.columnheaders.length) {
        return ;
    }

    let tr = document.createElement("tr");
    obj.rows.push(tr) ;

    for(let delem of data) {
        let td = document.createElement("td") ;
        td.innerText = delem ;
        tr.append(td) ;
    }
    obj.table.append(tr) ;

    return tr ;
}

function bwgTableClear(obj) {
    while (obj.table.firstChild) {
        obj.table.removeChild(obj.table.firstChild) ;
    }
    bwgTableCreateHeaderRow(obj) ;
}

function bwgTableCompareFun(obj, a, b) {
    let ret = 0 ;
    let index = Math.abs(obj.sortOrder) - 1 ;

    let astr = a.cells[index].innerText ;
    let bstr = b.cells[index].innerText ;

    if (obj.sortOrder < 0) {
        ret = bstr.localeCompare(astr) ;
    } else {
        ret = astr.localeCompare(bstr) ;
    }

    return ret ;
}

function bwgTableSortInternal(obj) {
    obj.rows.sort((a, b) => { 
        return bwgTableCompareFun(obj, a, b) ;
    }) ;
}

function bwgTableSort(obj) {
    if (!obj.sortOrder) {
        return ;
    }

    // Remove all elements from thne table
    bwgTableClear(obj) ;

    // Sort the elements in the rows
    bwgTableSortInternal(obj) ;

    // Put the elements all back
    for(let row of obj.rows) {
        obj.table.append(row) ;
    }
}

function bwgTableSetSortOrder(obj, order) {

    if (obj.sortOrder !== order) {    
        obj.sortOrder = order ;

        bwgTableRemoveDecorations(obj) ;
        let decor = undefined ;
        let colno = undefined ;

        if (obj.sortOrder < 0) {
            decor = bwgTableDownArrow ;
            colno = -obj.sortOrder ;
        }
        else {
            decor = bwgTableUpArrow ;
            colno = obj.sortOrder ;
        }
        colno-- ;

        bwgTableSort(obj) ;
        bwgTableAddDecorations(obj, colno, decor) ;
    }
}

const bwgTableUpArrow = "&#9206;"
const bwgTableDownArrow = "&#9207;"

function bwgTableCreate(columns, prefix) {
    let obj = {
        createHeaderRow() {
            this.header = document.createElement("tr") ;
            this.header.className = this.classPrefix + "-header-row" ;
            this.columnheaders = [] ;
            this.columndecorators = [] ;
        
            let colno = 1 ;
            for(let hdr of this.columnlables) {
                let colhdr = document.createElement("th") ;
                this.table.append(colhdr) ;
                colhdr.columnNum = colno++ ;
                colhdr.onclick = (event) => { this.changeSort(event) ; } ;
                colhdr.innerText = hdr ;
                this.columnheaders.push(colhdr) ;
                this.columndecorators.push(undefined) ;
                this.header.append(colhdr) ;
            }
            this.table.append(this.header) ;    
        },
        clear() {
            while (this.table.firstChild) {
                this.table.removeChild(this.table.firstChild) ;
            }
            this.createHeaderRow() ;
        },
        addRow(data) {
            if (!data || data.length !== this.columnheaders.length) {
                return ;
            }
        
            let tr = document.createElement("tr");
            this.rows.push(tr) ;
        
            for(let delem of data) {
                let td = document.createElement("td") ;
                td.innerText = delem ;
                td.className = this.classPrefix + "-cell" ;
                tr.append(td) ;
            }
            return tr ;
        },
        setSortOrder(order) {
            if (obj.sortOrder !== order) {    
                obj.sortOrder = order ;
        
                this.removeDecorations() ;
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
        
                this.sort() ;
                this.addDecorations(colno, decor) ;
            }
        },
        sort() {
            if (!this.sortOrder) {
                return ;
            }
        
            // Remove all elements from thne table
            this.clear() ;
        
            // Sort the elements in the rows
            this.sortInternal() ;
        
            // Put the elements all back
            this.refresh() ;
        },

        refresh() {
            let rownum = 0 ;
        
            for(let row of obj.rows) {
                if ((rownum % 2) == 0) {
                    row.className = this.classPrefix + '-row-even' ;
                    row.id = row.className ;
                }
                else {
                    row.className = this.classPrefix + '-row-odd' ;
                    row.id = row.className ;
                }
                this.table.append(row) ;
                rownum++ ;
            }
        },
        sortInternal(obj) {
            this.rows.sort((a, b) => { 
                return this.compareFun(a, b) ;
            }) ;
        },
        compareFun(a, b) {
            let ret = 0 ;
            let index = Math.abs(this.sortOrder) - 1 ;

            let astr = a.cells[index].innerText ;
            let bstr = b.cells[index].innerText ;

            if (this.sortOrder < 0) {
                ret = bstr.localeCompare(astr) ;
            } else {
                ret = astr.localeCompare(bstr) ;
            }

            return ret ;
        },
        changeSort(event) {

            let colno = event.currentTarget.columnNum ;
        
            if (this.columndecorators[colno - 1] && this.columndecorators[colno - 1] === bwgTableUpArrow) {   
                colno = -colno ;
            }
        
            this.setSortOrder(colno) ;
        },
        removeDecorations() {
            for(let i = 0 ; i < this.columnheaders.length ; i++) {
                if (this.columndecorators[i]) {
                    this.columnheaders[i].innerText = this.columnlables[i] ;
                    this.columndecorators[i] = undefined ;
                }
            }
        },
        addDecorations(colno, decor) {
            let html = this.columnlables[colno] + decor ;
            this.columnheaders[colno].innerHTML = html ;
            this.columndecorators[colno] = decor ;
        }
    }

    obj.classPrefix = prefix ;
    obj.columnlables = columns;

    obj.top = document.createElement("div");
    obj.top.className = prefix + '-top-div' ;

    obj.table = document.createElement("table") ;
    obj.table.className = prefix + '-table' ;
    obj.top.append(obj.table) ;

    obj.rows = [] ;
    obj.createHeaderRow() ;
    return obj ;
}



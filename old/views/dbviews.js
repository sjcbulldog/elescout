//
// View on one of the databases either the team or the match
// database.
//
class DBView extends TabulatorView {

    //  
    // Arguments:
    //  div - the parent HTML Element for the table
    //  viewtype - the name of the view being displayed (e.g. teamdb or matchdb)
    //  type - the type of the data (e.g. team or match)
    //
    constructor(div, viewtype, type) {
        super(div, viewtype);
        this.type_ = type;
        this.xyzzy = 42 ;

        this.registerCallback('send-' + type + '-db', this.formCallback.bind(this));
        this.registerCallback('send-' + type + '-col-config', this.colConfig.bind(this));
        this.refresh() ;
    }

    refresh() {
        this.buildInitialView('Retreiving data for the ' + this.type_ + ' database view, please wait ...');
        this.scoutingAPI('get-' + this.type_ + '-db');     
    }

    hideHiddenColumns() {
        if (this.colcfg_) {
            let colobjs = this.table_.getColumns() ;
            let index = 0 ;
            for(let col of this.table_.getColumns()) {
                let cfg = this.colcfg_[index++];
                if (cfg && cfg.hidden) {
                    col.hide() ;
                }
            }
        }
    }

    
	convertDataRecord(data) {
		let ret = {} ;
		for (let key of Object.keys(data)) {
            ret[key] = data[key].value_ ;
        }
		return ret ;
	}

	convertDataSet(dataset) {
		let ret = [] ;
		for (let one of dataset) {
			let obj = this.convertDataRecord(one) ;
			ret.push(obj) ;
		}
		return ret ;
	}

    //
    // Called when the data for the table shows up.
    //
    // Arguments:
    //  args - the columns and data to display (args.cols and args.data)
    //
    formCallback(args) {
        let cols, data;

        if (args) {
            cols = args[0].cols ;
            data = [] ;
            for(let one of args[0].data) {
                let record = {} ;
                for(let col of cols) {
                    record[col] = one.data_.get(col) ;
                }
                data.push(record) ;
            }
        }
        else {
            cols = [] ;
            data = [];
        }

        this.table_div_ = document.createElement('div');
        this.table_div_.id = 'tablediv';

        this.table_ = new Tabulator(this.table_div_, 
            {
                data:this.convertDataSet(data),
                layout:"fitData",
                resizableColumnFit:true,
                columns: this.generateColDesc(cols),
                movableColumns: true,
                initialSort: this.getInitialSort(),
                popupContainer: '#rightcontent'
            });

        this.table_.on('tableBuilt', this.hideHiddenColumns.bind(this)) ;
        this.reset();
        this.top_.append(this.table_div_) ;
    }

    colConfig(args) {
        if (args && args[0]) {
            this.colcfg_ = args[0].columns ;
            this.frozenColumnCount_ = args[0].frozenColumnCount ;
        }
        else {
            this.colcfg_ = undefined ;
            this.frozenColumnCount_ = 0 ;
        }
    }

    findColCfg(name) {
        if (this.colcfg_) {
            for(let one of this.colcfg_) {
                if (one && one.name === name) {
                    return one ;
                }
            }
        }

        return undefined ;
    }

    findColumnIndexInConfig(name) {
        let index = 0 ;
        for(let col of this.colcfg_) {
            if (col.name === name) {
                return index ;
            }
            index++ ;
        }

        return -1 ;
    }

    colOrderSortFunc(a, b) {
        let ai = this.findColumnIndexInConfig(a.field) ;
        let bi = this.findColumnIndexInConfig(b.field) ;

        if (ai < bi) {
            return -1 ;
        }
        else if (ai > bi) {
            return 1;
        }

        return 0 ;
    }    
}

class TeamDBView extends DBView {
    constructor(div, mtype) {
        super(div, mtype, 'team') ;
    }

    close() {
        super.close() ;
        this.sendConfigData() ;
    }

    freezingColumn() {
        this.sendConfigData() ;
    }

    sendConfigData() {
        let coldata = [] ;

        //
        // Gather column configuration information into ana array
        //
        for(let col of this.table_.getColumns()) {
            let info = {
                name: col.getField(),
                hidden: !col.isVisible(),
                width: col.getWidth(),
            }
            coldata.push(info) ;
        }

        //
        // This object will contain the number of frozen columns and configuration
        // for each of the columns. 
        //
        let colcfg = {
            columns: coldata,
            frozenColumnCount: this.frozenColumnCount_,
        } ;
    
        //
        // Send the column configuration information to the main process side of the
        // application to be stored for when the project is reloaded
        //
        this.scoutingAPI('send-team-col-config', colcfg) ;
    }

    getInitialSort() {
        return [
            {column:"team_number", dir:"asc"}, //then sort by this second
        ]
    }

    //
    // Generate column descriptions based on the configuration information
    //
    generateColDesc(coldata) {
        let cols = [];
        for(let col of coldata) {
            let one = this.findColCfg(col) ;
            let coldesc = {
                field: col,
                title: col,
                sorter: (col === 'team_number' ? 'number' : 'alphanum'),
                headerMenu: this.headerMenu.bind(this),
                headerVertical: false,
            } ;

            if (one && one.width && one.width != -1) {
                coldesc.width = one.width ;
            }
    
            cols.push(coldesc) ;
        }

        if (this.colcfg_) {
            cols.sort(this.colOrderSortFunc.bind(this)) ;
        }

        for(let i = 0 ; i < this.frozenColumnCount_ ; i++) {
            if (i < cols.length) {
                cols[i].frozen = true ;
            }
        }

        return cols ;
    }
}

class MatchDBView extends DBView {
    constructor(div, mtype) {
        super(div, mtype, 'match') ;
    }

    freezingColumn() {
        this.sendConfigData() ;
    }    

    close() {
        super.close() ;
        let coldata = [] ;
        for(let col of this.table_.getColumns()) {
            let info = {
                name: col.getField(),
                hidden: !col.isVisible(),
                width: col.getWidth(),
            }
            coldata.push(info) ;
        }
    
        let colcfg = {
            columns: coldata,
            frozenColumnCount: this.frozenColumnCount_
        } ;
    
        this.scoutingAPI('send-match-col-config', colcfg) ;
    }

    getInitialSort() {
        return [
            {column:"comp_level", dir:"asc"}, //then sort by this second
        ]
    }


    sendConfigData() {
        let coldata = [] ;

        //
        // Gather column configuration information into ana array
        //
        for(let col of this.table_.getColumns()) {
            let info = {
                name: col.getField(),
                hidden: !col.isVisible(),
                width: col.getWidth(),
            }
            coldata.push(info) ;
        }

        //
        // This object will contain the number of frozen columns and configuration
        // for each of the columns. 
        //
        let colcfg = {
            columns: coldata,
            frozenColumnCount: this.frozenColumnCount_,
        } ;
    
        //
        // Send the column configuration information to the main process side of the
        // application to be stored for when the project is reloaded
        //
        this.scoutingAPI('send-match-col-config', colcfg) ;
    }    

    generateColDesc(coldata) {
        let count = this.frozenColumnCount_ ;

        let cols = [] ;
        for(let col of coldata) {
            let one = this.findColCfg(col) ;
            let coldesc = {
                field: col,
                title: col,
                headerMenu: this.headerMenu.bind(this),
                headerVertical: false,
            } ;
    
            if (col === 'comp_level') {
                coldesc.sorter = this.sortCompFun.bind(this);
            }

            if (one && one.hidden) {
                coldesc['hidden'] = one.hidden ;
            }
    
            if (one && one.width && one.width != -1) {
                coldesc['width'] = one.width ;
            }
            
            cols.push(coldesc) ;
        }       

        if (this.colcfg_) {
            cols.sort(this.colOrderSortFunc.bind(this)) ;
        }

        for(let i = 0 ; i < this.frozenColumnCount_ ; i++) {
            if (i < cols.length) {
                cols[i].frozen = true ;
            }
        }
        return cols ; 
    }

}
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

        this.buildInitialView('Retreiving data for the ' + type + ' database view, please wait ...');
        this.registerCallback('send-' + type + '-db', this.formCallback.bind(this));
        this.registerCallback('send-' + type + '-col-config', this.colConfig.bind(this));
        window.scoutingAPI.send('get-' + type + '-db');        

        this.frozenColumnCount_ = -1 ;
    }

    hideHiddenColumns() {
        if (this.colcfg_) {
            let colobjs = this.table_.getColumns() ;
            let index = 0 ;
            for(let col of this.table_.getColumns()) {
                let cfg = this.colcfg_[index++];
                if (cfg.hidden) {
                    col.hide() ;
                }
            }
        }
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
            data = args[0].data ;
        }
        else {
            cols = [] ;
            data = [];
        }

        this.table_div_ = document.createElement('div');
        this.table_div_.id = 'tablediv';

        this.table_ = new Tabulator(this.table_div_, 
            {
                data:data,
                layout:"fitDataStretch",
                resizableColumnFit:true,
                columns: this.generateColDesc(cols),
                movableColumns: true,
                initialSort: this.getInitialSort(),
            });

        this.table_.on('tableBuilt', this.hideHiddenColumns.bind(this)) ;
        this.reset();
        this.top_.append(this.table_div_) ;
    }

    colConfig(args) {
        if (args && args[0]) {
            this.colcfg_ = args[0].columns ;
            this.frozenColumnCount_ = this.colcfg_.frozenColumnCount ;
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
        window.scoutingAPI.send('send-team-col-config', colcfg) ;
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
        let count = this.frozenColumnCount_ ;
        
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

            if (one && one.width) {
                coldesc.width = one.width ;
            }
    
            cols.push(coldesc) ;
        }

        if (this.colcfg_) {
            cols.sort(this.colOrderSortFunc.bind(this)) ;
        }

        for(let i = 0 ; i < this.frozenColumnCount_ ; i++) {
            if (i < cols.length) {
                coldesc[i].frozen = true ;
            }
        }

        return cols ;
    }
}

class MatchDBView extends DBView {
    constructor(div, mtype) {
        super(div, mtype, 'match') ;
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
    
        window.scoutingAPI.send('send-match-col-config', colcfg) ;
    }

    getInitialSort() {
        return [
            {column:"comp_level", dir:"asc"}, //then sort by this second
        ]
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
    
            if (one && one.width) {
                coldesc['width'] = one.width ;
            }
            
            cols.push(coldesc) ;
        }       

        if (this.colcfg_) {
            cols.sort(this.colOrderSortFunc.bind(this)) ;
        }

        for(let i = 0 ; i < this.frozenColumnCount_ ; i++) {
            if (i < cols.length) {
                coldesc[i].frozen = true ;
            }
        }
        return cols ; 
    }
}

window.scoutingAPI.receive("send-match-db", (args) => { XeroView.callback_mgr_.dispatchCallback('send-match-db', args); });
window.scoutingAPI.receive("send-match-col-config", (args) => { XeroView.callback_mgr_.dispatchCallback('send-match-col-config', args); });
window.scoutingAPI.receive("send-team-col-config", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-col-config', args); });
window.scoutingAPI.receive("send-team-db", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-db', args); });

class PickListView extends TabulatorView {
    static instnum = 0 ;

    static RankFieldName = 'rank' ;
    static TeamNumberFieldName = 'teamnumber' ;
    static NickNameFieldName = 'nickname' ;
    static PickNotesFieldName = 'picknotes' ;

    static DefaultFields = [
        { field: this.RankFieldName, title: 'Rank' },
        { field: this.NickNameFieldName, title: 'Name' },
        { field: this.TeamNumberFieldName, title: 'Number' },
        { field: this.PickNotesFieldName, title: 'Notes' }
    ];

    constructor(div,viewtype) {
        super(div, viewtype);

        this.instance_ = PickListView.instnum++ ;
        this.cols_ = [] ;
        this.team_fields_ = [] ;
        this.match_fields_ = [] ;

        this.createInitialWindow() ;

        this.registerCallback('send-picklist-list', this.receivePicklistList.bind(this)) ;
        this.registerCallback('send-picklist-data', this.receivePicklistData.bind(this));
        this.registerCallback('send-picklist-columns', this.receivePicklistColumns.bind(this));
        this.registerCallback('send-picklist-col-data', this.receivePicklistColData.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));

        this.scoutingAPI('get-picklist-list') ;
        this.scoutingAPI('get-team-field-list');
        this.scoutingAPI('get-match-field-list');
    }

    close() {
        super.close() ;
    }

    createInitialWindow() {
        this.picklist_top_ = document.createElement('div') ;

        //
        // Top level picklist info panel
        //
        this.picklist_info_ = document.createElement('div') ;
        this.picklist_info_.className = 'picklist-info' ;
        this.picklist_top_.append(this.picklist_info_) ;

        //
        // A selector to select any existing picklist with a label
        //
        this.picklist_info_existing_ = document.createElement('select');
        this.picklist_info_existing_.className = 'picklist-info-existing' ;
        this.picklist_info_existing_.onchange = this.selectedPicklistChanged.bind(this);
        const opt = document.createElement('option') ;
        opt.value = '' ;
        opt.text = 'NONE' ;
        this.picklist_info_existing_.append(opt) ;

        this.picklist_info_label_ = document.createElement('label') ;
        this.picklist_info_label_.className = 'picklist-info-label' ;
        this.picklist_info_label_.textContent = 'Available Picklists:'
        this.picklist_info_.append(this.picklist_info_label_) ;
        this.picklist_info_label_.append(this.picklist_info_existing_) ;

        //
        // A button to delete a selected picklist
        //
        this.picklist_info_delete_ = document.createElement('button') ;
        this.picklist_info_delete_.className = 'picklist-info-button' ;
        this.picklist_info_delete_.textContent = 'Delete' ;
        this.picklist_info_delete_.onclick = this.deletePicklist.bind(this) ;
        this.picklist_info_.append(this.picklist_info_delete_) ;

        //
        // An input text field to name a new picklist
        //
        this.picklist_info_text_ = document.createElement('input') ;
        this.picklist_info_text_.className = 'picklist-info-text' ;
        this.picklist_info_text_.setAttribute('type', 'text') ;

        this.picklist_info_label2_ = document.createElement('label') ;
        this.picklist_info_label2_.className = 'picklist-info-label2' ;
        this.picklist_info_label2_.textContent = 'New Picklist Name:'
        this.picklist_info_.append(this.picklist_info_label2_) ;
        this.picklist_info_label2_.append(this.picklist_info_text_) ;

        //
        // A button to create a new picklist
        //
        this.picklist_info_create_ = document.createElement('button') ;
        this.picklist_info_create_.className = 'picklist-info-button' ;
        this.picklist_info_create_.textContent = 'Create' ;
        this.picklist_info_create_.onclick = this.createPicklist.bind(this) ;
        this.picklist_info_.append(this.picklist_info_create_) ;

        this.table_top_ = document.createElement('div') ;
        this.picklist_top_.append(this.table_top_) ;

        this.reset() ;
        this.top_.append(this.picklist_top_) ;
    }

    selectedPicklistChanged() {
        this.updateTeamData() ;
        this.scoutingAPI('get-picklist-data', this.picklist_info_existing_.value) ;
        this.scoutingAPI('get-picklist-columns', this.picklist_info_existing_.value) ;
    }

    createPicklist() {
        this.updateTeamData() ;

        let name = this.picklist_info_text_.value ;
        this.scoutingAPI('create-new-picklist', name) ;
    }

    deletePicklist() {
        let name = this.picklist_info_existing_.value ;
        this.clear(this.table_top_) ;
        this.scoutingAPI('delete-picklist', name) ;
    }

    populatePicklistNames(names) {
        this.clear(this.picklist_info_existing_) ;

        if (names && names.length > 0) {
            this.picklist_info_existing_.disabled = false ;
            for(let choice of names) {
                const opt = document.createElement('option');    
                opt.value = choice ;
                opt.text = choice ;
                this.picklist_info_existing_.append(opt) ;
            }
        }
        else {
            const opt = document.createElement('option');    
            opt.value = '' ;
            opt.text = 'No Picklist Defined' ;
            opt.disabled = true ;
            this.picklist_info_existing_.append(opt) ;
            this.picklist_info_existing_.disabled = true;
        }
    }

    receivePicklistList(arg) {
        this.populatePicklistNames(arg[0].list) ;
        if (arg[0].default) {
            this.picklist_info_existing_.value = arg[0].default ;
            this.scoutingAPI('get-picklist-data', this.picklist_info_existing_.value) ;
            this.scoutingAPI('get-picklist-columns', this.picklist_info_existing_.value) ;
        }
    }

    receivePicklistData(arg) {
        let obj = arg[0] ;

        this.clear(this.table_top_) ;
        if (this.columns_picklist_name_ !== obj.name) {
            //
            // If the stored columns are from a different picklist, they the columns
            // will arrive later.  We get rid of the columns that are there because they
            // are not valid.  If the columns that are stored are from the same picklist,
            // the columns arrived first and were stored away waiting on the actual picklist
            // data.
            //
            this.cols_ = [] ;
        }

        this.picklist_name_ = obj.name ;
        this.picklist_info_existing_.value = obj.name ;

        this.table_div_ = document.createElement('div');
        this.table_div_.id = 'tablediv';

        this.table_ = new Tabulator(this.table_div_, 
            {
                data:obj.data,
                layout:"fitData",
                resizableColumnFit:true,
                columns: this.generateColDesc(),
                movableColumns: true,
                movableRows: true,
            });

        this.scoutingAPI('client-log', { type: 'debug', message: 'created table in client software - instance serial ' + this.instance_ }) ;
    
        this.table_.on("rowMoved", this.teamMoved.bind(this));
        this.table_.on("columnMoved", this.colMoved.bind(this)) ;
        this.table_.on("columnResized", this.sendColumnConfiguration.bind(this)) ;
        this.table_top_.append(this.table_div_) ;
    }

    setValue(field, team, value) {
        let fieldcolobj = this.getColumnFromId(field) ;
        let teamnumobj = this.getColumnFromId(PickListView.TeamNumberFieldName) ;
        for(let row of this.table_.getRows()) {
            let rdata = row.getCell(teamnumobj) ;
            if (rdata.getValue() === team) {
                //
                // We have the right row, now lets find the right column
                //
                let cell = row.getCell(fieldcolobj) ;
                cell.setValue(value) ;
            }
        }
    }

    isNumeric(data) {
        if (typeof data === 'number')
            return true ;

        if (typeof str !== 'string')
            return false;

        return !isNaN(parseFloat(data)) ;
      }

    receivePicklistColData(args) {
        let dobj = args[0];

        let num = true ;
        for(let i = 0 ; i < dobj.teams.length ; i++) {
            if (dobj.data[i] != null && !this.isNumeric(dobj.data[i])) {
                num = false ;
                break ;
            }
        }        

        if (num) {
            for(let i = 0 ; i < dobj.teams.length ; i++) {
                let team = dobj.teams[i] ;
                let value ;
                if (dobj.data[i] === null) {
                    value = 'N/A' ;
                } else {
                    value = dobj.data[i].toFixed(3) ;
                }
                this.setValue(dobj.field, team, value) ;
            }
        }
        else {
            for(let i = 0 ; i < dobj.teams.length ; i++) {
                let team = dobj.teams[i] ;
                let value = dobj.data[i] ;
                this.setValue(dobj.field, team, value) ;
            }            
        }
    }

    setColumnWidth(name, width) {
        for(let col of this.table_.getColumns()) {
            if (col.getField() === name) {
                col.setWidth(width) ;
            }
        }
    }

    receivePicklistColumns(args) {
        let store = [...this.cols_] ;
        for(let col of store) {
            this.removeColumn(col.name) ;
        }

        let obj = args[0] ;
        this.columns_picklist_name_ = obj.name ;

        for(let col of obj.columns) {
            if (this.isIgnoredField(col.name)) {
                this.setColumnWidth(col.name, col.width) ;
            }
            else {
                this.addPickListCol(col) ;
            }
        }
    }

    receiveTeamFieldList(args) {
        this.team_fields_ = args[0] ;
    }

    receiveMatchFieldList(args) {
        this.match_fields_ = args[0] ;
    }

    colMoved() {
        this.cols_ = [] ;
        for(let col of this.table_.getColumns()) {
            let one = {
                name: col.getField(),
                width: col.getWidth(),
            }
            this.cols_.push(one);
        }

        this.scoutingAPI('update-picklist-columns', this.cols_) ;
    }

    getTeamNumberFromRank(rank) {
        for(let row of this.table_.getRows()) {
            let cell = row.getCell(RankFieldName) ;
            if (cell.getData().rank === rank) {
                return cell.getData().teamnumber ;
            }
        }

        return -1 ;
    }

    updateTeamData() {
        if (!this.table_) {
            return ;
        }

        let teams = [] ;

        //
        // Now, the teams may not be sorted by rank order
        //
        for(let i = 1 ; i <= this.table_.getRows().length ; i++) {
            let team = this.getTeamNumberFromRank(i) ;
            teams.push(team) ;
        }

        let obj = {
            name: this.picklist_name_,
            teams: teams
        }

        this.scoutingAPI('update-picklist-data', obj) ;
    }

    teamMoved() {
        let rank = 1 ;
        for(let row of this.table_.getRows()) {
            let cell = row.getCell(RankFieldName) ;
            cell.setValue(rank++, false) ;
        }

        this.updateTeamData() ;
    }

    getColumnFromId(id) {
        for(let col of this.table_.getColumns()) {
            let fid = col.getField() ;
            if (fid === id) {
                return col ;
            }
        }

        return undefined ;
    }

    sortColumn(aval, bval) {
        let ret = 0 ;

        let a = parseInt(aval) ;
        if (a === NaN) {
            a = aval ;
        }

        let b = parseInt(bval) ;
        if (b === NaN) {
            b = bval ;
        }

        if (typeof a === 'number' && typeof b === 'number') {
            ret = b - a ;
        }
        else if (typeof a === 'number') {
            ret = 1 ;
        }
        else if (typeof b === 'number') {
            ret = -1 ;
        }
        else {
            ret = a.localeCompare(b) ;
        }

        return ret ;
    }

    isIgnoredField(name) {
        for(let deffield of PickListView.DefaultFields) {
            if (deffield.field === name)
                return true ;
        }

        return false ;
    }

    sendColumnConfiguration() {
        let coldescs = [] ;
        for(let col of this.table_.getColumns()) {
            let coldesc = {
                name: col.getField(),
                width: col.getWidth()
            }
            coldescs.push(coldesc) ;
        }

        let coldata = {
            name: this.picklist_name_,
            cols: coldescs
        }
        this.scoutingAPI('update-picklist-columns', coldata) ;
    }

    addPickListCol(desc) {
        if (typeof desc === 'string') {
            desc = {
                name: desc,
                width: 64,
            }
        }

        this.cols_.push(desc) ;
        this.table_.addColumn({
            field: desc.name,
            title: desc.name,
            width: desc.width ? desc.width : 32,
            sorter: this.sortColumn.bind(this)
        });
        this.scoutingAPI('get-picklist-col-data', desc.name) ;
    }

    findColumnIndexByName(name) {
        for(let i = 0 ; i < this.cols_.length ; i++) {
            if (this.cols_[i].name === name) {
                return i ;
            }
        }

        return -1 ;
    }

    findColumnByName(name) {
        for(let col of this.cols_) {
            if (col.name === name) {
                return col ;
            }
        }
        return undefined ;
    }

    removeColumn(field) {
        let index = this.findColumnIndexByName(field) ;
        this.cols_.splice(index, 1) ;
        let col = this.getColumnFromId(field) ;
        col.delete() ;
    }

    selectPicklistMenu(field) {
        if (this.findColumnIndexByName(field) !== -1) {
            this.removeColumn(field) ;
        }
        else {
            let desc = {
                name: field,
                width: 64
            }
            this.addPickListCol(desc) ;
        }
        this.sendColumnConfiguration();
    }

    picklistMenu() {
        var menu = [];
        var columns = this.table_.getColumns();

        for (let field of [...this.team_fields_, ...this.match_fields_]) {
            //create checkbox element using font awesome icons
            let icon = document.createElement("i");
            icon.innerHTML = (this.findColumnIndexByName(field) !== -1) ? '&check;' : ' ';

            //build label
            let label = document.createElement("span");
            let title = document.createElement("span");

            title.textContent = " " + field;

            label.appendChild(icon);
            label.appendChild(title);
            label.xerocol = field ;

            //create menu item
            menu.push({
                label: label,
                action: this.selectPicklistMenu.bind(this, field),
            });
        }

        return menu;        
    }

    generateColDesc() {
        let cols = [] ;

        for(let field of PickListView.DefaultFields) {           
            let desc = {
                field: field.field,
                title: field.title,
                headerMenu: this.picklistMenu.bind(this),
            }
            let coldesc = this.findColumnByName(field.field) ;
            if (coldesc && coldesc.width) {
                desc['width'] = coldesc.width ;
            }
            cols.push(desc) ;
        }
        return cols;
    }
}


class PickListView extends TabulatorView {
    static instnum = 0 ;

    static RankFieldName = 'rank' ;
    static TeamNumberFieldName = 'teamnumber' ;
    static NickNameFieldName = 'nickname' ;
    static PickNotesFieldName = 'picknotes' ;

    static DefaultFields = [
        { field: PickListView.RankFieldName, title: 'Pick Order' },
        { field: PickListView.NickNameFieldName, title: 'Name' },
        { field: PickListView.TeamNumberFieldName, title: 'Number' },
        { field: PickListView.PickNotesFieldName, title: 'Notes' }
    ];

    constructor(div,viewtype) {
        super(div, viewtype);

        this.current_picklist_ = undefined ;
        this.instance_ = PickListView.instnum++ ;
        this.cols_ = [] ;
        this.team_fields_ = [] ;
        this.match_fields_ = [] ;

        this.team_fields_loaded_ = false ;
        this.match_fields_loaded_ = false ;

        this.picklist_name_ = '' ;
        this.change_ranking_ = true ;

        this.createInitialWindow() ;

        this.registerCallback('send-datasets', this.receiveDataSets.bind(this));
        this.registerCallback('send-picklist-list', this.receivePicklistList.bind(this)) ;
        this.registerCallback('send-picklist-data', this.receivePicklistData.bind(this));
        this.registerCallback('send-picklist-columns', this.receivePicklistColumns.bind(this));
        this.registerCallback('send-picklist-col-data', this.receivePicklistColData.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));
        this.registerCallback('send-formulas', this.receiveFormulas.bind(this)) ;
        this.registerCallback('send-picklist-notes', this.receiveNotes.bind(this)) ;

        this.scoutingAPI('get-datasets') ;
        this.scoutingAPI('get-team-field-list');
        this.scoutingAPI('get-match-field-list');
        this.scoutingAPI('get-formulas') ;
    }

    close() {
        super.close() ;
    }

    createSelect(parent) {
        this.picklist_select_div_ = document.createElement('div') ;
        this.picklist_select_div_.className = 'picklist-select' ;
        parent.append(this.picklist_select_div_) ;

        this.picklist_select_label_ = document.createElement('label') ;
        this.picklist_select_label_.className = 'picklist-label' ;
        this.picklist_select_label_.textContent = 'Select Picklists:'
        this.picklist_select_div_.append(this.picklist_select_label_) ;

        this.picklist_select_ = document.createElement('select');
        this.picklist_select_.className = 'picklist-select' ;
        this.picklist_select_.onchange = this.selectedPicklistChanged.bind(this);
        const opt = document.createElement('option') ;
        opt.value = '' ;
        opt.text = 'NONE' ;
        this.picklist_select_.append(opt) ;

        this.picklist_select_label_.append(this.picklist_select_) ;
    }

    createDelete(parent) {
        this.picklist_delete_div_ = document.createElement('div') ;
        this.picklist_delete_div_.className = 'picklist-delete' ;
        parent.append(this.picklist_delete_div_) ;

        this.picklist_del_select_label_ = document.createElement('label') ;
        this.picklist_del_select_label_.className = 'picklist-label' ;
        this.picklist_del_select_label_.textContent = 'Delete Picklists:'
        this.picklist_delete_div_.append(this.picklist_del_select_label_) ;

        this.picklist_del_select_ = document.createElement('select');
        this.picklist_del_select_.className = 'picklist-select' ;
        const opt = document.createElement('option') ;
        opt.value = '' ;
        opt.text = 'NONE' ;
        this.picklist_del_select_.append(opt) ;
        this.picklist_del_select_label_.append(this.picklist_del_select_) ;

        //
        // A button to delete a selected picklist
        //
        this.picklist_delete_ = document.createElement('button') ;
        this.picklist_delete_.className = 'picklist-button' ;
        this.picklist_delete_.textContent = 'Delete' ;
        this.picklist_delete_.onclick = this.deletePicklist.bind(this) ;

        this.picklist_delete_div_.append(this.picklist_delete_)
    }

    createNew(parent) {
        this.picklist_new_div_ = document.createElement('div') ;
        this.picklist_new_div_.className = 'picklist-new' ;
        parent.append(this.picklist_new_div_) ;

        this.picklist_new_label_ = document.createElement('label') ;
        this.picklist_new_label_.className = 'picklist-label' ;
        this.picklist_new_label_.textContent = 'New Picklist Name:'
        this.picklist_new_div_.append(this.picklist_new_label_) ;

        //
        // An input text field to name a new picklist that will be created with the button below
        //
        this.picklist_new_name_ = document.createElement('input') ;
        this.picklist_new_name_.className = 'picklist-info-text' ;
        this.picklist_new_name_.setAttribute('type', 'text') ;
        this.picklist_new_name_.setAttribute('placeholder', 'Picklist Name') ;

        this.picklist_new_label_.append(this.picklist_new_name_) ;

        this.picklist_new_ds_label_ = document.createElement('label') ;
        this.picklist_new_ds_label_.className = 'picklist-label' ;
        this.picklist_new_ds_label_.textContent = 'DataSet:'
        this.picklist_new_div_.append(this.picklist_new_ds_label_) ;

        this.picklist_ds_select_ = document.createElement('select');
        this.picklist_ds_select_.className = 'picklist-select' ;
        const opt = document.createElement('option') ;
        opt.value = '' ;
        opt.text = 'NONE' ;
        this.picklist_ds_select_.append(opt) ;
        this.picklist_new_ds_label_.append(this.picklist_ds_select_) ;


        //
        // A button to create a new picklist
        //
        this.picklist_new_button_ = document.createElement('button') ;
        this.picklist_new_button_.className = 'picklist-button' ;
        this.picklist_new_button_.textContent = 'Create' ;
        this.picklist_new_button_.onclick = this.createPicklist.bind(this) ;
        this.picklist_new_div_.append(this.picklist_new_button_) ;
    }

    createInitialWindow() {
        this.picklist_top_ = document.createElement('div') ;
        this.picklist_top_.className = 'picklist-top' ;

        this.picklist_ctrls_ = document.createElement('div') ;
        this.picklist_ctrls_.className = 'picklist-ctrls' ;
        this.picklist_top_.append(this.picklist_ctrls_) ;

        this.createSelect(this.picklist_ctrls_) ;
        this.createDelete(this.picklist_ctrls_) ;
        this.createNew(this.picklist_ctrls_) ;

        this.reset() ;
        this.top_.append(this.picklist_top_) ;
    }

    sendPicklistData(name) {
        this.scoutingAPI('get-picklist-data', this.current_picklist_name_) ;
        this.scoutingAPI('get-picklist-notes', this.current_picklist_name_) ;
    }

    selectedPicklistChanged() {
        //
        // This stores the data to the picklist with the name given by the
        // value this.picklist_name_ ;
        //
        this.updateTeamData() ;

        //
        // Now, ask for picklist data based on what is selected in the picklist selector
        //
        this.sendPicklistData() ;
    }

    createPicklist() {
        let name = this.picklist_new_name_.value ;
        if (name.length === 0) {
            alert('Please enter a name for the new picklist') ;
            return ;
        }

        let dsname = this.picklist_ds_select_.value ;
        if (dsname.length === 0) {
            alert('Please select a DataSet for the new picklist') ;
            return ;
        }

        this.picklist_new_name_.value = '' ;
        
        this.current_picklist_ = name ;
        this.scoutingAPI('create-new-picklist', [name, dsname]) ;
        this.scoutingAPI('get-picklist-list', true) ;
        this.loadPicklist(name) ;
    }

    loadPicklist(name) {
        this.current_picklist_ = name ;
        this.scoutingAPI('get-picklist-data', name) ;
        this.scoutingAPI('get-picklist-notes', name) ;
    }

    deletePicklist() {
        let name = this.picklist_del_select_.value ;
        this.scoutingAPI('delete-picklist', name) ;
        this.cols_ = [] ;

        this.scoutingAPI('get-picklist-list') ;
    }

    populatePicklistSelectNames(names) {
        this.clear(this.picklist_select_) ;

        if (names && names.length > 0) {
            this.picklist_select_.disabled = false ;
            for(let choice of names) {
                const opt = document.createElement('option');    
                opt.value = choice ;
                opt.text = choice ;
                this.picklist_select_.append(opt) ;
            }
        }
        else {
            const opt = document.createElement('option');    
            opt.value = '' ;
            opt.text = 'NONE' ;
            opt.disabled = true ;
            this.picklist_select_.append(opt) ;
            this.picklist_select_.disabled = true;
        }
    }

    populatePicklistDeleteNames(names) {
        this.clear(this.picklist_del_select_) ;

        if (names && names.length > 0) {
            this.picklist_del_select_.disabled = false ;
            for(let choice of names) {
                const opt = document.createElement('option');    
                opt.value = choice ;
                opt.text = choice ;
                this.picklist_del_select_.append(opt) ;
            }
        }
        else {
            const opt = document.createElement('option');    
            opt.value = '' ;
            opt.text = 'NONE' ;
            opt.disabled = true ;
            this.picklist_del_select_.append(opt) ;
            this.picklist_del_select_.disabled = true;
        }
    }

    receiveDataSets(args) {
        let datasets = args[0] ;
        this.clear(this.picklist_ds_select_) ;
        if (datasets && datasets.length > 0) {
            this.picklist_ds_select_.disabled = false ;
            for(let choice of datasets) {
                const opt = document.createElement('option');    
                opt.value = choice.name ;
                opt.text = choice.name ;
                this.picklist_ds_select_.append(opt) ;
            }
        }
        else {
            const opt = document.createElement('option');    
            opt.value = '' ;
            opt.text = 'No DataSets Defined' ;
            opt.disabled = true ;
            this.picklist_ds_select_.append(opt) ;
            this.picklist_ds_select_.disabled = true;
        }
    }

    receivePicklistList(arg) {
        this.populatePicklistSelectNames(arg[0].list) ;
        this.populatePicklistDeleteNames(arg[0].list) ;

        if (arg[0].default) {
            this.current_picklist_ = arg[0].default ;
            this.sendPicklistData() ;
        }
    }

    receiveNotes(arg) {
        this.updatingNotesFromMain_ = true ;
        let obj = arg[0] ;
        if (obj.notes) {
            for(let one of obj.notes) {
                this.setValue(PickListView.PickNotesFieldName, one.teamnumber, one.picknotes) ;
            }
        }
        this.updatingNotesFromMain_ = false ;
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
                rowHeader:{headerSort:false, resizable: false, minWidth:30, width:30, rowHandle:true, formatter:"handle"},
            });

        this.scoutingAPI('client-log', { type: 'debug', message: 'created table in client software - instance serial ' + this.instance_ }) ;

        this.table_.on("dataSorted", this.dataSorted.bind(this)) ;
        this.table_.on("rowMoved", this.teamMoved.bind(this));
        this.table_.on("columnMoved", this.colMoved.bind(this)) ;
        this.table_.on("columnResized", this.sendColumnConfiguration.bind(this)) ;
        this.table_.on("cellEdited", this.sendNotes.bind(this)) ;
        this.table_top_.append(this.table_div_) ;
    }

    dataSorted(sorters, rows) {
        if (sorters.length > 1) {
            this.change_ranking_ = false ;
        } else if (sorters.length === 0) {
            this.change_ranking_ = true ;
        } else {
            if (sorters[0].field !== 'rank') {
                this.change_ranking_ = false ;
            }
            else {
                this.change_ranking_ = true ;
            }
        }
    }

    sendNotes(cell) {
        //
        // This event triggers when any cell is changed, not just based on user editing, unlike what is implied by
        // the name of the event.  Therfore, if we are updating cells based on getting data from the main process
        // we don't trigger an update.
        //
        if (!this.table_ || this.updatingNotesFromMain_ || cell.getField() !== PickListView.PickNotesFieldName) {
            return ;
        }

        let teamnumobj = this.getColumnFromId(PickListView.TeamNumberFieldName) ;
        let notesobj = this.getColumnFromId(PickListView.PickNotesFieldName) ;

        let data = [] ;
        for(let row of this.table_.getRows()) {
            let team = row.getCell(teamnumobj).getValue() ;
            let notes = row.getCell(notesobj).getValue() ;
            let one = {
                teamnumber: team,
                picknotes: notes
            } ;
            data.push(one) ;
        }

        let obj = {
            name: this.getCurrentPicklistName(),
            notes: data
        }

        this.scoutingAPI('update-picklist-notes', obj) ;
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
            if (!this.isIgnoredField(col.name)) {
                this.addPickListCol(col) ;
            }
        }

        //
        // Now set the column widths
        //
        for(let col of obj.columns) {
            this.setColumnWidth(col.name, col.width) ;
        }

        //
        // Now rearrange the column order to match the order we received
        //
        let prev = undefined ;
        for(let index = 0 ; index < obj.columns.length ; index++) {
            let col = obj.columns[index] ;
            if (prev) {
                this.table_.moveColumn(col.name, prev, true) ;
            }
            prev = col.name ;
        }
    }

    checkPicklist() {
        if (this.team_fields_loaded_ && this.match_fields_loaded_ && this.formulas_loaded_) {
            this.scoutingAPI('get-picklist-list', true) ;
        }
    }

    receiveTeamFieldList(args) {
        this.team_fields_loaded_ = true ;
        this.team_fields_ = args[0] ;
        this.checkPicklist() ;
    }

    receiveMatchFieldList(args) {
        this.match_fields_loaded_ = true ;
        this.match_fields_ = args[0] ;
        this.checkPicklist() ;
    }

    receiveFormulas(args) {
        this.formulas_loaded_ = true ;
        this.formulas_ = [] ;
        for(let formula of args[0]) {
            this.formulas_.push(formula.name) ;
        }
        this.checkPicklist() ;
    }

    colMoved() {
        this.cols_ = [] ;
        for(let col of this.table_.getColumns()) {
            if (col.getField()) {
                let one = {
                    name: col.getField(),
                    width: col.getWidth(),
                }
                this.cols_.push(one);
            }
        }

        let coldata = {
            name: this.getCurrentPicklistName(),
            cols: this.cols_
        }

        this.scoutingAPI('update-picklist-columns', coldata) ;
    }

    getTeamNumberFromRank(rank) {
        for(let row of this.table_.getRows()) {
            let cell = row.getCell(PickListView.RankFieldName) ;
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

    teamMoved(row) {
        if (this.change_ranking_) {
            let rank = 1 ;
            for(let row of this.table_.getRows()) {
                let rankcell = row.getCell(PickListView.RankFieldName) ;
                let namecell = row.getCell(PickListView.NickNameFieldName) ;
                rankcell.setValue(rank++, false) ;
            }

            this.updateTeamData() ;
        }
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
            if (col.getField()) {
                let coldesc = {
                    name: col.getField(),
                    width: col.getWidth()
                }
                coldescs.push(coldesc) ;
            }
        }

        let coldata = {
            name: this.getCurrentPicklistName(),
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

        let fieldlist = [...this.team_fields_, ...this.match_fields_, ...this.formulas_] ;
        fieldlist.sort() ;

        for (let field of fieldlist) {
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
            }

            let coldesc = this.findColumnByName(field.field) ;
            if (coldesc && coldesc.width) {
                desc['width'] = coldesc.width ;
            }

            if (field.field === PickListView.RankFieldName) {
                //
                // This is the only field that has a menu
                //
                desc['headerMenu'] = this.picklistMenu.bind(this) ;
            }

            if (field.field === PickListView.PickNotesFieldName) {
                //
                // This is the only field that is editable
                //
                desc['editor'] = 'input' ;
            }

            cols.push(desc) ;
        }
        return cols;
    }
}

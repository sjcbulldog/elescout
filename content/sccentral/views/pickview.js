class PromptForColumnNames extends EditFormDialog {
    constructor(close, colnames, selected) {
        super(close, 'Picklist Columns') ;
        this.colnames_ = colnames ;
        this.selected_ = selected ;
    }

    async populateDialog(pdiv) {
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        let data = [] ;
        for(let name of this.colnames_) {
            let one = { 
                selected: (this.selected_ && this.selected_.includes(name)) ? true : false,
                name: name 
            } ;
            data.push(one) ;
        }

        this.colsel_ = new Tabulator(div,
            {
                data:data,
                layout:"fitData",
                resizableColumnFit:true,
                columns: [
                    { 
                        field: 'selected', 
                        title: 'Selected', 
                        width: 256, 
                        editor: 'tickCross', 
                        formatter: 'tickCross'
                    },
                    { 
                        field: 'name', 
                        title: 'Field Name', 
                        width: 512, 
                        editor: 'input' 
                    },
                ],
            }) ;

        div.style.height = '512px' ;

        pdiv.appendChild(div) ;
    }

    onInit() {
    }

    okButton(event) {
        this.selected_ = [] ;
        for(let row of this.colsel_.getRows()) {
            let data = row.getData() ;
            if (data.selected) {
                this.selected_.push(data.name) ;
            }
        }
        super.okButton(event) ;
    }
}

class PromptNameAndDataset extends EditFormDialog {
    constructor(close, datasets) {
        super(close, 'Create Picklist') ;
        this.datasets_ = datasets ;
    }

    async populateDialog(pdiv) {
        let div = document.createElement('div') ;
        div.className = 'popup-form-edit-dialog-rowdiv' ;

        this.picklist_name_ = document.createElement('input') ;
        this.picklist_name_.type = 'text' ;
        this.picklist_name_.className = 'popup-form-edit-dialog-input' ;
        this.picklist_name_.value = '' ;
        this.picklist_name_.placeholder = 'Enter Picklist Name' ;
        this.picklist_name_.maxLength = 32 ;

        let label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Picklist Name' ;
        label.appendChild(this.picklist_name_) ;
        div.appendChild(label) ;

        this.dataset_name_ = document.createElement('select') ;
        this.dataset_name_.className = 'popup-form-edit-dialog-select' ;
        let fonts = await window.queryLocalFonts() ;
        for(let ds of this.datasets_) {
            let option = document.createElement('option') ;
            option.value = ds ;
            option.innerText = ds ;
            this.dataset_name_.appendChild(option) ;
        }
        this.dataset_name_.value = this.datasets_[0] ;

        label = document.createElement('label') ;
        label.className = 'popup-form-edit-dialog-label' ;
        label.innerText = 'Dataset' ;
        label.appendChild(this.dataset_name_) ;
        div.appendChild(label) ;    

        pdiv.appendChild(div) ;
    }

    onInit() {
        this.picklist_name_.focus() ;
        this.picklist_name_.select() ;
    }

    okButton(event) {
        this.enteredName = this.picklist_name_.value.trim() ;
        this.enteredDataset = this.dataset_name_.value.trim() ;

        super.okButton(event) ;
    }
}

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
        this.updateTeamData() ;
        super.close() ;
    }

    populatePickListList(names) {
        this.picklist_items_ = [] ;
        this.clear(this.picklist_list_) ;

        if (names && names.length > 0) {
            for(let name of names) {
                let one = document.createElement('span') ;
                one.className = 'picklist-list-item' ;
                one.textContent = name ;
                one.addEventListener('click', this.selectedPicklistChanged.bind(this)) ;
                one.addEventListener('dblclick', this.editPicklist.bind(this)) ;
                this.picklist_list_.append(one) ;
                this.picklist_items_.push(one) ;
            }
        }
    }

    selectedPicklistChanged(event) {
        let name = event.target.textContent ;
        this.loadPicklist(name) ;
    }

    editPicklist(event) {
        let name = event.target.textContent ;
        alert('Edit picklist ' + name) ;
    }

    createPicklistList(parent) {
        this.picklist_list_div_ = document.createElement('div') ;
        this.picklist_list_div_.className = 'picklist-list-div' ;

        this.picklist_list_ = document.createElement('div') ;
        this.picklist_list_.className = 'picklist-list-list' ;
        this.picklist_list_div_.append(this.picklist_list_) ;

        this.picklist_ctrls_ = document.createElement('div') ;
        this.picklist_ctrls_.className = 'picklist-list-ctrls' ;
        this.picklist_list_div_.append(this.picklist_ctrls_) ;

        this.picklist_delete_ = document.createElement('span') ;
        this.picklist_delete_.className = 'picklist-list-control' ;
        this.picklist_delete_.innerHTML = '&#9949;' ;
        this.picklist_ctrls_.append(this.picklist_delete_) ;
        this.picklist_delete_.addEventListener('click', this.deletePicklist.bind(this)) ;

        this.picklist_add_ = document.createElement('span') ;
        this.picklist_add_.className = 'picklist-list-control' ;
        this.picklist_add_.innerHTML = '&#10133;' ;
        this.picklist_ctrls_.append(this.picklist_add_) ;
        this.picklist_add_.addEventListener('click', this.createPicklist.bind(this)) ;

        parent.append(this.picklist_list_div_) ;
    }

    createInitialWindow() {
        this.reset() ;

        // This is where the picklist is displayed
        this.picklist_top_ = document.createElement('div') ;
        this.picklist_top_.className = 'picklist-top' ;

        // This is to the left of the picklist display and contains the controls to create, delete, and select picklists
        this.leftside_ = new XeroFoldable(this.top_, this.picklist_top_, 'Picklist') ;
        this.createPicklistList(this.leftside_.content) ;
        
        this.list_top_ = document.createElement('div') ;
        this.list_top_.className = 'list-top' ;

        this.picklist_top_.append(this.leftside_.elem) ;
        this.picklist_top_.append(this.list_top_) ;
        this.top_.append(this.picklist_top_) ;
    }

    createPicklistDialogClosed(ok) {
        if (ok) {
            this.scoutingAPI('create-new-picklist', [this.dialog_.enteredName, this.dialog_.enteredDataset]) ;
            this.scoutingAPI('get-picklist-list', true) ;
            this.loadPicklist(ok.enteredName) ;
            this.dialog_ = undefined ;
        }
    }

    createPicklist() {
        //
        // Popup dialog box for picklist name and dataset
        //
        this.dialog_ = new PromptNameAndDataset(this.createPicklistDialogClosed.bind(this), this.datasets_.map((ds) => ds.name)) ;
        this.dialog_.showRelative(this.top_) ;
    }

    setPicklistSelected(name) {
        for(let item of this.picklist_items_) {
            if (item.textContent === name) {
                item.className = 'picklist-list-item-selected' ;
            }
            else {
                item.className = 'picklist-list-item' ;
            }
        }
    }

    loadPicklist(name) {

        this.updateTeamData() ;

        this.current_picklist_ = name ;
        this.setPicklistSelected(name) ;
        this.scoutingAPI('get-picklist-data', name) ;
        this.scoutingAPI('get-picklist-notes', name) ;
        this.scoutingAPI('get-picklist-columns', name) ;
    }

    deletePicklist() {
        this.scoutingAPI('delete-picklist', this.current_picklist_) ;
        this.clear(this.table_div_) ;
        this.current_picklist_ = undefined ;
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
        this.datasets_ = args[0] ;
    }

    receivePicklistList(arg) {
        this.populatePickListList(arg[0].list) ;

        if (!this.current_picklist_) {
            //
            // If we don't have a current picklist, then we need load the default, which is the last picklist
            // that was previously loaded.  If there is no default, then we load the first picklist in the list.
            //
            if (arg[0].default) {
                this.loadPicklist(arg[0].default) ;
            }
            else if (arg[0].list.length > 0) {
                this.loadPicklist(arg[0].list[0]) ;
            }
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

    addRemoveColumns(e, col) {
        let colnames = [] ;
        let ds = undefined ;

        let fieldlist = [...this.team_fields_, ...this.match_fields_, ...this.formulas_] ;
        let selected = this.cols_.map((col) => col.name) ;
        this.dialog_ = new PromptForColumnNames(this.selectPicklistMenu.bind(this), fieldlist, selected) ;
        this.dialog_.showRelative(this.top_) ;
    }

    receivePicklistData(arg) {
        let obj = arg[0] ;

        this.clear(this.list_top_) ;
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
        this.table_.on("headerDblClick", this.addRemoveColumns.bind(this)) ;
        this.list_top_.append(this.table_div_) ;
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
            name: this.picklist_name_,
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

        for(let i = 0 ; i < dobj.teams.length ; i++) {
            let team = dobj.teams[i] ;
            let value = XeroView.formatDataValue(dobj.data[i]) ;
            this.setValue(dobj.field, team, value) ;
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

        for(let col of obj.cols) {
            if (!this.isIgnoredField(col.name)) {
                this.addPickListCol(col) ;
            }
        }

        //
        // Now set the column widths
        //
        for(let col of obj.cols) {
            this.setColumnWidth(col.name, col.width) ;
        }

        //
        // Now rearrange the column order to match the order we received
        //
        let prev = undefined ;
        for(let index = 0 ; index < obj.cols.length ; index++) {
            let col = obj.cols[index] ;
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
            name: this.current_picklist_,
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
            name: this.current_picklist_,
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

        let obj = {
            name: this.current_picklist_,
            field: desc.name,
        }
        this.scoutingAPI('get-picklist-col-data', obj) ;
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

    selectPicklistMenu() {

        // Remove all columns
        for(let col of this.cols_) {
            if (!this.isIgnoredField(col.name) && !this.dialog_.selected_.includes(col.name)) {
                this.removeColumn(col.name) ;
            }
        }
        
        for(let field of this.dialog_.selected_) {
            if (this.findColumnIndexByName(field) !== -1) {
                let desc = {
                    name: field,
                    width: 64
                }
                this.addPickListCol(desc) ;
            }
        }
        this.sendColumnConfiguration();
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

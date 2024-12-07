
class PickListView extends TabulatorView {
    constructor(div,viewtype) {
        super(div, viewtype);

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

        window.scoutingAPI.send('get-picklist-list') ;
        window.scoutingAPI.send('get-team-field-list');
        window.scoutingAPI.send('get-match-field-list');
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
        window.scoutingAPI.send('get-picklist-data', this.picklist_info_existing_.value) ;
        window.scoutingAPI.send('get-picklist-columns', this.picklist_info_existing_.value) ;
    }

    createPicklist() {
        this.updateTeamData() ;

        let name = this.picklist_info_text_.value ;
        window.scoutingAPI.send('create-new-picklist', name) ;
    }

    deletePicklist() {
        let name = this.picklist_info_existing_.value ;
        this.clear(this.table_top_) ;
        window.scoutingAPI.send('delete-picklist', name) ;
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
            window.scoutingAPI.send('get-picklist-data', this.picklist_info_existing_.value) ;
            window.scoutingAPI.send('get-picklist-columns', this.picklist_info_existing_.value) ;
        }
    }

    receivePicklistData(arg) {
        let obj = arg[0] ;
        this.clear(this.table_top_) ;
        this.cols_ = [] ;

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
    
        this.table_.on("rowMoved", this.teamMoved.bind(this));
        this.table_.on("columnMoved", this.colMoved.bind(this)) ;
        this.table_top_.append(this.table_div_) ;
    }

    setValue(field, team, value) {
        let fieldcolobj = this.getColumnFromId(field) ;
        let teamnumobj = this.getColumnFromId('teamnumber') ;
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

    receivePicklistColumns(args) {
        let store = [...this.cols_] ;
        for(let col of store) {
            this.removeColumn(col) ;
        }

        for(let col of args[0]) {
            this.addPickListCol(col) ;
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
            let fld = col.getField() ;
            if (fld !== 'rank' && fld != 'nickname' && fld != 'teamnumber') {
                this.cols_.push(col.getField())
            }
        }

        window.scoutingAPI.send('update-picklist-columns', this.cols_) ;
    }

    getTeamNumberFromRank(rank) {
        for(let row of this.table_.getRows()) {
            let cell = row.getCell('rank') ;
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

        window.scoutingAPI.send('update-picklist-data', obj) ;
    }

    teamMoved() {
        let rank = 1 ;
        for(let row of this.table_.getRows()) {
            let cell = row.getCell('rank') ;
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

    addPickListCol(field) {
        this.cols_.push(field) ;
        this.table_.addColumn({
            field: field,
            title: field,
        });
        window.scoutingAPI.send('get-picklist-col-data', field) ;
    }

    removeColumn(field) {
        let index = this.cols_.indexOf(field) ;
        this.cols_.splice(index, 1) ;
        let col = this.getColumnFromId(field) ;
        col.delete() ;
    }

    selectPicklistMenu(field) {
        if (this.cols_.includes(field)) {
            this.removeColumn(field) ;
        }
        else {
            this.addPickListCol(field) ;
        }

        let coldata = {
            name: this.picklist_name_,
            cols: this.cols_
        }
        window.scoutingAPI.send('update-picklist-columns', coldata) ;
    }

    picklistMenu() {
        var menu = [];
        var columns = this.table_.getColumns();

        for (let field of [...this.team_fields_, ...this.match_fields_]) {
            //create checkbox element using font awesome icons
            let icon = document.createElement("i");
            icon.innerHTML = this.cols_.includes(field) ? '&check;' : ' ';

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

        cols.push({
            field: 'rank',
            title: 'Rank',
            headerMenu: this.picklistMenu.bind(this),
        }) ;

        cols.push({
            field: 'teamnumber',
            title: 'Team Number',
            headerSort: false,
        }) ;

        cols.push({
            field: 'nickname',
            title: 'Team Name',
            headerSort: false,
        }) ;        
        return cols;
    }
}

window.scoutingAPI.receive("send-picklist-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-list', args); });
window.scoutingAPI.receive("send-picklist-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-data', args); });
window.scoutingAPI.receive("send-picklist-columns", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-columns', args); });
window.scoutingAPI.receive("send-picklist-col-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-col-data', args); });

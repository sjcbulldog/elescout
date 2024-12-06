
class PickListView extends TabulatorView {
    constructor(div,viewtype) {
        super(div, viewtype);

        this.cols_ = [] ;
        this.team_fields_ = [] ;
        this.match_fields_ = [] ;

        this.createInitialWindow() ;

        this.registerCallback('send-picklist-data', this.formCallback.bind(this));
        this.registerCallback('send-picklist-columns', this.receivePicklistColumns.bind(this));
        this.registerCallback('send-picklist-col-data', this.receivePicklistColData.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));

        window.scoutingAPI.send('get-picklist-list') ;
        window.scoutingAPI.send('get-picklist-data');
        window.scoutingAPI.send('get-team-field-list');
        window.scoutingAPI.send('get-match-field-list');
        window.scoutingAPI.send('get-picklist-columns');
    }

    createInitialWindow() {
        this.picklist_top_ = document.createElement('div') ;

        this.picklist_info_ = document.createElement('div') ;
        this.picklist_info_.className = 'picklist-info' ;

        this.picklist_info_name_ = document.createElement('div') ;
        this.picklist_info_name_.className = 'picklist-info-name' ;
        this.picklist_info_name_.textContent = 'Picklist: Not Selected' ;

        this.picklist_info_existing_ = document.createElement('select');
        this.picklist_info_existing_.className = 'picklist-info-existing' ;
        const opt = document.createElement('option') ;
        opt.value = '' ;
        opt.text = 'NONE' ;
        this.picklist_info_existing_.append(opt) ;

        this.picklist_info_label_ = document.createElement('label') ;
        this.picklist_info_label_.className = 'picklist-info-label' ;
        this.picklist_info_label_.textContent = 'Pick List Name'
        this.picklist_info_.append(this.picklist_info_label_) ;
        this.picklist_info_label_.append(this.picklist_info_create_) ;

        this.picklist_info_text_ = document.createElement('input') ;
        this.picklist_info_text_.className = 'picklist-info-text' ;
        this.picklist_info_text_.setAttribute('type', 'text') ;
        this.picklist_info_label_.append(this.picklist_info_existing_) ;

        this.picklist_info_create_ = document.createElement('button') ;
        this.picklist_info_create_.className = 'picklist-info-button' ;
        this.picklist_info_create_.textContent = 'Create' ;
        this.picklist_info_.append(this.picklist_info_create_) ;

        this.picklist_info_delete_ = document.createElement('button') ;
        this.picklist_info_delete_.className = 'picklist-info-button' ;
        this.picklist_info_delete_.textContent = 'Create' ;
        this.picklist_info_.append(this.picklist_info_delete_) ;
    }

    populatePicklistNames(names) {
        for(let choice of names) {
            const opt = document.createElement('option');    
            opt.value = choice ;
            opt.text = choice ;
            this.picklist_info_existing_.append(opt) ;
        }
    }

    render() {
        this.reset() ;
        this.top_.append(this.picklist_top_) ;
    }

    formCallback(data) {
        this.reset() ;
        this.table_div_ = document.createElement('div');
        this.table_div_.id = 'tablediv';

        this.table_ = new Tabulator(this.table_div_, 
            {
                data:data[0],
                layout:"fitData",
                resizableColumnFit:true,
                columns: this.generateColDesc(),
                movableColumns: true,
                movableRows: true,
            });
    
        this.table_.on("rowMoved", this.teamMoved.bind(this));
        this.table_.on("columnMoved", this.colMoved.bind(this)) ;
        this.top_.append(this.table_div_) ;
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

        console.log(dobj.field) ;

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

    teamMoved() {
        let rank = 1 ;
        for(let row of this.table_.getRows()) {
            let cell = row.getCell('rank') ;
            cell.setValue(rank++, false) ;
        }

        let teams = [] ;
        for(let row of this.table_.getRows()) {
            let cell = row.getCell('teamnumber') ;
            teams.push(cell.getData().teamnumber) ;
        }

        window.scoutingAPI.send('update-picklist-data', teams) ;
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

    selectPicklistMenu(field) {
        if (this.cols_.includes(field)) {
            let index = this.cols_.indexOf(field) ;
            this.cols_.splice(index, 1) ;
            let col = this.getColumnFromId(field) ;
            col.delete() ;
        }
        else {
            this.addPickListCol(field) ;
        }

        window.scoutingAPI.send('update-picklist-columns', this.cols_) ;
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

window.scoutingAPI.receive("send-picklist-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-data', args); });
window.scoutingAPI.receive("send-picklist-columns", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-columns', args); });
window.scoutingAPI.receive("send-picklist-col-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-picklist-col-data', args); });

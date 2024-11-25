
class PickListView extends TabulatorView {
    constructor(div,viewtype) {
        super(div, viewtype);

        this.cols_ = [] ;
        this.team_fields_ = [] ;
        this.match_fields_ = [] ;

        this.buildInitialView('Retreiving data for the pick list view, please wait ...') ;
        this.registerCallback('send-picklist-data', this.formCallback.bind(this));
        this.registerCallback('send-picklist-columns', this.receivePicklistColumns.bind(this));
        this.registerCallback('send-picklist-col-data', this.receivePicklistColData.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));

        window.scoutingAPI.send('get-picklist-data');
        window.scoutingAPI.send('get-team-field-list');
        window.scoutingAPI.send('get-match-field-list');
        window.scoutingAPI.send('get-picklist-columns');
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

    receivePicklistColData(args) {
        let dobj = args[0];

        for(let i = 0 ; i < dobj.teams.length ; i++) {
            let team = dobj.teams[i] ;
            let value = dobj.data[i] ;
            this.setValue(dobj.field, team, value) ;
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

    teamMoved() {
        let rank = 1 ;
        for(let row of this.table_.getRows()) {
            let cell = row.getCell('rank') ;
            cell.setValue(rank++, false) ;
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

    addPickListCol(field) {
        this.cols_.push(field) ;
        this.table_.addColumn({
            field: field,
            title: field,
            headerSort: false,
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

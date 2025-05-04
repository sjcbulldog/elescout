class DataSetsView extends XeroView {

    static MatchesFirst = 'first' ;
    static MatchesLast = 'last' ;
    static MatchesRange = 'range' ;
    static MatchesAll = 'all' ;

    constructor(div, viewtype) {
        super(div, viewtype);

        this.formulas_received_ = false ;
        this.match_fields_received_ = false ;
        this.team_fields_received_ = false ;
        this.team_list_received_ = false ;

        this.block_editing_ = false ;

        this.field_list_ = [] ;
        this.team_list_ = [] ;

        this.registerCallback('send-datasets', this.receiveDataSets.bind(this));
        this.registerCallback('send-formulas', this.receiveFormulas.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));
        this.registerCallback('send-team-list', this.receiveTeamList.bind(this));

        this.scoutingAPI('get-formulas') ;
        this.scoutingAPI('get-team-field-list');
        this.scoutingAPI('get-match-field-list');
        this.scoutingAPI('get-team-list', true) ;
    }

    close() {
        super.close() ;
        if (this.popup_ !== undefined) {
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }
    }

    checkReady() {
        this.field_list_.sort() ;

        this.team_list_.sort((a, b) => {
            if (a.number < b.number) {
                return -1 ;
            } else if (a.number > b.number) {
                return 1 ;
            } else {
                return 0 ;
            }
        }) ;

        if (this.formulas_received_ && this.match_fields_received_ && this.team_fields_received_ && this.team_list_received_) {
            this.createBaseDisplay() ;
            this.scoutingAPI('get-datasets') ;
        }
    }

    lookupTeam(number) {
        for(let team of this.team_list_) {
            if (team.number === number) {
                return team ;
            }
        }
        return undefined ;
    }

    datasetToTabulatorRow(ds) {
        return {
            name: ds.name,
            kind: ds.matches.kind,
            first: ds.matches.first,
            last: ds.matches.last,
            teams: ds.teams,
            fields: ds.fields,
            addremove: false,
        } ;
    }

    receiveDataSets(data) {
        this.datasets_ = data[0] ;

        let tabdata = [] ;
        for(let ds of data[0]) {
            tabdata.push(this.datasetToTabulatorRow(ds)) ;
        }

        tabdata.push({
            name: '',
            addremove: true,
        })

        this.table_.replaceData(tabdata) ;
    }

    receiveFormulas(data) {
        this.formulas_received_ = true ;
        for(let f of data[0]) {
            this.field_list_.push(f.name) ;
        }
        this.checkReady() ;
    }

    receiveTeamList(data) {
        this.team_list_ = data[0] ;
        this.team_list_received_ = true ;
        this.checkReady() ;
    }

    receiveTeamFieldList(list) {
        this.field_list_ = [...this.field_list_, ...list[0]] ;
        this.team_fields_received_ = true ;
        this.checkReady() ;
    }
    
    receiveMatchFieldList(list) {
        this.match_fields_received_ = true ;
        this.field_list_ = [...this.field_list_, ...list[0]] ;
        this.checkReady() ;
    }

    createBaseDisplay() {
        this.reset() ;
        this.single_top_ = document.createElement('div') ;
        this.single_top_.className = 'dataset-single-top' ;

        this.createList(this.single_top_) ;
        this.top_.append(this.single_top_) ;
    }

    findDatasetByName(name) {
        for(let ds of this.datasets_) {
            if (ds.name === name) {
                return ds ;
            }
        }
        return undefined ;
    }

    findUniqueName() {
        let cnt = 1 ;
        while (true) {
            let name = 'Dataset-' + cnt ;
            let ds = this.findDatasetByName(name) ;
            if (ds === undefined) {
                return name ;
            }
            cnt++ ;
        }
    }

    getTeamList() {
        let teamlist = [] ;
        for(let team of this.team_list_) {
            teamlist.push(team.number) ;
        }
        return teamlist ;
    }

    getTeamListWithName() {
        let teamlist = [] ;
        for(let team of this.team_list_) {
            teamlist.push(team.number + ' - ' + team.nickname) ;
        }
        return teamlist ;
    }

    getTeamListWithNameFromDataSet(ds) {
        let teamlist = [] ;
        for(let num of ds.teams) {
            let team = this.lookupTeam(num) ;
            if (team) {
                teamlist.push(team.number + ' - ' + team.nickname) ;
            }
        }
        return teamlist ;
    }

    deleteDataSet(name) {
        this.scoutingAPI('delete-dataset', name) ;
        for(let i = 0; i < this.datasets_.length; i++) {
            if (this.datasets_[i].name === name) {
                this.datasets_.splice(i, 1) ;
                break ;
            }
        }
    }

    addRemovePressed(e, cell) {
        if (this.block_editing_) {
            return ;
        }

        let index = cell.getRow().getPosition() ;
        if (index === this.table_.rowManager.rows.length) {
            // Create the new dataset
            let ds = {
                name: this.findUniqueName(),
                matches : {
                    kind: DataSetsView.MatchesAll,
                    first: 0,
                    last: 0,
                },
                teams: this.getTeamList(),
                fields: [],
            }
            this.datasets_.push(ds) ;
            this.scoutingAPI('update-dataset', ds) ;

            // Add a new row
            let newdata = [] ;
            newdata.push(this.datasetToTabulatorRow(ds)) ;

            this.table_.addData(newdata, true)
            .then((rows) => {
                let row = rows[0] ;
                let table = row.getTable() ;
                let lastrow = table.rowManager.rows[table.rowManager.rows.length - 1] ;
                row.move(lastrow, true) ;
            }) ;
        }
        else {
            // Delete the current row
            let data = cell.getRow().getData() ;
            this.deleteDataSet(data.name) ;
            this.table_.deleteRow(cell.getRow()) ;
        }
    }

    isGlobalEditable(cell) {
        if (this.block_editing_) {
            return false ;
        }
        return true ;
    }

    isFirstEditable(cell) {
        if (this.block_editing_) {
            return false ;
        }

        let ret = false ;
        let data = cell.getRow().getData() ;
        if (data.kind === DataSetsView.MatchesFirst || data.kind === DataSetsView.MatchesRange) {
            ret = true ;
        }
        return ret ;
    }

    isLastEditable(cell) {
        if (this.block_editing_) {
            return false ;
        }

        let ret = false ;
        let data = cell.getRow().getData() ;
        if (data.kind === DataSetsView.MatchesLast || data.kind === DataSetsView.MatchesRange) {
            ret = true ;
        }
        return ret ;
    }

    generateColDesc() {
        return [
            {
                field: 'addremove',
                formatter:"tickCross", 
                formatterParams: {
                    tickElement: '<span class="dsadd"></span>',
                    crossElement: '<span class="dsremove"></span>',
                    allowEmpty: true,
                    allowTruthy: true
                },
                width:40, 
                cellClick: this.addRemovePressed.bind(this),
                headerSort: false,
                editable: false,
            },
            {
                field: 'name',
                title: 'Name',
                editor: 'input',
                headerSort: false,
                editable: this.isGlobalEditable.bind(this),
            },
            {
                field: 'kind',
                title: 'Type',
                headerSort: false,
                editor: 'list',
                editorParams: {
                    values : [
                        DataSetsView.MatchesFirst,
                        DataSetsView.MatchesLast,
                        DataSetsView.MatchesRange,
                        DataSetsView.MatchesAll,
                    ],
                    clearable: false,
                    defaultValue: DataSetsView.MatchesAll,
                    emptyValue: DataSetsView.MatchesAll,
                },
                editable: this.isGlobalEditable.bind(this),
            },
            {
                field: 'first',
                title: 'First',
                headerSort: false,
                editor: 'number',
                editorParams: {
                    min: 0,
                    max: 32,
                    step: 1,
                },
                editable: this.isFirstEditable.bind(this),
            },
            {
                field: 'last',
                title: 'Last',
                headerSort: false,
                editor: 'number',
                editorParams: {
                    min: 0,
                    max: 32,
                    step: 1,
                },
                editable: this.isLastEditable.bind(this),
            },
            {
                field: 'teams',
                title: 'Teams',
                headerSort: false,
                editable: false,
            },
            {
                field: 'fields',
                title: 'Fields',
                headerSort: false,
                editable: false
            },
        ] ;
    }

    teamEditingComplete(data) {
        this.popup_.destroy() ; 
        this.popup_ = undefined ;
        this.block_editing_ = false ;

        //
        // Update the data set
        //
        this.current_ds_.teams = [] ;
        for(let team of data) {
            let num = parseInt(team) ;
            if (!isNaN(num)) {
                this.current_ds_.teams.push(num) ;
            }
        }

        //
        // Update the main process and the event file
        //
        this.scoutingAPI('update-dataset', this.current_ds_) ;

        //
        // Update the table
        //
        this.current_cell_.setValue(this.current_ds_.teams) ;
    }

    editTeams(cell) {
        let data = cell.getRow().getData() ;
        this.current_ds_ = this.findDatasetByName(data.name) ;
        this.current_cell_ = cell ;

        let offset = this.getAbsPosition(this.single_top_) ;
        let bounds = this.single_top_.getBoundingClientRect() ;
        if (this.popup_ !== undefined) {
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }

        this.block_editing_ = true ;
        this.popup_ = new PopupEditor('Select Teams', this.getTeamListWithName(), this.getTeamListWithNameFromDataSet(this.current_ds_)) ;
        this.popup_.registerCallback('ok', this.teamEditingComplete.bind(this)) ;

        this.popup_.registerCallback('cancel', () => {
            this.block_editing_ = false ;
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }) ;

        this.popup_.show(offset.x + bounds.width / 4, offset.y + bounds.height / 4, bounds.width / 2, bounds.height / 2) ;
    }

    fieldEditingComplete(data) {
        this.popup_.destroy() ; 
        this.popup_ = undefined ;
        this.block_editing_ = false ;

        //
        // Update the data set
        //
        this.current_ds_.fields = data ;

        //
        // Update the main process and the event file
        //
        this.scoutingAPI('update-dataset', this.current_ds_) ;

        //
        // Update the table
        //
        this.current_cell_.setValue(this.current_ds_.fields) ;
    }    

    editFields(cell) {
        let data = cell.getRow().getData() ;
        this.current_ds_ = this.findDatasetByName(data.name) ;
        this.current_cell_ = cell ;

        let offset = this.getAbsPosition(this.single_top_) ;
        let bounds = this.single_top_.getBoundingClientRect() ;
        if (this.popup_ !== undefined) {
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }

        this.block_editing_ = true ;
        this.popup_ = new PopupEditor('Select Fields', this.field_list_, this.current_ds_.fields) ;
        this.popup_.registerCallback('ok', this.fieldEditingComplete.bind(this)) ;

        this.popup_.registerCallback('cancel', () => {
            this.block_editing_ = false ;
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }) ;

        this.popup_.show(offset.x + bounds.width / 4, offset.y + bounds.height / 4, bounds.width / 2, bounds.height / 2) ;
    }

    cellDoubleClick(e, cell) {
        let col = cell.getColumn().getField() ;
        if (col === 'teams') {
            this.editTeams(cell) ;
        }
        else if (col === 'fields') {
            this.editFields(cell) ;
        }
    }

    cellEdited(cell) {
        let col = cell.getColumn().getField() ;
        if (col === 'kind') {
            this.kindColumnEdited(cell) ;
        }
        else if (col === 'name') {
            this.nameColumnEdited(cell) ;
        }
        else if (col === 'teams') {
            this.teamColumnEdited(cell) ;
        }
    }

    teamColumnEdited(cell) {
        let data = cell.getRow().getData() ;
        let teams = cell.getValue() ;
        let ds = this.findDatasetByName(data.name) ;
        let cvalue = '' ;
        if (ds !== undefined) {
            ds.teams = [] ;
            for(let team of teams) {
                let num = parseInt(team) ;
                if (!isNaN(num)) {
                    if (cvalue.length > 0) {
                        cvalue += ',' ;
                    }
                    cvalue += num ;
                }
                ds.teams.push(num) ;
            }

            this.scoutingAPI('update-dataset', ds) ;
        }
    }

    kindColumnEdited(cell) {
        let data = cell.getRow().getData() ;
        let kind = cell.getValue() ;
        let firstcell = cell.getRow().getCell('first') ;
        let lastcell = cell.getRow().getCell('last') ;

        if (kind === DataSetsView.MatchesFirst) {
            lastcell.setValue(0) ;
        }
        else if (kind === DataSetsView.MatchesLast) {
            firstcell.setValue(0) ;
        }
        else if (kind === DataSetsView.MatchesAll) {
            firstcell.setValue(0) ;
            lastcell.setValue(0) ;
        }
    }

    clearAlert() {
        this.table_.clearAlert() ;
    }

    nameColumnEdited(cell) {
        let data = cell.getRow().getData() ;
        let name = cell.getValue() ;
        let ds = this.findDatasetByName(name) ;
        if (ds !== undefined) {
            let timer = setTimeout(this.clearAlert.bind(this), 2000) ;
            this.table_.alert('Dataset name already exists') ;
            cell.restoreOldValue() ;
        }
        else {
            this.scoutingAPI('rename-dataset', [cell.getOldValue(), name]) ;
        }
    }

    createList(parent) {
        let data = [] ;
        this.table_div_ = document.createElement('div');
        this.table_div_.className = 'dataset-list' ;
        this.table_ = new Tabulator(this.table_div_, 
            {
                data:data,
                layout:"fitData",
                resizableColumnFit:true,
                columns: this.generateColDesc(),
                movableColumns: true,
            });

        this.table_.on('cellEdited', this.cellEdited.bind(this)) ;
        this.table_.on('cellDblClick', this.cellDoubleClick.bind(this)) ;

        parent.append(this.table_div_) ;
    }    
}
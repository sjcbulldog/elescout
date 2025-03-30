class MultiView extends XeroView {
    constructor(div, viewtype) {
        super(div, viewtype) ;

        this.registerCallback('send-team-list', this.receiveTeamList.bind(this));
        this.registerCallback('send-multi-selected-teams', this.receiveMultiSelectedTeams.bind(this));
        this.registerCallback('send-multi-team-data', this.receiveMultiTeamData.bind(this));

        this.reset() ;
        this.multi_top_ = document.createElement('div') ;
        this.multi_top_.className = 'multi-team-top' ;
        this.top_.appendChild(this.multi_top_) ;

        this.createTeamSelector(this.multi_top_) ;
        this.createTableView(this.multi_top_) ;

        this.scoutingAPI('get-team-list') ;
    }

    createTeamSelector(parent) {
        this.team_selector_div_ = document.createElement('div') ;
        this.team_selector_div_.className = 'multi-team-select-div' ;
        parent.appendChild(this.team_selector_div_) ;

        this.team_selector_ = new XeroSelector('Teams', false);
        this.team_selector_.detail.className = 'multi-team-select' ;
        this.team_selector_div_.appendChild(this.team_selector_.detail);
    }

    receiveMultiTeamData(data) {
        this.createTableView(this.multi_top_, data[0]) ;
    }

    //
    // Receive the list of teams selected by default
    //
    receiveMultiSelectedTeams(data) {
        this.team_selector_.unselectAll() ;
        if (data && Array.isArray(data)) {
            let teams = data[0] ;
            if (Array.isArray(teams)) {
                this.team_selector_.selectItems(teams) ;
                if (teams.length > 0) {
                    this.scoutingAPI('get-multi-team-data', { teams: teams, numericonly: false, mcount: 1000} ) ;
                }
                else {
                    this.clearTable() ;
                }
            }
        }
    }

    somethingChanged() {
        let teams = this.team_selector_.getSelectedItems() ;
        this.scoutingAPI('set-multi-selected-teams', teams) ;
        this.scoutingAPI('get-multi-team-data',  { teams: teams, numericonly: false, mcount: 1000} ) ;
    }

    receiveTeamList(list) {
        this.team_selector_.addDataToSelectors(list[0], this.somethingChanged.bind(this))
        this.scoutingAPI('get-multi-selected-teams') ;
    }

    clearTable() {
        if (this.table_) {
            this.table_.setData([]) ;
            this.table_.columns = [] ;
        }
    }

    generateColDesc(coldata) {
        let cols = [];
        for(let col of coldata) {
            let coldesc = {
                field: col,
                title: col,
                sorter: (col === 'team_number' ? 'number' : 'alphanum'),
            } ;
            cols.push(coldesc) ;
        }
        return cols ;
    }

    createTableView(parent, data) {
        if (data) {
            if (this.table_) {
                this.table_.destroy() ;
            }

            if (!this.table_div_) {
                this.table_div_ = document.createElement('div');
                this.table_div_.id = 'tablediv';
            }

            let coldesc = this.generateColDesc(data.columns) ;
            this.table_ = new Tabulator(this.table_div_, 
                {
                    data:data.data,
                    layout:"fitData",
                    resizableColumnFit:true,
                    columns: coldesc,
                    movableColumns: true,
                    movableRows: true,
                });      

            parent.appendChild(this.table_div_) ;
        }
    }
}
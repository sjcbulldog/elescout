class SelectEventView extends TabulatorView {
    constructor(div, viewtype) {
        super(div, viewtype) ;

        this.buildInitialView('Waiting for events ...') ;
        this.registerCallback('send-event-data', this.formCallback.bind(this));
        this.scoutingAPI("get-event-data");
        this.loading_ = false ;
    }

    evDistMutator(value, data, type, params, component) {
        return (value === null) ? '' : value ;
    }

    loadBAEvent(ev, cell) {
        if (this.loading_) {
            return ;
        }

        this.loading_ = true ;

        let row = cell.getRow() ;
        let key = row.getData().key ;
        let desc = row.getData().name ;

        statusShow() ;
        statusSetTitle("Loading event ...") ;
        statusSetText('') ;
        statusShowCloseButton(false) ;

        this.scoutingAPI("load-ba-event-data", key);
    }

    updateFilter() {
        this.table_.setFilter('name', 'like', this.search_input_.value) ;
    }

    tableComplete() {   
        for(let col of this.table_.getColumns()) {
            col.setWidth(true) ;
        }
    }

    formCallback(args) {
        this.logMessage('silly', 'SelectEventView.formCallback', { args: args}) ;
        this.reset() ;

        this.logMessage('silly', 'after reset') ;
        this.view_div_ = document.createElement('div') ;
        this.top_.append(this.view_div_) ;

        this.search_div_ = document.createElement('div') ;
        this.view_div_.append(this.search_div_);

        this.table_div_ = document.createElement('div');
        this.view_div_.append(this.table_div_) ;

        this.search_input_ = document.createElement('input') ;
        this.search_input_.id='select-event-search-box' ;
        this.search_input_.type = 'text' ;
        this.search_input_.placeholder = 'Enter text to search' ;
        this.search_input_.addEventListener("keyup", this.updateFilter.bind(this));
        this.search_div_.append(this.search_input_) ;

        let cols = [] ;
        cols.push({
            width: 100,
            field: 'key',
            title: 'Event Key',
        }) ;
    
        cols.push({
            width: 100,
            field: 'name',
            title: 'Name',
        }) ;
    
        cols.push({
            width: 100,
            field: 'district.display_name',
            title: 'District',
            mutator: this.evDistMutator.bind(this),
        }) ;
    
        cols.push({
            width: 100,
            field: 'start_date',
            title: 'Date'
        })

        this.logMessage('silly', 'before create table') ;
        
        this.table_ = new Tabulator(this.table_div_,
            {
                data:args[0],
                layout:"fitData",
                resizableColumnFit:true,
                resizableColumnGuide:true,
                columns:cols
            });

        this.logMessage('silly', 'after create table') ;
        
        this.table_.on("cellDblClick", this.loadBAEvent.bind(this)) ;
        this.table_.on("tableBuilt", this.tableComplete.bind(this)) ;
    }
}

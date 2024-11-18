class SelectEventView extends TabulatorView {
    constructor(div, viewtype) {
        super(div, viewtype) ;

        this.buildInitialView('Waiting for events ...') ;
        this.registerCallback('send-event-data', this.formCallback.bind(this));
        window.scoutingAPI.send("get-event-data");
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

        window.scoutingAPI.send("load-ba-event-data", key);
    }

    formCallback(args) {
        this.reset() ;

        this.table_div_ = document.createElement('div');
        this.top_.append(this.table_div_) ;

        let cols = [] ;
        cols.push({
            field: 'key',
            title: 'Event Key',
        }) ;
    
        cols.push({
            field: 'name',
            title: 'Name',
        }) ;
    
        cols.push({
            field: 'district.display_name',
            title: 'District',
            mutator: this.evDistMutator.bind(this),
        }) ;
    
        cols.push({
            field: 'start_date',
            title: 'Date'
        })
        
        this.table_ = new Tabulator(this.table_div_,
            {
                data:args[0],
                layout:"fitColumns",
                resizableColumnFit:true,
                columns:cols
            });
    
        this.table_.on("cellDblClick", this.loadBAEvent.bind(this)) ;
    }
}

window.scoutingAPI.receive("send-event-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-event-data', args) ; }) ;
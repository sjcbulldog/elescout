let loading = false ;
let topdiv = undefined ;
let frcevs = undefined ;
let evtable = undefined ;

function selectEventView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>SelectEvent</b>" ;
    div.id = "selectevent" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-event-data");
}

function loadBAEvent(key, desc) {
    if (loading) {
        return ;
    }

    loading = true ;

    statusShow() ;
    statusSetTitle("Loading event ...") ;
    statusSetText('') ;
    statusShowCloseButton(false) ;

    window.scoutingAPI.send("load-ba-event-data", key);
}

function evDistMutator(value, data, type, params, component) {
    return (value === null) ? '' : value ;
}

function updateSelectEvent(data) {
    frcevs = data[0] ;

    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    div.id = 'tablediv' ;

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
        mutator: evDistMutator,
    }) ;

    cols.push({
        field: 'start_date',
        title: 'Date'
    })
    
    var table = new Tabulator(div, 
        {
            data:frcevs,
            layout:"fitColumns",
            resizableColumnFit:true,
            columns:cols
        });
    table.id = 'table' ;

    table.on("cellDblClick", function(e, cell){
        let row = cell.getRow() ;
        let key = row.getData().key ;
        let desc = row.getData().name ;
        loadBAEvent(key, desc) ;
    });
}

window.scoutingAPI.receive("send-event-data", (args)=>updateSelectEvent(args)) ;
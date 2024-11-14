function matchDBView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Match data loading.  Please wait ....</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-match-db");
}


function mapMatchType(mtype) {
    let ret= -1 ;

    if (mtype === 'f') {
        ret = 3 ;
    }
    else if (mtype === 'sf') {
        ret = 2 ;
    }
    else {
        ret = 1 ;
    }

    return ret;
}


function updateMatchData(args) {
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    div.id = 'tablediv' ;

    let cols = [] ;
    for(let col of args.cols) {
        let coldesc = {
            field: col,
            title: col,
            headerMenu:headerMenu,
        } ;

        if (col === 'comp_level') {
            coldesc.sorter = sortCompFun;
        }
        cols.push(coldesc) ;
    }
    var table = new Tabulator(div, 
            {
                data:args.data,
                layout:"fitDataStretch",
                resizableColumnFit:true,
                columns:cols,
                movableColumns: true,
            });
   table.id = 'table' ;
}

window.scoutingAPI.receive("send-match-db", (args)=>updateMatchData(args[0])) ;
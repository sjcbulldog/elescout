let matchdbtable = undefined ;

function matchDBView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Match data loading.  Please wait ....</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-match-db");
}

function shutdownMatchDBView() {
    let data = [] ;
    for(let col of matchdbtable.getColumns()) {
        let info = {
            name: col.getField(),
            hidden: !col.isVisible(),
            width: col.getWidth(),
        }
        data.push(info) ;
    }
    window.scoutingAPI.send('send-match-col-config', data) ;
    matchdbtable = undefined ;
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
            headerVertical: false,
        } ;

        if (col === 'comp_level') {
            coldesc.sorter = sortCompFun;
        }
        cols.push(coldesc) ;
    }
    matchdbtable = new Tabulator(div, 
            {
                data:args.data,
                layout:"fitDataStretch",
                resizableColumnFit:true,
                columns:cols,
                movableColumns: true,
                initialSort: [{ column: "comp_level", dir: "asc" }],
            });
}

function configMatchCols(cols) {
    if (matchdbtable) {
        for (let col of cols) {
            let colobj = getTableColByID(matchdbtable, col.name) ;
            if (colobj) {
                if (col.hidden) {
                    colobj.hide() ;
                }
                colobj.setWidth(col.width) ;
            }
        }
    }
}

window.scoutingAPI.receive("send-match-db", (args)=>updateMatchData(args[0])) ;
window.scoutingAPI.receive("send-match-col-config", (args)=>configMatchCols(args[0])) ;
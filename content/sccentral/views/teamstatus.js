function teamStatus() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Team Status</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-team-status");
}

function doStatusFormat(cell) {
    let val = cell.getValue();
    let el = cell.getElement();

    if (val == 'Y') {
        el.style.backgroundColor = "RGB(173, 250, 170)";
    }
    else {
        el.style.backgroundColor = "RGB(217, 126, 126)";
    }

    return val;
}

function updateTeamStatus(data) {
    let hdrvert = false ;
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    div.id = 'tablediv' ;

    let cols = [] ;
    cols.push({
        field: 'number',
        title: 'Number',
        headerVertical: hdrvert,
    }) ;
    cols.push({
        field: 'tablet',
        title: 'Tablet',
        headerVertical: hdrvert,
    }) ;
    cols.push({
        field: 'status',
        title: 'Status',
        formatter: doStatusFormat,
        headerVertical: hdrvert,
    }) ;
    cols.push({
        field: 'teamname',
        title: 'Team Name',
        headerVertical: hdrvert,
    }) ;

    var table = new Tabulator(div, 
            {
                data:data,
                layout:"fitColumns",
                resizableColumnFit:true,
                columns:cols,
                movableColumns: true,
            });
   table.id = 'table' ;
}

window.scoutingAPI.receive("send-team-status", (args)=>updateTeamStatus(args[0])) ;
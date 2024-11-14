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
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    div.id = 'tablediv' ;

    let cols = [] ;
    cols.push({
        field: 'number',
        title: 'Number'
    }) ;
    cols.push({
        field: 'tablet',
        title: 'Tablet'
    }) ;
    cols.push({
        field: 'status',
        title: 'Status',
        formatter: doStatusFormat,
    }) ;
    cols.push({
        field: 'teamname',
        title: 'Team Name'
    }) ;

    var table = new Tabulator(div, 
            {
                data:data,
                layout:"fitDataStretch",
                resizableColumnFit:true,
                columns:cols,
                movableColumns: true,
            });
   table.id = 'table' ;
}

window.scoutingAPI.receive("send-team-status", (args)=>updateTeamStatus(args[0])) ;
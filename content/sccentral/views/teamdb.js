let teamdbtable = undefined ;

function teamDBView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Team data loading.  Please wait ....</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-team-db");
}

function shutdownTeamDBView() {
    let data = [] ;
    for(let col of teamdbtable.getColumns()) {
        let info = {
            name: col.getField(),
            hidden: !col.isVisible(),
            width: col.getWidth(),
        }
        data.push(info) ;
    }
    window.scoutingAPI.send('send-team-col-config', data) ;
    teamdbtable = undefined ;
}

function updateTeamData(args) {
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
        cols.push(coldesc) ;
    }

    teamdbtable = new Tabulator(div, 
        {
            data:args.data,
            layout:"fitDataStretch",
            resizableColumnFit:true,
            columns:cols,
            movableColumns: true,
        });
}


function configTeamCols(cols) {
    if (teamdbtable) {
        for (let col of cols) {
            let colobj = getTableColByID(teamdbtable, col.name) ;
            if (colobj) {
                if (col.hidden) {
                    colobj.hide() ;
                }
                colobj.setWidth(col.width) ;
            }
        }
    }
}

window.scoutingAPI.receive("send-team-db", (args)=>updateTeamData(args[0])) ;
window.scoutingAPI.receive("send-team-col-config", (args)=>configTeamCols(args[0])) ;
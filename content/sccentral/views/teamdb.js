let teamdbtable = undefined ;
let teamdbdata = undefined ;
let teamcolcfg = undefined ;

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
    let colcfg = {
        columns: data,
        frozenColumnCount: frozenColumnCount
    } ;

    window.scoutingAPI.send('send-team-col-config', colcfg) ;
    teamdbtable = undefined ;
}

function findTeamColCfg(name) {
    for(let one of teamcolcfg.columns) {
        if (one.name === name) {
            return one ;
        }
    }

    return undefined ;
}

function updateTeamData(args) {
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    div.id = 'tablediv' ;

    teamdbdata = args ;

    let count = frozenColumnCount ;
    let cols = [] ;
    for(let col of args.cols) {
        let one = findTeamColCfg(col) ;
        let coldesc = {
            field: col,
            title: col,
            headerMenu: headerMenu,
            headerVertical: false,
            frozen: (count-- > 0),
        } ;

        if (one.hidden) {
            coldesc['hidden'] = one.hidden ;
        }

        if (one.width) {
            coldesc['width'] = one.width ;
        }

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
    teamcolcfg = cols ;
    frozenColumnCount = cols.frozenColumnCount ;
}

window.scoutingAPI.receive("send-team-db", (args)=>updateTeamData(args[0])) ;
window.scoutingAPI.receive("send-team-col-config", (args)=>configTeamCols(args[0])) ;
function teamStatus() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Team Status</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-team-status");
}

function displayTeamStatus(table, data) {
    for(let one of data) {
        let t = table.addRow([one.number, one.status, one.tablet, one.teamname]);
        if (one.status === 'Y') {
            t.style.backgroundColor = '#92ed96' ;
        }
        else {
            t.style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }
    }
}

function teamStatusCompareFn(order, astr, bstr) {
    let ret = 0 ;

    if (order === 1) {
        let anum = parseInt(astr) ;
        let bnum = parseInt(bstr) ;

        if (this.sortOrder > 0) {
            if (anum < bnum) {
                ret = -1 ;
            }
            else if (anum > bnum) {
                ret = 1 ;
            }
        }
        else {
            if (anum < bnum) {
                ret = 1 ;
            }
            else if (anum > bnum) {
                ret = -1 ;
            }            
        }
    }
    else {
        if (this.sortOrder < 0) {
            ret = bstr.localeCompare(astr);
        } else {
            ret = astr.localeCompare(bstr);
        }        
    }

    return ret;
}

function updateTeamStatus(data) {
    let topdiv = document.createElement('div') ;
    topdiv.id = 'team-status-top-div' ;

    let sttable = new BwgTable(["Number", "Status", "Tablet", "Name"], { 
        prefix: "team-status", 
        sortable: true,
        sortfun: teamStatusCompareFn 
    }) ;
    topdiv.append(sttable.top) ;

    $("#rightcontent").empty() ;
    $("#rightcontent").append(topdiv) ;

    displayTeamStatus(sttable, data) ;
    sttable.setSortOrder(1) ;
}

window.scoutingAPI.receive("send-team-status", (args)=>updateTeamStatus(args[0])) ;
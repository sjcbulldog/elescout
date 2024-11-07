function matchStatus() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Match Status</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-match-status");
}

function displayMatchStatus(table, data) {
    for(let one of data) {
        let data = [] ;
        data.push(one.type) ;
        data.push(one.set) ;
        data.push(one.number) ;

        data.push(one.rteam1) ;
        data.push(one.rtablet1) ;
        data.push(one.rstatus1) ;

        data.push(one.rteam2) ;
        data.push(one.rtablet2) ;
        data.push(one.rstatus2) ;

        data.push(one.rteam3) ;
        data.push(one.rtablet3) ;
        data.push(one.rstatus3) ;   
        
        data.push(one.bteam1) ;
        data.push(one.btablet1) ;
        data.push(one.bstatus1) ;

        data.push(one.bteam2) ;
        data.push(one.btablet2) ;
        data.push(one.bstatus2) ;

        data.push(one.bteam3) ;
        data.push(one.btablet3) ;
        data.push(one.bstatus3) ; 
        
        let r = table.addRow(data) ;
        
        if (one.rstatus1 === 'Y') {
            r.childNodes[5].style.backgroundColor = '#92ed96' ;
        }
        else {
            r.childNodes[5].style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }

        if (one.rstatus2 === 'Y') {
            r.childNodes[8].style.backgroundColor = '#92ed96' ;
        }
        else {
            r.childNodes[8].style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }

        if (one.rstatus3 === 'Y') {
            r.childNodes[11].style.backgroundColor = '#92ed96' ;
        }
        else {
            r.childNodes[11].style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }

        if (one.bstatus1 === 'Y') {
            r.childNodes[14].style.backgroundColor = '#92ed96' ;
        }
        else {
            r.childNodes[14].style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }

        if (one.bstatus2 === 'Y') {
            r.childNodes[17].style.backgroundColor = '#92ed96' ;
        }
        else {
            r.childNodes[17].style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }

        if (one.bstatus3 === 'Y') {
            r.childNodes[20].style.backgroundColor = '#92ed96' ;
        }
        else {
            r.childNodes[20].style.backgroundColor = 'rgb(246, 149, 149)' ;            
        }        
    }
}

function mapMatchType(type) {
    let ret = 1 ;

    if (type === 'sf') {
        ret = 2 ;
    }
    else if (type === 'f') {
        ret = 3 ;
    }

    return ret;
}

function matchStatusCompareFn(order, a, b) {
    let ret = 0 ;
    let index = Math.abs(order) ;

    if (index === 1) {
        let at = mapMatchType(a[0]) ;
        let bt = mapMatchType(b[0]) ;
        let am = parseInt(a[2]) ;
        let bm = parseInt(b[2]) ;

        if (at !== bt) {
            if (order < 0) {
                ret = (bt < at) ? -1 : 1 ;
            }
            else {
                ret = (bt < at) ? 1 : -1 ;
            }
        }
        else {
            if (order < 0) {
                ret = (bm < am) ? -1 : 1 ;
            }
            else {
                ret = (bm < am) ? 1 : -1 ;
            }
        }
    }
    else {
        let astr = a[index - 1] ;
        let bstr = b[index - 1] ;

        if (order < 0) {
            ret = bstr.localeCompare(astr);
        } else {
            ret = astr.localeCompare(bstr);
        }
    }
    return ret;
}

function updateMatchStatus(data) {
    let topdiv = document.createElement('div') ;
    topdiv.id = 'match-status-top-div' ;

    let cols = [] ;
    cols.push("Type") ;
    cols.push("Set") ;
    cols.push("Match") ;

    cols.push("Red Team 1") ;
    cols.push("Red Tablet 1") ;
    cols.push("Red Status 1") ;
    cols.push("Red Team 2") ;
    cols.push("Red Tablet 2") ;
    cols.push("Red Status 2") ;
    cols.push("Red Team 3") ;
    cols.push("Red Tablet 3") ;
    cols.push("Red Status 3") ;
    cols.push("Blue Team 1") ;
    cols.push("Blue Tablet 1") ;
    cols.push("Blue Status 1") ;
    cols.push("Blue Team 2") ;
    cols.push("Blue Tablet 2") ;
    cols.push("Blue Status 2") ;
    cols.push("Blue Team 3") ;
    cols.push("Blue Tablet 3") ;
    cols.push("Blue Status 3") ;

    let sttable = new BwgTable(cols, { 
        prefix: "match-status", 
        sortable: true,
        sortrowfun: matchStatusCompareFn 
    }) ;
    topdiv.append(sttable.top) ;

    $("#rightcontent").empty() ;
    $("#rightcontent").append(topdiv) ;

    displayMatchStatus(sttable, data) ;
    sttable.setSortOrder(1) ;
}

window.scoutingAPI.receive("send-match-status", (args)=>updateMatchStatus(args[0])) ;
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

    window.scoutingAPI.send("get-select-event-data");
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

function displayEvents(table)
{
    let tabrow = 1 ;
    for(let frcev of frcevs) {

        let data = [] ;
        data.push(frcev.evkey) ;

        let distname = "" ;
        if (frcev.district) {
            distname = frcev.district.display_name;
        }
        data.push(distname) ;

        data.push(frcev.start_date) ;
        data.push(frcev.desc) ;

        let row = bwgTableAddRow(evtable, data) ;
        if ((tabrow % 2) == 0) {
            row.className = "select-event-row-even"
        }
        else {
            row.className = "select-event-row-odd"
        }
        row.onclick = () => { loadBAEvent(frcev.evkey, frcev.desc);}
        
        tabrow++ ;
    }
}

function dateCompareFn(a, b) {
    let adate = Date.parse(a.start_date) ;
    let bdate = Date.parse(b.start_date) ;

    if (adate < bdate) {
        return -1 ;
    }
    else if (adate > bdate) {
        return 1;
    }

    return a.desc.localeCompare(b.desc) ;
}

function dateSort() {
    frcevs.sort(dateCompareFn) ;
}

function distCompareFn(a, b) {
    let da = "" ;
    let db = "" ;

    if (a && a.district) {
        da = a.district.display_name ;
    }

    if (b && b.district) {
        db = b.district.display_name ;
    }

    let ret = da.localeCompare(db) ;

    if (ret != 0) {
        return ret ;
    }

    return a.desc.localeCompare(b.desc) ;
}

function distSort() {
    frcevs.sort(distCompareFn) ;
}

function nameSort() {
    frcevs.sort((a, b) => { 
        return a.desc.localeCompare(b.desc) ;
    }) ;
}

function updateSelectEvent(data) {
    frcevs = data ;
    
    let topdiv = document.createElement('div') ;
    topdiv.id = 'select-event-top-div' ;

    evtable = bwgTableCreate(["Key", "District", "Date", "Name"], "select-event-table") ;
    topdiv.append(bwgTableGetTableElem(evtable)) ;

    $("#rightcontent").empty() ;
    $("#rightcontent").append(topdiv) ;

    displayEvents(evtable) ;

    bwgTableSetSortOrder(0) ;
}

window.scoutingAPI.receive("select-event", (args)=>updateSelectEvent(args)) ;
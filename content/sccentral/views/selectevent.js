let loading = false ;
let statuswin = false ;
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
    if (!statuswin) {
        let parent = $("#select-event-main" )
        statusCreate(parent) ;
        statuswin = true ;
    }

    statusShow() ;
    statusSetTitle("Loading event ...") ;
    statusSetText('') ;
    statusShowCloseButton(false) ;

    window.scoutingAPI.send("load-ba-event-data", key);
}

function displayEvents(table)
{
    $("#event-table").empty() ;

    let tr = document.createElement('tr') ;
    table.append(tr) ;

    let th = document.createElement('th') ;
    th.innerText = 'Key' ;
    th.class = 'select-event-header' ;
    tr.append(th) ;

    th = document.createElement('th') ;
    th.innerText = 'District' ;
    th.class = 'select-event-header' ;    
    tr.append(th) ;    

    th = document.createElement('th') ;
    th.innerText = 'Date' ;
    th.class = 'select-event-header' ;    
    tr.append(th) ;

    th = document.createElement('th') ;
    th.innerText = 'Name' ;
    th.class = 'select-event-header' ;    
    tr.append(th) ;

    let tabrow = 1 ;
    for(let frcev of frcevs) {
        let tr = document.createElement('tr') ;
        if ((tabrow % 2) == 0) {
            tr.id = "select-event-row-even"
        }
        else {
            tr.id = "select-event-row-odd"
        }
        table.append(tr) ;
    
        let td = document.createElement('td') ;
        td.innerText = frcev.evkey ;
        td.id = "select-selectable" ;
        td.onclick = () => { loadBAEvent(frcev.evkey, frcev.desc);}
        tr.append(td) ;

        td = document.createElement('td') ;
        td.id = 'select_event_data_cell' ;
        if (frcev.district) {
            td.innerText = frcev.district.display_name;
        }
        else {
            td.innerText = '' ;
        }
        tr.append(td) ;    
    
        td = document.createElement('td') ;
        td.innerText = frcev.start_date ;
        tr.append(td) ;  
    
        td = document.createElement('td') ;
        td.innerText = frcev.desc ;
        td.id = "select-selectable" ;
        td.onclick = () => { loadBAEvent(frcev.evkey, frcev.desc);}
        tr.append(td) ;        

        tabrow++ ;
    }
}

function selectEventRadioChanged(event) {
    let target = event.currentTarget.value ;
    if (target === "date") {
        dateSort() ;
    }
    else if (target === "name") {
        nameSort() ;
    }
    else if (target === "district") {
        distSort() ;
    }

    displayEvents(evtable) ;
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

    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.id = "select-event-main" ;

    let sort = document.createElement("div") ;
    sort.id = "select-event-sort-row" ;
    div.append(sort) ;

    let stitle = document.createElement("p") ;
    stitle.innerText = "Sort Order: " ;
    sort.append(stitle) ;

    let datesort = document.createElement("input") ;
    datesort.name = "sortorder" ;
    datesort.value = "date" ;
    datesort.type = "radio" ;
    datesort.it = "datesort" ;
    datesort.class = "select-event-sort-radio" ;
    datesort.onchange = selectEventRadioChanged;
    sort.append(datesort) ;

    let title = document.createElement("p") ;
    title.innerText = "Date" ;
    sort.append(title) ;    

    let namesort = document.createElement("input") ;
    namesort.name = "sortorder" ;
    namesort.value = "name" ;
    namesort.type = "radio" ;
    namesort.id = "namesort ;"
    namesort.class = "select-event-sort-radio" ;
    namesort.onchange = selectEventRadioChanged;
    sort.append(namesort) ;

    title = document.createElement("p") ;
    title.innerText = "Name" ;
    sort.append(title) ;    

    let distsort = document.createElement("input") ;
    distsort.name = "sortorder" ;
    distsort.value = "district" ;
    distsort.type = "radio" ;
    distsort.id = "distsort" ;
    distsort.class = "select-event-sort-radio" ;    
    distsort.onchange = selectEventRadioChanged ;
    sort.append(distsort) ;

    dateSort() ;
    datesort.checked = true ;

    title = document.createElement("p") ;
    title.innerText = "District" ;
    sort.append(title) ;

    evtable = document.createElement('table') ;
    evtable.id = "event-table" ;
    div.append(evtable) ;
 
    displayEvents(evtable) ;

    $("#rightcontent").append(div) ;    
}

window.scoutingAPI.receive("select-event", (args)=>updateSelectEvent(args)) ;
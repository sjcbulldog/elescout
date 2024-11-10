const minRequiredNumberTeams = 24 ;

function selectTabletView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Info</b>" ;
    div.id = "select-tablet" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-tablet-data");
}

function selectTablet(event) {
    window.scoutingAPI.send("set-tablet-name-purpose", 
        { 'name' : event.currentTarget.tabletName, 'purpose' : event.currentTarget.tabletPurpose}) ;
}

function updateSelectTabletView(tablets) {
    let row ;

    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.id = "select_tablet_main" ;

    let table = document.createElement("table") ;
    table.id = "select_tablet_table" ;
    div.append(table) ;

    let hdr = document.createElement('tr') ;
    hdr.className = "select_tablet_header_row" ;

    let hdr1 = document.createElement('th') ;    
    hdr1.innerText = 'Tablet Name' ;
    hdr.appendChild(hdr1) ;

    let hdr2 = document.createElement('th') ;    
    hdr2.innerText = 'Purpose' ;
    hdr.appendChild(hdr2) ;
    
    table.appendChild(hdr) ;

    for(let tablet of tablets) {
        let one = document.createElement('tr') ;
        one.className = "select_tablet_row" ;

        let cell1 = document.createElement('td') ;
        cell1.innerText = tablet.name ;
        cell1.tabletName = tablet.name ;
        cell1.tabletPurpose = tablet.purpose ;
        cell1.ondblclick = selectTablet ;
        one.appendChild(cell1) ;

        let cell2 = document.createElement('td') ;
        cell2.innerText = tablet.purpose ;
        cell2.tabletName = tablet.name ;
        cell2.tabletPurpose = tablet.purpose ;
        cell2.ondblclick = selectTablet ;
        one.appendChild(cell2) ;

        table.appendChild(one) ;
    }    

    let last = document.createElement('tr') ;
    let lastcell = document.createElement('td') ;
    lastcell.colSpan = 2 ;
    lastcell.innerText = 'Double click tablet to select' ;
    lastcell.className = 'select_tablet_instructions' ;
    table.appendChild(lastcell) ;

    $("#rightcontent").append(div) ;
}

window.scoutingAPI.receive("send-tablet-data", (args)=>updateSelectTabletView(args[0])) ;

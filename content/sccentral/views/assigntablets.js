let frctablets ;
let availholder ;
let matchholder ;
let teamholder ;

const matchName = "match" ;
const teamName = "team" ;

function assignTabletView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Assign Tablets</b>" ;
    div.id = "assign-tablets" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-tablet-data");
}

function doesTabletExist(name) {
    if (!frctablets)
        return false ;

    for(let tab of frctablets) {
        if (tab.name === name)
            return true ;
    }

    return false ;
}

function findNewTabletName() {
    let num = 1 ;
    let name ;

    while (true) {
        name = "New Tablet " + num ;
        if (!doesTabletExist(name))
            break ;
        num++ ;
    }

    return name ;
}

function addTablet() {
    let tabdata = {
        name: findNewTabletName(),
        purpose: undefined
    }

    if (!frctablets) {
        frctablets = [] ;
    }

    frctablets.push(tabdata) ;
    placeTablets() ;
}

function createTabletsAvailable() {
    let div = document.createElement('div') ;

    let span = document.createElement('span');
    span.id = "assign-tablets-available-span" ;
    span.innerText = 'Available' ;
    div.append(span) ;

    availholder = document.createElement('div') ;
    availholder.id = "assign-tablets-available-holder" ;
    div.append(availholder) ;

    return div ;
}

function createMatchTablets() {
    let div = document.createElement('div') ;

    let span = document.createElement('span');
    span.id = "assign-tablets-match-span" ;    
    span.innerText = 'Matches' ;
    div.append(span) ;

    matchholder = document.createElement('div') ;
    matchholder.id = "assign-tablets-match-holder" ;
    matchholder.ondragover = allowDrop ;
    matchholder.ondrop = dropmatch ;
    div.append(matchholder) ;

    return div ;
}

function createTeamTablets() {
    let div = document.createElement('div') ;

    let span = document.createElement('span');
    span.id = "assign-tablets-team-span" ;       
    span.innerText = 'Teams' ;
    div.append(span) ;

    teamholder = document.createElement('div') ;
    teamholder.id = "assign-tablets-team-holder" ;
    teamholder.ondragover = allowDrop ;
    teamholder.ondrop = dropteam ;
    div.append(teamholder) ;

    return div ;
}

function allowDrop(ev) {
    ev.preventDefault();
}
  
function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}
  
function dropmatch(ev) {
    ev.preventDefault();
    let tabname = ev.dataTransfer.getData("text");
    setTabletToType(tabname, matchName) ;
}

function setTabletToType(tablet, type) {
    if (frctablets) {
        for(let i = 0 ; i < frctablets.length ; i++) {
            if (frctablets[i].name === tablet) {
                frctablets[i].purpose = type ;
                break ;
            }
        }
        placeTablets() ;        
    }
}

function dropteam(ev) {
    ev.preventDefault();
    let tabname = ev.dataTransfer.getData("text");
    setTabletToType(tabname, matchName) ;
}

function placeTablets() {
    $("#assign-tablets-available-holder").empty() ;
    $("#assign-tablets-match-holder").empty() ;
    $("#assign-tablets-team-holder").empty() ;

    for(let tablet of frctablets) {
        let p = document.createElement("p") ;
        p.id = tablet.name ;
        p.innerText = tablet.name ;
        p.className = "assign-tablets-list-item";

        if (tablet.purpose === "team") {
            $("#assign-tablets-team-holder").append(p);
        }
        else if (tablet.purpose === "match") {
            $("#assign-tablets-match-holder").append(p); 
        }
        else {
            p.draggable = true ;
            p.ondrag = drag;
            $("#assign-tablets-available-holder").append(p); 
        }
    }
}

function updateTablets(data) {
    frctablets = data ;

    let topdiv = document.createElement('div') ;
    topdiv.id = "assign-tablets-main-top-div" ;

    let tabletdiv = document.createElement('div') ;
    tabletdiv.id = "assign-tablets-tablet-div" ;
    topdiv.append(tabletdiv) ;

    let availbletablets = createTabletsAvailable() ;
    availbletablets.id = "assign-tablets-available" ;
    tabletdiv.append(availbletablets) ;

    let matchtablets = createMatchTablets() ;
    matchtablets.id = "assign-tablets-match" ;
    tabletdiv.append(matchtablets) ;

    let teamtablets = createTeamTablets() ;
    teamtablets.id = "assign-tablets-team" ;
    tabletdiv.append(teamtablets) ;

    let hr = document.createElement('hr') ;
    topdiv.append(hr) ;

    let buttondiv = document.createElement('div') ;
    buttondiv.id = "assign-tablets-buttons" ;
    topdiv.append(buttondiv) ;

    let add = document.createElement('button') ;
    add.innerText = 'Add Tablet' ;
    buttondiv.append(add) ;
    add.onclick = addTablet;
    
    let save = document.createElement('button') ;
    save.innerText = 'Save' ;
    buttondiv.append(save) ;

    let discard = document.createElement('button') ;
    discard.innerText = 'Discard' ;
    buttondiv.append(discard) ;

    $("#rightcontent").empty() ;
    $("#rightcontent").append(topdiv) ;
}

window.scoutingAPI.receive("tablet-data", (args)=>updateTablets(args)) ;
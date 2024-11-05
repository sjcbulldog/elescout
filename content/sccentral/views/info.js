const minRequiredNumberTeams = 24 ;

function infoView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Info</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-info-data");
}

function addlocation(info) {
    let row = document.createElement('tr') ;
    let loc = document.createElement('td') ;
    loc.id = "info_location"
    loc.innerText = info.location_ ;    
    loc.colSpan = 3 ;
    row.append(loc) ;

    return row ;
}

function addname(info) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Name:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (info.name_ ? info.name_ : 'NONE') ;
    row.append(value) ;

    return row ;
}

function addbakey(info) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Blue Alliance Key:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (info.bakey_ ? info.bakey_ : 'NONE') ;
    row.append(value) ;

    if (!info.teams_ && !info.matches_ && !info.bakey_) {
        let cell = document.createElement('td') ;
        cell.className = "info-table-cell" ;
        row.append(cell) ;

        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Load Event' ;
        button.onclick = () => { updateMainWindow("selevent")} ;
    }

    return row ;
}

function addteamform(info) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Team Form:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td');
    value.innerHTML = (info.teamform_ ? info.teamform_ : 'NONE') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!info.locked_) {
        let button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Select Team Form' ;
        button.onclick = () => { window.scoutingAPI.send('execute-command', 'select-team-form'); } ;
    }

    cell = document.createElement('td') ;
    if (info.teamform_) {
        cell.innerHTML = "&check;"
        cell.style.color = "green" ;
    }
    else {
        cell.innerHTML = "&cross;"
        cell.style.color = "red" ;
    }
    row.append(cell) ;

    return row ;
}

function addmatchform(info) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Match Form:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td');
    value.innerHTML = (info.matchform_ ? info.matchform_ : 'NONE') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!info.locked_) {
    let button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Select Match Form' ;
        button.onclick = () => { window.scoutingAPI.send('execute-command', 'select-match-form')} ;
    }

    cell = document.createElement('td') ;
    if (info.matchform_) {
        cell.innerHTML = "&check;"
        cell.style.color = "green" ;
    }
    else {
        cell.innerHTML = "&cross;"
        cell.style.color = "red" ;
    }
    row.append(cell) ;    

    return row ;
}

function addtablets(info) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Tablets:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.innerHTML = (info.tablets_ ? info.tablets_.length : 'NOT ASSIGNED') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!info.locked_) {
        let button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Assign Tablets' ;
        button.onclick = () => { window.scoutingAPI.send('execute-command', 'assign-tablets')} ;
    }

    cell = document.createElement('td') ;

    if (info.tablets_valid_) {
        cell.innerHTML = "&check;"
        cell.style.color = "green" ;
    }
    else {
        cell.innerHTML = "&cross;"
        cell.style.color = "red" ;
    }
    row.append(cell) ;      

    return row ;
}

function addteams(info) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Teams:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.innerHTML = (info.teams_ ? info.teams_.length : 'No Teams') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!info.bakey_ && !info.locked_) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Edit Teams' ;
        button.onclick = () => { window.scoutingAPI.send('execute-command', 'edit-teams')} ;
    }
    
    cell = document.createElement('td') ;
    if (info.teams_ && info.teams_.length >= minRequiredNumberTeams) {
        cell.innerHTML = "&check;"
        cell.style.color = "green" ;
    }
    else {
        cell.innerHTML = "&cross;"
        cell.style.color = "red" ;
    }
    row.append(cell) ;   

    return row ;
}

function addmatches(info) {
    let row = document.createElement('tr') ;
    
    let label = document.createElement('td') ;
    label.innerHTML = 'Matches:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (info.matches_ ? info.matches_.length : 'No Matches') ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!info.bakey_ && info.teams_ && info.teams_.length >= minRequiredNumberTeams && !info.locked_) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Edit Matches' ;
        button.onclick = () => { window.scoutingAPI.send('execute-command', 'edit-matches')} ;
    }

    cell = document.createElement('td') ;
    if (info.matches_) {
        cell.innerHTML = "&check;"
        cell.style.color = "green" ;
    }
    else {
        cell.innerHTML = "&cross;"
        cell.style.color = "red" ;
    }
    row.append(cell) ;     

    return row ;
}

function addLocked(info) {
    let row = document.createElement('tr') ;
    
    let label = document.createElement('td') ;
    label.innerHTML = 'Locked:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (info.locked_ ? "Locked" : "Unlocked") ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (info.matches_ && info.teams_ && info.teamform_ && info.matchform_ && !info.locked_) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Lock Event' ;
        button.onclick = () => { 
            window.scoutingAPI.send('execute-command', 'lock-event')
        } ;
    }

    cell = document.createElement('td') ;
    if (info.locked_) {
        cell.innerHTML = "&check;"
        cell.style.color = "green" ;
    }
    else {
        cell.innerHTML = "&cross;"
        cell.style.color = "red" ;
    }
    row.append(cell) ;     

    return row ;
}

function updateInfoView(info) {
    let row ;

    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.id = "info_main" ;

    let table = document.createElement("table") ;
    table.id = "info_table" ;
    div.append(table) ;

    row = addlocation(info) ;
    row.id = "info_location" ;
    table.append(row) ;

    row = addname(info) ;
    table.append(row) ;

    row = addbakey(info) ;
    table.append(row) ;

    row = addteamform(info) ;
    table.append(row) ;

    row = addmatchform(info) ;
    table.append(row) ;

    row = addtablets(info) ;
    table.append(row) ;

    row = addteams(info) ;
    table.append(row) ;

    row = addmatches(info) ;
    table.append(row) ;

    row = addLocked(info) ;
    table.append(row) ;
    
    $("#rightcontent").append(div) ;
}

window.scoutingAPI.receive("send-info-data", (args)=>updateInfoView(args[0])) ;

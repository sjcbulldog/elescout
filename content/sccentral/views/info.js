function infoView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Info</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-info-data");
}

function addlocation(location) {
    let row = document.createElement('tr') ;
    let loc = document.createElement('td') ;
    loc.id = "info_location"
    loc.innerText = location ;    
    loc.colSpan = 3 ;
    row.append(loc) ;

    return row ;
}

function addname(evname) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Name:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (evname ? evname : 'NONE') ;
    row.append(value) ;

    return row ;
}

function addbakey(bakey, teams, matches) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Blue Alliance Key:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (bakey ? bakey : 'NONE') ;
    row.append(value) ;

    if (!teams && !matches && !bakey) {
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

function addteamform(teamform) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Team Form:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td');
    value.innerHTML = (teamform ? teamform : 'NONE') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    let button = document.createElement('button') ;
    cell.append(button) ;

    button.innerText = 'Select Team Form' ;
    button.onclick = () => { window.scoutingAPI.send('execute-command', 'select-team-form'); } ;

    cell = document.createElement('td') ;
    if (teamform) {
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

function addmatchform(matchform) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Match Form:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td');
    value.innerHTML = (matchform ? matchform : 'NONE') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    let button = document.createElement('button') ;
    cell.append(button) ;

    button.innerText = 'Select Match Form' ;
    button.onclick = () => { window.scoutingAPI.send('execute-command', 'select-match-form')} ;

    cell = document.createElement('td') ;
    if (matchform) {
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

function addtablets(tablets, tabletsvalid) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Tablets:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.innerHTML = (tablets ? tablets.length : 'NOT ASSIGNED') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    let button = document.createElement('button') ;
    cell.append(button) ;

    button.innerText = 'Assign Tablets' ;
    button.onclick = () => { window.scoutingAPI.send('execute-command', 'assign-tablets')} ;

    cell = document.createElement('td') ;

    if (tabletsvalid) {
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

function addteams(teams, bakey) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Teams:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.innerHTML = (teams ? teams.length : 'No Teams') ;
    value.className = "info-table-cell" ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!bakey) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Edit Teams' ;
        button.click = () => { window.scoutingAPI.send('execute-command', 'edit-teams')} ;
    }
    
    cell = document.createElement('td') ;
    if (teams) {
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

function addmatches(matches, bakey) {
    let row = document.createElement('tr') ;
    
    let label = document.createElement('td') ;
    label.innerHTML = 'Matches:  ' ;
    label.className = "info-table-cell" ;
    row.append(label) ;

    let value = document.createElement('td')
    value.className = "info-table-cell" ;
    value.innerHTML = (matches ? matches.length : 'No Matches') ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    cell.className = "info-table-cell" ;
    row.append(cell) ;

    if (!bakey) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Edit Matches' ;
        button.click = () => { window.scoutingAPI.send('execute-command', 'edit-matches')} ;
    }

    cell = document.createElement('td') ;
    if (matches) {
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

    row = addlocation(info.location_) ;
    row.id = "info_location" ;
    table.append(row) ;

    row = addname(info.name_) ;
    table.append(row) ;

    row = addbakey(info.bakey_, info.teams_, info.matches_) ;
    table.append(row) ;

    row = addteamform(info.teamform_) ;
    table.append(row) ;

    row = addmatchform(info.matchform_) ;
    table.append(row) ;

    row = addtablets(info.tablets_, info.tablets_valid_) ;
    table.append(row) ;

    row = addteams(info.teams_, info.bakey_) ;
    table.append(row) ;

    row = addmatches(info.matches_, info.bakey_) ;
    table.append(row) ;
    
    $("#rightcontent").append(div) ;
}

window.scoutingAPI.receive("update-info", (args)=>updateInfoView(args)) ;

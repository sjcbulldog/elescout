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

function addbaykey(bakey, teams, matches) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Blue Alliance Key:  ' ;
    row.append(label) ;

    let value = document.createElement('div')
    value.innerHTML = (bakey ? bakey : 'NONE') ;

    row.append(label) ;
    row.append(value) ;

    if (!teams && !matches && !bakey) {
        let cell = document.createElement('td') ;
        row.append(cell) ;

        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Load Event' ;
        button.click = () => { window.scoutingAPI.send('execute-command', 'load-ba-event')} ;
    }

    return row ;
}

function addteamform(teamform) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Team Form:  ' ;
    row.append(label) ;

    let value = document.createElement('div')
    value.innerHTML = (teamform ? teamform : 'NONE') ;

    row.append(label) ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    row.append(cell) ;

    let  button = document.createElement('button') ;
    cell.append(button) ;

    button.innerText = 'Select Team Form' ;
    button.click = () => { window.scoutingAPI.send('execute-command', 'select-team-form')} ;

    return row ;
}

function addmatchform(matchform) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Match Form:  ' ;
    row.append(label) ;

    let value = document.createElement('div')
    value.innerHTML = (matchform ? matchform : 'NONE') ;

    row.append(label) ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    row.append(cell) ;

    let  button = document.createElement('button') ;
    cell.append(button) ;

    button.innerText = 'Select Match Form' ;
    button.click = () => { window.scoutingAPI.send('execute-command', 'select-match-form')} ;

    return row ;
}

function addtablets(tablets) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Tablets:  ' ;
    row.append(label) ;

    let value = document.createElement('div')
    value.innerHTML = (tablets ? tablets.length : 'NOT ASSIGNED') ;

    row.append(label) ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    row.append(cell) ;

    let  button = document.createElement('button') ;
    cell.append(button) ;

    button.innerText = 'Assign Tablets' ;
    button.click = () => { window.scoutingAPI.send('execute-command', 'assign-tablets')} ;

    return row ;
}

function addteams(teams, bakey) {
    let row = document.createElement('tr') ;

    let label = document.createElement('td') ;
    label.innerHTML = 'Teams:  ' ;
    row.append(label) ;

    let value = document.createElement('div')
    value.innerHTML = (teams ? teams.length : 'No Teams') ;

    row.append(label) ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    row.append(cell) ;

    if (!bakey) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Edit Teams' ;
        button.click = () => { window.scoutingAPI.send('execute-command', 'edit-teams')} ;
    }

    return row ;
}

function addmatches(matches, bakey) {
    let row = document.createElement('tr') ;
    
    let label = document.createElement('td') ;
    label.innerHTML = 'Matches:  ' ;
    row.append(label) ;

    let value = document.createElement('div')
    value.innerHTML = (matches ? matches.length : 'No Matches') ;

    row.append(label) ;
    row.append(value) ;

    let cell = document.createElement('td') ;
    row.append(cell) ;

    if (!bakey) {
        let  button = document.createElement('button') ;
        cell.append(button) ;

        button.innerText = 'Edit Matches' ;
        button.click = () => { window.scoutingAPI.send('execute-command', 'edit-matches')} ;
    }

    return row ;
}

function updateInfoView(info) {
    let row ;

    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.id = "info_main" ;

    let table = document.createElement("table") ;
    div.append(table) ;

    row = addlocation(info.location_) ;
    table.append(row) ;

    row = addbaykey(info.bakey_, info.teams_, info.matches_) ;
    table.append(row) ;

    row = addteamform(info.teamform_) ;
    table.append(row) ;

    row = addmatchform(info.matchform_) ;
    table.append(row) ;

    row = addtablets(info.tablets_) ;
    table.append(row) ;

    row = addteams(info.teams_, info.bakey_) ;
    table.append(row) ;

    row = addmatches(info.matches_, info.bakey_) ;
    table.append(row) ;
    
    $("#rightcontent").append(div) ;
}

window.scoutingAPI.receive("update-info", (args)=>updateInfoView(args)) ;

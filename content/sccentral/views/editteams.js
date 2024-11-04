let frcteams = undefined ;
let teamtable = undefined ;

function editTeamsView() {
    $('#rightcontent').empty() ;
    let div = document.createElement('div') ;
    div.innerHTML = '<b>Assign Tablets</b>' ;
    div.id = 'assign-tablets' ;
    $('#rightcontent').append(div) ;

    window.scoutingAPI.send('get-team-data');
}

function populateTeams() {
    if (frcteams) {
        for(let t of frcteams) {
            addTeam(t.number_, t.nickname_) ;
        }
    }
}

function addTeam(num, name) {
    let cnt = teamtable.getRowCount() ;

    teamtable.addRow([cnt + 1, num, name]) ;
    teamtable.refresh() ;
}

function addNewTeam() {
    addTeam(0, "New Team") ;
}

function getDataFromTable() {
    let ret = [] ;
    let count = teamtable.getRowCount() ;
    for(let rownum = 0 ; rownum < count ; rownum++) {
        let data = teamtable.getRowData(rownum) ;
        ret.push({ number_: data[1], nickname_: data[2] }) ;
    }

    return ret;
}

function editTeamsReportError(err) {
    statusShow() ;

    statusSetTitle("Error With Teams Data")

    let text = statusGetText() ;
    if (text) {
        text = text + '\n' + err ;
    }
    else {
        text = err ;
    }
    statusSetText(text) ;
}

function checkTeamsData(data) {
    let ret = true ;
    let seen = [] ;

    statusSetText("") ;

    for(let i = 0 ; i < data.length ; i++) {
        let team = data[i] ;
        let num = parseFloat(team.number_) ;

        if (Number.isNaN(num)) {
            editTeamsReportError('the team number in row ' + (i + 1) + ' is not an integer') ;
            ret = false;
        }
        else if (num <= 0) {
            editTeamsReportError('the team number in row ' + (i + 1) + ' is not greater than zero') ;            
            ret = false;
        }
        else if (!Number.isInteger(num)) {
            editTeamsReportError('the team number in row ' + (i + 1) + '  is not an integer') ;     
            ret = false;
        }
        else if (seen.includes(num)) {
            editTeamsReportError('the team number ' + num + ' is found for multiple rows') ;
            ret = false ;
        }
        else {
            seen.push(num) ;
        }
    }

    return ret;
}

function saveTeamData() {
    let data = getDataFromTable() ;
    if (checkTeamsData(data)) {
        window.scoutingAPI.send('set-team-data', data) ;
    }
    else {
        statusShowCloseButton(true) ;
    }
}

function importTeams() {
    window.scoutingAPI.send('execute-command', 'import-teams') ;
}

function editTeamCreateButtonBar() {
    let buttondiv = document.createElement('div') ;
    buttondiv.id = 'edit-teams-buttons' ;

    let add = document.createElement('button') ;
    add.innerText = 'Add Team' ;
    buttondiv.append(add) ;
    add.onclick = addNewTeam;

    let impbut = document.createElement('button') ;
    impbut.innerText = 'Import Teams' ;
    buttondiv.append(impbut) ;
    impbut.onclick = importTeams;
    
    let save = document.createElement('button') ;
    save.innerText = 'Save' ;
    save.onclick = saveTeamData ;
    buttondiv.append(save) ;

    let discard = document.createElement('button') ;
    discard.innerText = 'Cancel' ;
    discard.onclick = () => { updateMainWindow('info') ; }
    buttondiv.append(discard) ;

    return buttondiv ;
}

function updateTeamsView(info) {
    $('#rightcontent').empty() ;

    let div = document.createElement('div') ;
    div.id = 'edit-teams';

    teamtable = new BwgTable(['Row', 'Number', 'Nick Name'], { prefix: 'create-teams', editable: [false, true, true]} ) ;
    div.append(teamtable.top) ;

    let hr = document.createElement('hr') ;
    div.append(hr) ;

    let buttonbar = editTeamCreateButtonBar() ;
    div.append(buttonbar) ;

    frcteams = info ;
    if (info) {
        populateTeams() ;
    }

    $('#rightcontent').append(div) ;    
}

window.scoutingAPI.receive('send-team-data', (args)=>updateTeamsView(args[0])) ;
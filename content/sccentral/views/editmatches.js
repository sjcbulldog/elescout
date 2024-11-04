let frcmatches = undefined ;
let checkteams = undefined ;
let matchtable = undefined ;

function editMatchView() {
    $('#rightcontent').empty() ;
    let div = document.createElement('div') ;
    div.innerHTML = '<b>Assign Matches</b>' ;
    div.id = 'assign-matches' ;
    $('#rightcontent').append(div) ;

    window.scoutingAPI.send('get-match-data');
}

function populateMatches() {
    if (frcmatches) {
        for(let t of frcmatches) {
            addMatch(t.type_, t.number_, t.red_, t.blue_) ;
        }
    }
}

function addMatch(mtype, mnum, red, blue) {
    let cnt = matchtable.getRowCount() ;

    matchtable.addRow([cnt + 1, mtype, mnum, red[0], red[1], red[2], blue[0], blue[1], blue[2]]) ;
    matchtable.refresh() ;
}

function addNewMatch() {
    addMatch('?', 0, [0, 0, 0], [0, 0, 0]) ;
}

function getMatchDataFromTable() {
    let ret = [] ;
    let count = matchtable.getRowCount() ;
    for(let rownum = 0 ; rownum < count ; rownum++) {
        let data = matchtable.getRowData(rownum) ;
        ret.push({ 
            type_: data[1],
            number_ : data[2],
            red_ : [data[3], data[4], data[5]], 
            blue_: [data[6], data[7], data[8]]
        }) ;
    }

    return ret;
}

function editMatchReportError(err) {
    statusShow() ;

    statusSetTitle("Error With Match Data")

    let text = statusGetText() ;
    if (text) {
        text = text + '\n' + err ;
    }
    else {
        text = err ;
    }
    statusSetText(text) ;
}

function checkValidTeam(value, row, which) {
    let ret = true ;
    let num = parseFloat(value) ;

    if (Number.isNaN(num)) {
        editTeamsReportError('the team number in row ' + row + ', location ' + which + ' is not a valid integer') ;
        ret = false;
    }
    else if (num <= 0) {
        editTeamsReportError('the team number in row ' + row + ', location ' + which + ' is not greater than zero') ;        
        ret = false ;
    }
    else if (!Number.isInteger(num)) {
        editTeamsReportError('the team number in row ' + row + ', location ' + which + ' is a number but not an integer') ;
        ret = false ;
    }

    if (ret) {
        ret = false ;
        for(let team of checkteams) {
            if (num == team.number_) {
                ret = true ;
                break ;
            }
        }

        if (!ret) {
            editTeamsReportError('the team number in row ' + row + ', location ' + which + ' is not a valid team for this event') ;            
        }
    }

    return ret;
}

function checkMatchNumber(value, row) {
    let ret = true ;

    let num = parseFloat(value) ;
    if (Number.isNaN(num)) {
        editTeamsReportError('the match number in row ' + row + ' is not a valid integer') ;
        ret = false;
    }
    else if (num <= 0) {
        editTeamsReportError('the match number in row ' + row + ' is not greater than zero') ;        
        ret = false ;
    }
    else if (!Number.isInteger(num)) {
        editTeamsReportError('the match number in row ' + row + ' is a number but not an integer') ;
        ret = false ;
    }

    return ret;
}

function checkMatchesData(matches) {
    let ret = true ;
    let seen = [] ;

    statusSetText("") ;

    for(let i = 0 ; i < matches.length ; i++) {     
        let data = matches[i];   
        if (data.type_ !== 'qm' && data.type_ !== 'f' && data.type_ != 'sf') {
            editTeamsReportError('the match type in row ' + (i + 1) + '  is not valid, must be f, sf, or qm') ;     
            ret = false;
        }

        if (!checkMatchNumber(data.number_, i + 1)) {
            ret = false ;
        }

        if (!checkValidTeam(data.red_[0], i + 1, 'Red 1')) {
            ret = false ;
        }

        if (!checkValidTeam(data.red_[1], i + 1, 'Red 2')) {
            ret = false ;
        }
        
        if (!checkValidTeam(data.red_[2], i + 1, 'Red 3')) {
            ret = false ;
        }

        if (!checkValidTeam(data.blue_[0], i + 1, 'blue 1')) {
            ret = false ;
        }

        if (!checkValidTeam(data.blue_[1], i + 1, 'blue 2')) {
            ret = false ;
        }
        
        if (!checkValidTeam(data.blue_[2], i + 1, 'blue 3')) {
            ret = false ;
        }        
        
    }

    return ret;
}

function saveMatchData() {
    let data = getMatchDataFromTable() ;
    if (checkMatchesData(data)) {
        window.scoutingAPI.send('set-match-data', data) ;
    }
    else {
        statusShowCloseButton(true) ;
    }
}

function importMatches() {
    window.scoutingAPI.send('execute-command', 'import-matches') ;
}

function editMatchesCreateButtonBar() {
    let buttondiv = document.createElement('div') ;
    buttondiv.id = 'edit-matches-buttons' ;

    let add = document.createElement('button') ;
    add.innerText = 'Add Match' ;
    buttondiv.append(add) ;
    add.onclick = addNewMatch;

    let impbut = document.createElement('button') ;
    impbut.innerText = 'Import Matches' ;
    buttondiv.append(impbut) ;
    impbut.onclick = importMatches;
    
    let save = document.createElement('button') ;
    save.innerText = 'Save' ;
    save.onclick = saveMatchData ;
    buttondiv.append(save) ;

    let discard = document.createElement('button') ;
    discard.innerText = 'Cancel' ;
    discard.onclick = () => { updateMainWindow('info') ; }
    buttondiv.append(discard) ;

    return buttondiv ;
}

function updateMatchesView(matches, teams) {
    $('#rightcontent').empty() ;

    let div = document.createElement('div') ;
    div.id = 'edit-matches';

    matchtable = new BwgTable(['Row', 'Type', 'Number', 'Red 1', 'Red 2', 'Red 3', 'Blue 1', 'Blue 2', 'Blue 3'], { 
        prefix: 'create-matches', 
        editable: [false, true, true, true, true, true, true, true, true]} ) ;
    div.append(matchtable.top) ;

    let hr = document.createElement('hr') ;
    div.append(hr) ;

    let buttonbar = editMatchesCreateButtonBar() ;
    div.append(buttonbar) ;

    frcmatches = matches ;
    checkteams = teams ;
    if (matches) {
        populateMatches() ;
    }

    $('#rightcontent').append(div) ;    
}

window.scoutingAPI.receive('send-match-data', (args)=>updateMatchesView(args[0], args[1])) ;
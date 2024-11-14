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

function createColsDescsEditMatches() {
    let col = [
        {
            field: "comp_level",
            title: "Type",
            sorter: sortCompFun,
        },
        {
            field: "set_number",
            title: "Set",
            headerSort: false,
        },
        {
            field: "match_number",
            title: "Match",
            headerSort: false,
        },
        {
            field: "red1",
            title: "Red 1",
            headerSort: false,
        },
        {
            field: "red2",
            title: "Red 2",
            headerSort: false,
        },
        {
            field: "red3",
            title: "Red 3",
            headerSort: false,
        },
        {
            field: "blue1",
            title: "Blue 1",
            headerSort: false,
        },
        {
            field: "blue2",
            title: "Blue 2",
            headerSort: false,
        },
        {
            field: "blue3",
            title: "Blue 3",
            headerSort: false,
        },
    ] ;

    return col ;
}

function addNewMatch() {
    matchtable.addRow({
        comp_level: '?',
        set_number: 0,
        match_number: 0,
        red1: 0,
        red2: 0,
        red3: 0,
        blue1: 0,
        blue2: 0,
        blue3: 0
    }) ;
}

function importMatches() {
    window.scoutingAPI.send('execute-command', 'import-matches') ;
}

function saveMatchData() {

}

function editMatchCreateButtonBar() {
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
    checkteams = teams ;
    $("#rightcontent").empty() ;
    let topdiv = document.createElement('div') ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(topdiv) ;
    topdiv.append(div) ;
    div.id = 'tablediv' ;

    matchtable = new Tabulator(div, 
            {
                data:matches,
                layout:"fitDataFill",
                resizableColumnFit:true,
                columns:createColsDescsEditMatches(),
                initialSort:[{column:"comp_level", dir:"asc"}],
            });

   topdiv.append(editMatchCreateButtonBar());
}

window.scoutingAPI.receive('send-match-data', (args)=>updateMatchesView(args[0], args[1])) ;
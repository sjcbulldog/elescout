let frcmatches = undefined;
let checkteams = undefined;
let matchtable = undefined;

function editMatchView() {
    $('#rightcontent').empty();
    let div = document.createElement('div');
    div.innerHTML = '<b>Assign Matches</b>';
    div.id = 'assign-matches';
    $('#rightcontent').append(div);

    window.scoutingAPI.send('get-match-data');
}

function createColsDescsEditMatches() {
    let teamarray = [];
    for (let t of checkteams) {
        teamarray.push(t.team_number);
    }
    let col = [
        {
            field: "comp_level",
            title: "Type",
            sorter: sortCompFun,
            editor: "list",
            editorParams: {
                values: ["qm", "sf", "f"]
            }
        },
        {
            field: "set_number",
            title: "Set",
            headerSort: false,
            editor: "number",
            editorParams: {
                min: 1,
                max: 100
            }
        },
        {
            field: "match_number",
            title: "Match",
            headerSort: false,
            editor: "number",
            editorParams: {
                min: 1,
                max: 100
            }
        },
        {
            title: "Red",
            headerHozAlign:"center",
            columns: [
                {
                    field: "red1",
                    title: "Team 1",
                    headerSort: false,
                    editor: "list",
                    editorParams: {
                        values: teamarray
                    }
                },
                {
                    field: "red2",
                    title: "Team 2",
                    headerSort: false,
                    editor: "list",
                    editorParams: {
                        values: teamarray
                    }
                },
                {
                    field: "red3",
                    title: "Team 3",
                    headerSort: false,
                    editor: "list",
                    editorParams: {
                        values: teamarray
                    }
                },
            ]
        },
        {
            title: "Blue",
            headerHozAlign:"center",
            columns: [
                {
                    field: "blue1",
                    title: "Team 1",
                    headerSort: false,
                    editor: "list",
                    editorParams: {
                        values: teamarray
                    }
                },
                {
                    field: "blue2",
                    title: "Team 2",
                    headerSort: false,
                    editor: "list",
                    editorParams: {
                        values: teamarray
                    }
                },
                {
                    field: "blue3",
                    title: "Team 3",
                    headerSort: false,
                    editor: "list",
                    editorParams: {
                        values: teamarray
                    }
                },
            ]
        }
    ];

    return col;
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
    });
}

function importMatches() {
    window.scoutingAPI.send('execute-command', 'import-matches');
}

function saveMatchData() {
    let data = [] ;

    let rows = matchtable.getRows() ;
    for(let row of rows) {
        let obj = {
            comp_level: row.getData().comp_level,
            set_number: row.getData().set_number,
            match_number: row.getData().match_number,
            red: [
                row.getData().red1,
                row.getData().red2,
                row.getData().red3
            ],
            blue: [
                row.getData().blue1,
                row.getData().blue2,
                row.getData().blue3
            ]
        }
        data.push(obj) ;
    }

    window.scoutingAPI.send('set-match-data', data) ;
}

function editMatchCreateButtonBar() {
    let buttondiv = document.createElement('div');
    buttondiv.id = 'edit-matches-buttons';

    let add = document.createElement('button');
    add.innerText = 'Add Match';
    buttondiv.append(add);
    add.onclick = addNewMatch;

    let impbut = document.createElement('button');
    impbut.innerText = 'Import Matches';
    buttondiv.append(impbut);
    impbut.onclick = importMatches;

    let save = document.createElement('button');
    save.innerText = 'Save';
    save.onclick = saveMatchData;
    buttondiv.append(save);

    let discard = document.createElement('button');
    discard.innerText = 'Cancel';
    discard.onclick = () => { updateMainWindow('info'); }
    buttondiv.append(discard);

    return buttondiv;
}

function updateMatchesView(matches, teams) {
    checkteams = teams;
    $("#rightcontent").empty();
    let topdiv = document.createElement('div');
    let div = document.createElement('div');
    $("#rightcontent").append(topdiv);
    topdiv.append(div);
    div.id = 'tablediv';

    matchtable = new Tabulator(div,
        {
            data: matches,
            layout: "fitDataFill",
            resizableColumnFit: true,
            columns: createColsDescsEditMatches(),
            initialSort: [{ column: "comp_level", dir: "asc" }],
        });

    topdiv.append(editMatchCreateButtonBar());
}

window.scoutingAPI.receive('send-match-data', (args) => updateMatchesView(args[0], args[1]));
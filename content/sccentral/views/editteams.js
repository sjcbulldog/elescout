let teamtable = undefined ;

function editTeamsView() {
    $('#rightcontent').empty() ;
    let div = document.createElement('div') ;
    div.innerHTML = '<b>Assign Tablets</b>' ;
    div.id = 'assign-tablets' ;
    $('#rightcontent').append(div) ;

    window.scoutingAPI.send('get-team-data');
}


function createColsDescsEditTeams() {
    let col = [
        {
            field: "team_number",
            title: "Team Number",
            editor: "number",
            sorter: "number"
        },
        {
            field: "nickname",
            title: "Nick Name",
            editor: "input",
        },
    ] ;
    return col;
}

function addNewTeam() {
    teamtable.addRow({
        team_number: 0,
        nickname: 'New Team Name'
    });
}

function importTeams() {
    window.scoutingAPI.send('execute-command', 'import-teams');
}

function saveTeamData() {
    let data = [] ;

    let rows = teamtable.getRows() ;
    for(let row of rows) {
        let obj = {
            team_number: row.getData().team_number,
            nickname: row.getData().nickname,
        }
        data.push(obj) ;
    }

    window.scoutingAPI.send('set-team-data', data) ;
}

function delTeam() {
    var selectedRows = teamtable.getSelectedRows();
    for(let row of selectedRows) {
        row.delete() ;
    }
}

function editTeamCreateButtonBar() {
    let buttondiv = document.createElement('div');
    buttondiv.id = 'edit-teams-buttons';

    let add = document.createElement('button');
    add.innerText = 'Add Team';
    buttondiv.append(add);
    add.onclick = addNewTeam;

    let del = document.createElement('button');
    del.innerText = 'Delete Team';
    buttondiv.append(del);
    del.onclick = delTeam;

    let impbut = document.createElement('button');
    impbut.innerText = 'Import Teams';
    buttondiv.append(impbut);
    impbut.onclick = importTeams;

    let save = document.createElement('button');
    save.innerText = 'Save';
    save.onclick = saveTeamData;
    buttondiv.append(save);

    let discard = document.createElement('button');
    discard.innerText = 'Cancel';
    discard.onclick = () => { updateMainWindow('info'); }
    buttondiv.append(discard);

    return buttondiv;
}

function updateTeamsView(teams) {
    $("#rightcontent").empty();
    let topdiv = document.createElement('div');
    let div = document.createElement('div');
    $("#rightcontent").append(topdiv);
    topdiv.append(div);
    div.id = 'tablediv';

    teamtable = new Tabulator(div,
        {
            data: teams,
            selectableRows: true,
            layout: "fitColumns",
            resizableColumnFit: true,
            columns: createColsDescsEditTeams(),
            initialSort: [{ column: "team_number", dir: "asc" }],
        });

    topdiv.append(editTeamCreateButtonBar());  
}

window.scoutingAPI.receive('send-team-data', (args)=>updateTeamsView(args[0])) ;
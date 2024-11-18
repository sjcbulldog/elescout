class EditTeamsView extends TabulatorView {
    constructor(div, viewtype) {
        super(div, viewtype);

        this.buildInitialView("Retreiving team information, please wait ....");
        this.registerCallback('send-team-data', this.formCallback.bind(this));
        window.scoutingAPI.send("get-team-data");
    }

    createColsDescs() {
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
        ];
        return col;
    }

    addNewTeam() {
        this.teamtable_.addRow({
            team_number: 0,
            nickname: 'New Team Name'
        });
    }

    importTeams() {
        window.scoutingAPI.send('execute-command', 'import-teams');
    }

    saveTeamData() {
        let data = [];

        let rows = this.teamtable_.getRows();
        for (let row of rows) {
            let obj = {
                team_number: row.getData().team_number,
                nickname: row.getData().nickname,
            }
            data.push(obj);
        }

        window.scoutingAPI.send('set-team-data', data);
    }

    delTeam() {
        var selectedRows = this.teamtable_.getSelectedRows();
        for (let row of selectedRows) {
            row.delete();
        }
    }

    createButtonBar() {
        let buttondiv = document.createElement('div');
        buttondiv.id = 'edit-teams-buttons';

        let add = document.createElement('button');
        add.innerText = 'Add Team';
        buttondiv.append(add);
        add.onclick = this.addNewTeam.bind(this) ;

        let del = document.createElement('button');
        del.innerText = 'Delete Team';
        buttondiv.append(del);
        del.onclick = this.delTeam.bind(this) ;

        let impbut = document.createElement('button');
        impbut.innerText = 'Import Teams';
        buttondiv.append(impbut);
        impbut.onclick = this.importTeams.bind(this) ;

        let save = document.createElement('button');
        save.innerText = 'Save';
        save.onclick = this.saveTeamData.bind(this) ;
        buttondiv.append(save);

        let discard = document.createElement('button');
        discard.innerText = 'Cancel';
        discard.onclick = () => { updateMainWindow('info'); }
        buttondiv.append(discard);

        return buttondiv;
    }

    formCallback(args) {
        let data ;

        this.reset();

        if (args) {
            data = args[0] ;
        }
        else {
            data = [] ;
        }

        this.table_top_div_ = document.createElement('div');
        this.table_div_ = document.createElement('div');

        this.table_top_div_.append(this.table_div_);
        this.table_div_.id = 'tablediv';

        this.teamtable_ = new Tabulator(this.table_div_,
            {
                data: data,
                selectableRows: true,
                layout: "fitColumns",
                resizableColumnFit: true,
                columns: this.createColsDescs(),
                initialSort: [{ column: "team_number", dir: "asc" }],
            });

        this.table_top_div_.append(this.createButtonBar());
        this.top_.append(this.table_top_div_);
    }
}

window.scoutingAPI.receive("send-team-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-data', args); });
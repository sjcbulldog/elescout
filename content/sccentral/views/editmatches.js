
class EditMatchesView extends TabulatorView {
    constructor(div, viewtype) {
        super(div, viewtype);

        this.buildInitialView("Retreiving match information, please wait ....");
        this.registerCallback('send-match-data', this.formCallback.bind(this));
        this.scoutingAPI("get-match-data");
    }

    createColsDescs() {
        let teamarray = [];
        for (let t of this.teams_) {
            teamarray.push(t.team_number);
        }

        let col = [
            {
                field: "comp_level",
                title: "Type",
                sorter: this.sortCompFun.bind(this),
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
                headerHozAlign: "center",
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
                headerHozAlign: "center",
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

    addNewMatch() {
        this.matchtable_.addRow({
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

    importMatches() {
        this.scoutingAPI('execute-command', 'import-matches');
    }

    saveMatchData() {
        let data = [];

        let rows = this.matchtable_.getRows();
        for (let row of rows) {
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
            data.push(obj);
        }

        this.scoutingAPI('set-match-data', data);
    }

    delMatch() {
        var selectedRows = this.matchtable_.getSelectedRows();
        for (let row of selectedRows) {
            row.delete();
        }
    }

    delAllMatches() {
        var selectedRows = this.matchtable_.getRows();
        for (let row of selectedRows) {
            row.delete();
        }
    }

    createButtonBar() {
        let buttondiv = document.createElement('div');
        buttondiv.id = 'edit-matches-buttons';

        let add = document.createElement('button');
        add.innerText = 'Add Match';
        buttondiv.append(add);
        add.onclick = this.addNewMatch.bind(this);

        let del = document.createElement('button');
        del.innerText = 'Delete Match';
        buttondiv.append(del);
        del.onclick = this.delMatch.bind(this);

        let delall = document.createElement('button');
        delall.innerText = 'Delete All Matches';
        buttondiv.append(delall);
        delall.onclick = this.delAllMatches.bind(this);

        let impbut = document.createElement('button');
        impbut.innerText = 'Import Matches';
        buttondiv.append(impbut);
        impbut.onclick = this.importMatches.bind(this);

        let save = document.createElement('button');
        save.innerText = 'Save';
        save.onclick = this.saveMatchData.bind(this);
        buttondiv.append(save);

        let discard = document.createElement('button');
        discard.innerText = 'Cancel';
        discard.onclick = () => { updateMainWindow('info'); }
        buttondiv.append(discard);

        return buttondiv;
    }

    formCallback(args) {
        if (args) {
            this.teams_ = args[1] ;
            this.matches_ = args[0] ;
        }
        else {
            this.teams_ = [] ;
            this.matches_ = [] ;
        }

        this.reset() ;
        this.table_top_div_ = document.createElement('div');
        this.table_div_ = document.createElement('div');

        this.table_top_div_.append(this.table_div_);
        this.table_div_.id = 'tablediv';

        this.matchtable_ = new Tabulator(this.table_div_,
            {
                data: this.matches_,
                selectableRows: true,
                layout: "fitColumns",
                resizableColumnFit: true,
                columns: this.createColsDescs(),
                initialSort: [{ column: "comp_level", dir: "asc" }],
            });

        this.table_top_div_.append(this.createButtonBar());
        this.top_.append(this.table_top_div_);

    }
}
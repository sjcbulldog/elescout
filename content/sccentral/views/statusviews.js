class StatusView extends TabulatorView {

    constructor(div, viewtype, type, isvert) {
        super(div, viewtype);
        this.type_ = type;
        this.hdrvert_ = isvert;

        this.buildInitialView('Retreiving data for the ' + type + ' status view, please wait ...');
        this.registerCallback('send-' + type + '-status', this.formCallback.bind(this));
        this.scoutingAPI('get-' + type + '-status');
    }

    sizeCellFormatter(cell) {
        let val = cell.getValue();
        let el = cell.getElement();
        el.style.fontSize = '16px';
        return val;
    }

    sizeColorCellFormatter(cell) {
        let val = cell.getValue();
        let el = cell.getElement();

        if (val == 'Y') {
            el.style.backgroundColor = "RGB(173, 250, 170)";
        }
        else {
            el.style.backgroundColor = "RGB(217, 126, 126)";
        }
        el.style.fontSize = '16px';

        return val;
    }
    
    doStatusFormat(cell) {
        let val = cell.getValue();
        let el = cell.getElement();

        if (val == 'Y') {
            el.style.backgroundColor = "RGB(173, 250, 170)";
        }
        else {
            el.style.backgroundColor = "RGB(217, 126, 126)";
        }

        return val;
    }

    formCallback(args) {
        let data;

        if (args) {
            data = args[0];
        }
        else {
            data = [];
        }

        this.reset();
        this.table_top_div_ = document.createElement('div');
        this.table_div_ = document.createElement('div');

        this.table_top_div_.append(this.table_div_);
        this.table_div_.id = 'tablediv';

        this.table_ = new Tabulator(this.table_div_,
            {
                data: data,
                layout: "fitColumns",
                resizableColumnFit: true,
                columns: this.createColDesc(),
                movableColumns: true,
                initialSort: this.getInitialSort(),
            });

        this.top_.append(this.table_top_div_) ;
    }
}

class TeamStatusView extends StatusView {
    constructor(div, viewtype) {
        super(div, viewtype, 'team', false);
    }
    
    getInitialSort() {
        return [
            {column:"team_number", dir:"asc"}, //then sort by this second
        ]
    }

    createColDesc() {
        let cols = [
            {
                field: 'number',
                title: 'Number',
                headerVertical: this.hdrvert_,
            },
            {
                field: 'tablet',
                title: 'Tablet',
                headerVertical: this.hdrvert_,
            },
            {
                field: 'status',
                title: 'Status',
                formatter: this.doStatusFormat.bind(this),
                headerVertical: this.hdrvert_,
            },
            {
                field: 'teamname',
                title: 'Team Name',
                headerVertical: this.hdrvert_,
            }
        ];
        return cols;
    }
}

class MatchStatusView extends StatusView {
    constructor(div, viewtype) {
        super(div, viewtype, 'match', false)
    }

    getInitialSort() {
        return [
            {column:"comp_level", dir:"asc"}, //then sort by this second
        ]
    }

    createColDesc() {
        let cols = [
            {
                field: "comp_level",
                title: "Type",
                sorter: this.sortCompFun.bind(this),
                headerVertical: true,
                formatter: this.sizeCellFormatter.bind(this)
            },
            {
                field: "set_number",
                title: "Set",
                formatter: this.sizeCellFormatter.bind(this),
                headerTooltip: 'Set Number',
                headerSort: false,
                headerVertical: true,
            },
            {
                field: "match_number",
                title: "Match",
                formatter: this.sizeCellFormatter.bind(this),
                headerTooltip: 'Match Number',
                headerSort: false,
                headerVertical: true,
            },
            {
                title: 'Red 1',
                headerHozAlign: "center",
                columns: [
                    {
                        field: "red1",
                        title: "Team",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "redtab1",
                        title: "Tablet",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "redst1",
                        title: "Status",
                        formatter: this.sizeColorCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                ]
            },
            {
                title: 'Red 2',
                headerHozAlign: "center",
                columns: [
                    {
                        field: "red2",
                        title: "Team",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "redtab2",
                        title: "Tablet",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "redst2",
                        title: "Status",
                        formatter: this.sizeColorCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                ]
            },
            {
                title: 'Red 3',
                headerHozAlign: "center",
                columns: [
                    {
                        field: "red3",
                        title: "Team",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "redtab3",
                        title: "Tablet",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "redst3",
                        title: "Status",
                        formatter: this.sizeColorCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                ]
            },
            {
                title: 'Blue 1',
                headerHozAlign: "center",
                columns: [
                    {
                        field: "blue1",
                        title: "Team",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },

                    {
                        field: "bluetab1",
                        title: "Tablet",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "bluest1",
                        title: "Status",
                        formatter: this.sizeColorCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                ]
            },
            {
                title: 'Blue 2',
                headerHozAlign: "center",
                columns: [
                    {
                        field: "blue2",
                        title: "Team",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "bluetab2",
                        title: "Tablet",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "bluest2",
                        title: "Status",
                        formatter: this.sizeColorCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                ]
            },
            {
                title: 'Blue 3',
                headerHozAlign: "center",
                columns: [
                    {
                        field: "blue3",
                        title: "Team",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "bluetab3",
                        title: "Tablet",
                        formatter: this.sizeCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                    {
                        field: "bluest3",
                        title: "Status",
                        formatter: this.sizeColorCellFormatter.bind(this),
                        headerSort: false,
                        headerVertical: true,
                    },
                ]
            }
        ]
        return cols;
    }
}
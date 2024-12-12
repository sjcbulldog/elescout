class ZebraStatusView extends TabulatorView {

    constructor(div, viewtype, type, isvert) {
        super(div, viewtype);
        this.type_ = type;
        this.hdrvert_ = isvert;

        this.buildInitialView('Retreiving data for the ' + type + ' status view, please wait ...');
        this.registerCallback('send-zebra-status', this.formCallback.bind(this));
        this.scoutingAPI('get-zebra-status');
    }

    formCallback(args) {
        let data = args[0] ;

        this.reset();
        this.table_top_div_ = document.createElement('div');
        this.table_div_ = document.createElement('div');

        this.table_top_div_.append(this.table_div_);
        this.table_div_.id = 'tablediv';

        this.table_ = new Tabulator(this.table_div_,
            {
                data: data,
                layout: "fitDataFill",
                resizableColumnFit: true,
                columns: this.createColDesc(),
                movableColumns: true,
                initialSort: this.getInitialSort(),
            });

        this.top_.append(this.table_top_div_) ;
    }

    getInitialSort() {
        return [
            {column:"comp_level", dir:"asc"}, //then sort by this second
        ]
    }

    cellFormatter(cell) {
        let val = cell.getValue();
        let el = cell.getElement();

        if (val) {
            el.style.backgroundColor = "RGB(173, 250, 170)";
        }
        else {
            el.style.backgroundColor = "RGB(217, 126, 126)";
        }
        return val;
    }

    createColDesc() {
        let cols = [
            {
                field: 'comp_level',
                title: 'Type',
                sorter: this.sortCompFun.bind(this),
            },
            {
                field: 'set_number',
                title: 'Set',
            },
            {
                field: 'match_number',
                title: 'Match',
            },
            {
                field: 'red1',
                title: 'Red 1',
            },
            {
                field: 'redst1',
                title: 'Red Status 1',
                formatter: this.cellFormatter.bind(this)
            },
            {
                field: 'red2',
                title: 'Red 2',
            },
            {
                field: 'redst2',
                title: 'Red Status 2',
                formatter: this.cellFormatter.bind(this)
            },
            {
                field: 'red3',
                title: 'Red 3',
            },
            {
                field: 'redst3',
                title: 'Red Status 3',
                formatter: this.cellFormatter.bind(this)
            },
            {
                field: 'blue1',
                title: 'Blue 1',
            },
            {
                field: 'bluest1',
                title: 'Blue Status 1',
                formatter: this.cellFormatter.bind(this)
            },
            {
                field: 'blue2',
                title: 'Blue 2',
            },
            {
                field: 'bluest2',
                title: 'Blue Status 2',
                formatter: this.cellFormatter.bind(this)
            },
            {
                field: 'blue3',
                title: 'Blue 3',
            },
            {
                field: 'bluest3',
                title: 'Blue Status 3',
                formatter: this.cellFormatter.bind(this)
            },
        ];
        return cols;
    }
}

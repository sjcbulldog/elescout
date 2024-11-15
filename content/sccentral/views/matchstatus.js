function matchStatus() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Match Status</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-match-status");
}

function sizeCellFormatter(cell) {
    let val = cell.getValue();
    let el = cell.getElement();
    el.style.fontSize = '16px' ;
    return val ;
}

function sizeColorCellFormatter(cell) {
    let val = cell.getValue();
    let el = cell.getElement();

    if (val == 'Y') {
        el.style.backgroundColor = "RGB(173, 250, 170)";
    }
    else {
        el.style.backgroundColor = "RGB(217, 126, 126)";
    }
    el.style.fontSize = '16px' ;

    return val;
}

function createColDescs() {
    let cols = [
        {
            field: "comp_level",
            title: "Type",
            sorter: sortCompFun,
            headerVertical: true,
            formatter: sizeCellFormatter
        },
        {
            field: "set_number",
            title: "Set",
            formatter: sizeCellFormatter,
            headerTooltip: 'Set Number',
            headerSort: false,
            headerVertical: true,
        },
        {
            field: "match_number",
            title: "Match",
            formatter: sizeCellFormatter,
            headerTooltip: 'Match Number',
            headerSort: false,
            headerVertical: true,
        },
        {
            title: 'Red 1',
            headerHozAlign:"center",
            columns: [
                {
                    field: "red1",
                    title: "Team",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "redtab1",
                    title: "Tablet",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "redst1",
                    title: "Status",
                    formatter: sizeColorCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
            ]
        },
        {
            title: 'Red 2',
            headerHozAlign:"center",
            columns: [
                {
                    field: "red2",
                    title: "Team",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "redtab2",
                    title: "Tablet",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "redst2",
                    title: "Status",
                    formatter: sizeColorCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
            ]
        },
        {
            title: 'Red 3',
            headerHozAlign:"center",
            columns: [
                {
                    field: "red3",
                    title: "Team",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "redtab3",
                    title: "Tablet",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "redst3",
                    title: "Status",
                    formatter: sizeColorCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
            ]
        },
        {
            title: 'Blue 1',
            headerHozAlign:"center",
            columns: [        
                {
                    field: "blue1",
                    title: "Team",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },

                {
                    field: "bluetab1",
                    title: "Tablet",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "bluest1",
                    title: "Status",
                    formatter: sizeColorCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
            ]
        },
        {
            title: 'Blue 2',
            headerHozAlign:"center",
            columns: [
                {
                    field: "blue2",
                    title: "Team",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "bluetab2",
                    title: "Tablet",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "bluest2",
                    title: "Status",
                    formatter: sizeColorCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
            ]
        },
        {
            title: 'Blue 3',
            headerHozAlign:"center",
            columns: [
                {
                    field: "blue3",
                    title: "Team",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "bluetab3",
                    title: "Tablet",
                    formatter: sizeCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                },
                {
                    field: "bluest3",
                    title: "Status",
                    formatter: sizeColorCellFormatter,
                    headerSort: false,
                    headerVertical: true,
                }, 
            ]
        }
    ]
    return cols;
}

function updateMatchStatus(data) {
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    div.id = 'tablediv' ;

    var table = new Tabulator(div, 
            {
                data:data,
                layout:"fitColumns",
                resizableColumnFit:true,
                columns:createColDescs(),
                initialSort:[{column:"comp_level", dir:"asc"}],
                movableColumns: true,
            });
   table.id = 'table' ;
}

window.scoutingAPI.receive("send-match-status", (args)=>updateMatchStatus(args[0])) ;
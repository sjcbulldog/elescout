
class FormulaView extends XeroView {
    static newEntryTitle = 'New Formula' ;

    constructor(div, viewtype) {
        super(div, viewtype);

        this.registerCallback('send-formulas', this.formCallback.bind(this));
        this.scoutingAPI('get-formulas');
    }

    close() {
        super.close() ;
    }

    deleteRow(e, cell) {
        let row = cell.getRow() ;
        let name = row.getData().name ;
        if (name !== FormulaView.newEntryTitle) {
            this.scoutingAPI('delete-formula', name) ;
            cell.getRow().delete();
        }
    }

    addNewEntryRow() {
        this.table_.addRow({name: FormulaView.newEntryTitle, formula: 'Double click to add new formula'}) ;
    }

    cellEdited(cell) {
        if (cell.getField() === 'name') {
            let oldName = cell.getOldValue() ;
            if (oldName === FormulaView.newEntryTitle) {
                // We are adding a new formula
                let row = cell.getRow() ;
                let fcell = row.getCell('formula') ;
                fcell.setValue('1') ;                
                this.addNewEntryRow() ;
            }
            else {
                let newName = cell.getValue() ;
                if (oldName !== newName) {
                    this.scoutingAPI('rename-formula', [oldName, newName]) ;
                }
            }
        }
        else if (cell.getField() === 'formula') {
            let name = cell.getRow().getData().name ;
            if (name !== FormulaView.newEntryTitle) {
                let formula = cell.getValue() ;
                this.scoutingAPI('update-formula', [name, formula]) ;
            }
        }
    }

    formCallback(data) {
        let d = data[0] ;
        this.reset() ;

        d.push ({ 
            name: FormulaView.newEntryTitle,
            formula: 'Double click to add new formula'
        }) ;

        this.formula_top_ = document.createElement('div') ;
        this.top_.append(this.formula_top_) ;

        this.table_ = new Tabulator(this.formula_top_, 
            {
                layout:"fitData",
                resizableColumnFit:true,
                data: d,
                columns: [
                    {
                        formatter:"buttonCross", 
                        width:40, 
                        cellClick: this.deleteRow.bind(this),
                    },
                    {
                        field: 'name',
                        title: 'Name',
                        editor: 'input',
                        cellEdited: this.cellEdited.bind(this),
                    },
                    {
                        field: 'formula',
                        title: 'Formula',
                        editor: 'input',
                        cellEdited: this.cellEdited.bind(this),
                    }
                ],
                movableColumns: false,
            });
    }
}

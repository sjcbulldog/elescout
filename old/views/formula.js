
class FormulaView extends XeroView {
    static newEntryTitle = 'New Formula' ;

    constructor(div, viewtype) {
        super(div, viewtype);

        this.field_list_ = [] ;

        this.registerCallback('send-formulas', this.formCallback.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));

        this.scoutingAPI('get-formulas');
        this.scoutingAPI('get-team-field-list');
        this.scoutingAPI('get-match-field-list');
    }

    close() {
        if (this.popup_ !== undefined) {
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }
        super.close() ;
    }

    receiveTeamFieldList(list) {
        this.field_list_ = [...this.field_list_, ...list[0]] ;
    }
    
    receiveMatchFieldList(list) {
        this.field_list_ = [...this.field_list_, ...list[0]] ;
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
        this.table_.addRow({name: FormulaView.newEntryTitle, formula: 'Double click name field to add new formula'}) ;
    }

    findFormula(name) {
        for (let one of this.formulas_) {
            if (one.name === name) {
                return one ;
            }
        }
        return undefined ;
    }

    renameForumla(oldName, newName) {
        for (let one of this.formulas_) {
            if (one.name === oldName) {
                one.name = newName ;
                return ;
            }
        }
    }

    updateFormula(name, formula) {
        for (let one of this.formulas_) {
            if (one.name === name) {
                one.formula = formula ;
                return ;
            }
        }
    }

    cellEdited(cell) {
        if (cell.getField() === 'name') {
            let oldName = cell.getOldValue() ;
            if (oldName === FormulaView.newEntryTitle) {
                let row = cell.getRow() ;
                let fcell = row.getCell('formula') ;
                fcell.setValue('1') ;                
                let newName = cell.getValue() ;
                if (this.findFormula(newName) !== undefined) {
                    alert('Formula name already exists') ;
                    cell.restoreOldValue() ;
                    fcell.setValue('Double click name field to add new formula') ;
                }
                else {
                    let formula = fcell.getValue() ;
                    this.field_list_.push(newName) ;
                    this.addNewEntryRow() ;
                    this.scoutingAPI('update-formula', [newName, formula]) ;
                }
            }
            else {
                let newName = cell.getValue() ;
                if (this.findFormula(newName) !== undefined) {
                    alert('Formula name already exists') ;
                    cell.restoreOldValue() ;
                }
                else if (oldName !== newName) {
                    this.scoutingAPI('rename-formula', [oldName, newName]) ;
                    this.renameForumla(oldName, newName) ;
                }
            }
        }
    }

    formulaEditingComplete(value) {
        let row = this.current_cell_.getRow() ;
        let name = row.getData().name ;
        this.block_editing_ = false ;
        this.popup_.destroy() ;
        this.popup_ = undefined ;
        this.current_cell_.setValue(value) ;
        let formula = row.getData().formula ;
        this.scoutingAPI('update-formula', [name, formula]) ;
        this.updateFormula(name, formula) ;
    }

    editFormula(cell) {
        let data = cell.getRow().getData() ;
        this.formula_name_ = data.name ;
        this.formula_formula_ = data.formula ;
        this.current_cell_ = cell ;

        let offset = this.getAbsPosition(this.formula_top_.parentElement) ;
        let bounds = this.formula_top_.parentElement.getBoundingClientRect() ;
        if (this.popup_ !== undefined) {
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }

        this.block_editing_ = true ;
        this.popup_ = new FormulaEditor(this.formula_name_, this.formula_formula_, this.field_list_) ;;
        this.popup_.registerCallback('ok', this.formulaEditingComplete.bind(this)) ;

        this.popup_.registerCallback('cancel', () => {
            this.block_editing_ = false ;
            this.popup_.destroy() ;
            this.popup_ = undefined ;
        }) ;

        this.popup_.show(offset.x + bounds.width / 4, offset.y + bounds.height / 4, bounds.width / 2, bounds.height / 2) ;
        this.popup_.setFocus() ;
    }

    cellDoubleClick(e, cell) {
        let col = cell.getColumn().getField() ;
        if (col === 'formula') {
            if (cell.getRow().getData().name !== FormulaView.newEntryTitle) {
                this.editFormula(cell) ;
            }
        }
    }

    formCallback(data) {
        let d = data[0] ;
        this.reset() ;

        for(let one of d) {
            this.field_list_.push(one.name) ;
        }

        this.formulas_ = JSON.parse(JSON.stringify(d)) ;

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
                        title: 'Formula'
                    }
                ],
                movableColumns: false,
            });
        this.table_.on('cellDblClick', this.cellDoubleClick.bind(this)) ;            
    }
}

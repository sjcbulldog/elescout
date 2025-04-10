import winston from "winston";
import { Manager } from "./manager" ;

export interface Formula {
    name: string,
    formula: string
}

export class FormulaInfo {
    public formulas_ : Formula[] = [] ;                 // Formulas that can be used in the single team summary 
}

export class FormulaManager extends Manager {
    private info_ : FormulaInfo ;

    constructor(logger: winston.Logger, writer: () => void, info: FormulaInfo) {
        super(winston.createLogger(), writer) ;
        this.info_ = info ;
    }

    public getFormulas() : Formula[] {
        return this.info_.formulas_ ;
    }

    public hasFormula(name: string) : boolean {
        let ret = false ;

        for(let f of this.info_.formulas_) {
            if (f.name === name) {
                ret = true ;
                break ;
            }
        }

        return ret ;
    }

    public findFormula(name: string) : string | undefined {
        let ret: string | undefined = undefined ;

        for(let f of this.info_.formulas_) {
            if (f.name === name) {
                ret = f.formula ;
                break ;
            }
        }

        return ret ;
    }

    private findFormulaIndex(name: string) : number | undefined {
        let ret: number | undefined = undefined ;

        for(let i = 0 ; i < this.info_.formulas_.length; i++) {
            if (this.info_.formulas_[i].name === name) {
                ret = i ;
                break ;
            }
        }

        return ret ;
    }

    public deleteFormula(name: string) {
        let index = this.findFormulaIndex(name) ;
        if (index != undefined) {
            this.info_.formulas_.splice(index, 1) ;
            this.write() ;
        }
    }

    public renameFormula(oldName: string, newName: string) {
        let index = this.findFormulaIndex(oldName) ;
        if (index != undefined) {
            this.info_.formulas_[index].name = newName ;
        }
    }

    public addFormula(name: string, formula: string) {
        let index = this.findFormulaIndex(name) ;
        if (index != undefined) {
            this.info_.formulas_[index].formula = formula ;
        }
        else {      
            let f : Formula = {
                name: name,
                formula: formula
            } ;

            this.info_.formulas_.push(f) ;
        }
        this.write() ;
    }

    public importFormulas(obj: any) {
        for(let key of Object.keys(obj)) {
            let v = obj[key] ;
            if (typeof v === 'string') {
                this.addFormula(key, v) ;
            }
        }

        this.write() ;
    }    
}
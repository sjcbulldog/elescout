import { Data } from "electron";
import { DataValue } from "../model/datavalue";
import { has } from "electron-settings";

export class ExprNode {
    public getValue(varvalues: Map<string, DataValue>) : DataValue {
        return DataValue.fromError(new Error('Not implemented'));
    }

    public variables(vars: string[]) : void {
    }
}

export class ExprValue extends ExprNode {
    private value_ : DataValue ;

    constructor(public value: DataValue) {
        super() ;
        this.value_ = value;
    }

    public getValue(varvalues: Map<string, DataValue>) : DataValue {
        return this.value_;
    }
}

export class ExprVariable extends ExprNode {
    private name_ : string ;

    constructor(name: string) {
        super() ;
        this.name_ = name;
    }

    public variables(vars: string[]) : void {
        if (!vars.includes(this.name_)) {
            vars.push(this.name_) ;
        }
    }

    public getValue(varvalues: Map<string, DataValue>) : DataValue {
        if (varvalues.has(this.name_)) {
            return varvalues.get(this.name_)! ;
        }
        return DataValue.fromError(new Error(`reference to undefined variable ${this.name_}`)) ;
    }
}

export class ExprFunctionDef {
    private name_ : string ;
    private argcnt_ : number ;
    private func_ : (args: DataValue[]) => DataValue ;

    public constructor(name: string, argcnt: number, func: (args: DataValue[]) => DataValue) {
        this.name_ = name;
        this.argcnt_ = argcnt;
        this.func_ = func;
    }

    public getValue(args: DataValue[]) : DataValue {
        return this.func_(args);

    }

    public getName() : string {
        return this.name_ ;
    }

    public getArgCount() : number {
        return this.argcnt_ ;
    }
}

export class ExprFunction extends ExprNode {
    private args_? : ExprNode[] ;
    private name_ : string ;
    private func_ : ExprFunctionDef ;

    constructor(name: string, fun: ExprFunctionDef) {
        super() ;
        this.name_ = name;
        this.func_ = fun;
    }

    public variables(vars: string[]): void {
        if (this.args_) {
            for(let arg of this.args_) {
                arg.variables(vars) ;
            }
        }
    }

    public getValue(varvalues: Map<string, DataValue>) : DataValue {
        if (!this.args_) {
            return DataValue.fromError(new Error('no arguments for function ' + this.name_)) ;
        }

        const args: DataValue[] = [] ;
        for (const arg of this.args_) {
            args.push(arg.getValue(varvalues)) ;
        }

        if (args.length !== this.func_.getArgCount()) {
            return DataValue.fromError(new Error('Invalid number of arguments for function ' + this.name_)) ;
        }

        return this.func_.getValue(args) ;
    }
}

export class ExprOperator extends ExprNode {
    private which_ : string ;
    private args_? : ExprNode[] ;

    constructor(which: string) {
        super() ;
        this.which_ = which;
    }

    public variables(vars: string[]): void {
        if (this.args_) {
            for(let arg of this.args_) {
                arg.variables(vars) ;
            }
        }
    }

    public setArgs(args: ExprNode[]) {
        this.args_ = args ;
    }

    public operatorPrecedence() : number {
        switch (this.which_) {
            case '+':
            case '-':
                return 1 ;
            case '*':
            case '/':
            case '%':
                return 2 ;
            case '^':
                return 3 ;
            case '==':
            case '!=':
                return 4 ;
            case '<':
            case '<=':
            case '>':
            case '>=':
                return 5 ;
            case '&&':
                return 6 ;
            case '||':
                return 7 ;
            case '!':
                return 8 ;
        }
        return 0 ;
    }

    public getValue(varvalues: Map<string, DataValue>) : DataValue {
        if (!this.args_) {
            return DataValue.fromError(new Error('no arguments for operator ' + this.which_)) ;
        }

        const args: DataValue[] = [] ;
        for (const arg of this.args_) {
            args.push(arg.getValue(varvalues)) ;
        }

        let ret : DataValue = DataValue.fromError(new Error('Not implemented')) ;

        switch(this.which_) {
            case '+':
                ret = this.operPlus(args[0], args[1]) ;
                break ;
            case '-':
                ret = this.operMinus(args[0], args[1]) ;
                break ;
            case '*':
                ret = this.operMul(args[0], args[1]) ;
                break ;
            case '/':
                ret = this.operDiv(args[0], args[1]) ;
                break ;
            case '%':   
                ret = this.operMod(args[0], args[1]) ;
                break ;
            case '^':
                ret = this.operPow(args[0], args[1]) ;
                break ;
            case '==':
                ret = this.operEqual(args[0], args[1]) ;
                break ;
            case '!=':
                ret = this.operNotEqual(args[0], args[1]) ;
                break ;
            case '<':
                ret = this.operLess(args[0], args[1]) ;
                break ;
            case '<=':
                ret = this.operLessEqual(args[0], args[1]) ;
                break ;
            case '>':
                ret = this.operGreater(args[0], args[1]) ;
                break ;
            case '>=':
                ret = this.operGreaterEqual(args[0], args[1]) ;
                break ;
            case '&&':
                ret = this.operAnd(args[0], args[1]) ;
                break ;
            case '||':
                ret = this.operOr(args[0], args[1]) ;
                break ;
            case '!':
                ret = this.operNot(args[0]) ;
                break ;
        }
        return ret ;
    }

    private operPlus(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn + invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromString(a.toString() + b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromInteger(a.toReal() + b.toReal()) ;
        }

        return ret;
    }

    private operMinus(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn - invalid argument types')) ;

        if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromInteger(a.toReal() - b.toReal()) ;
        }

        return ret;
    }

    private operMul(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn * invalid argument types')) ;

        if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromInteger(a.toReal() * b.toReal()) ;
        }

        return ret;
    }

    private operDiv(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn / invalid argument types')) ;

        if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromInteger(a.toReal() / b.toReal()) ;
        }

        return ret;
    }

    private operMod(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn % invalid argument types')) ;

        if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromInteger(a.toReal() % b.toReal()) ;
        }

        return ret;
    }

    private operPow(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn ^ invalid argument types')) ;

        if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromInteger(Math.pow(a.toReal(), b.toReal())) ;
        }

        return ret;
    }

    private operEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn == invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() === b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromBoolean(a.toReal() === b.toReal()) ;
        }

        return ret;
    }

    private operNotEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn != invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() !== b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromBoolean(a.toReal() !== b.toReal()) ;
        }

        return ret;
    }

    private operLess(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn < invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() < b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromBoolean(a.toReal() < b.toReal()) ;
        }

        return ret;
    }

    private operLessEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn <= invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() <= b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromBoolean(a.toReal() <= b.toReal()) ;
        }

        return ret;
    }

    private operGreater(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn > invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() > b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromBoolean(a.toReal() > b.toReal()) ;
        }

        return ret;
    }

    private operGreaterEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn >= invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() >= b.toString()) ;
        }
        else if ((a.isInteger() || a.isReal()) && (b.isInteger() || b.isReal())) {
            ret = DataValue.fromBoolean(a.toReal() >= b.toReal()) ;
        }

        return ret;
    }

    private operAnd(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn && invalid argument types')) ;

        if (a.isBoolean() && b.isBoolean()) {
            ret = DataValue.fromBoolean(a.toBoolean() && b.toBoolean()) ;
        }

        return ret;
    }

    private operOr(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn || invalid argument types')) ;

        if (a.isBoolean() && b.isBoolean()) {
            ret = DataValue.fromBoolean(a.toBoolean() || b.toBoolean()) ;
        }

        return ret;
    }

    private operNot(a: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn ! invalid argument types')) ;

        if (a.isBoolean()) {
            ret = DataValue.fromBoolean(!a.toBoolean()) ;
        }

        return ret;
    }
}

class ExprArray extends ExprNode {
    private args_ : ExprNode[] ;

    constructor(args: ExprNode[]) {
        super() ;
        this.args_ = args;
    }

    public variables(vars: string[]): void {
        if (this.args_) {
            for(let arg of this.args_) {
                arg.variables(vars) ;
            }
        }
    }

    public getValue(varvalues: Map<string, DataValue>) : DataValue {
        const args: DataValue[] = [] ;
        for (const arg of this.args_) {
            args.push(arg.getValue(varvalues)) ;
        }

        return DataValue.fromArray(args) ;
    }
}

export class Expr {
    private expr_ : ExprNode | null ;
    private err_ : Error | null ;
    private str_ : string ;

    private constructor(str: string, node: ExprNode | null, err: Error | null) {
        this.expr_ = node ;
        this.err_ = err ;
        this.str_ = str ;
    }

    public hasError() : boolean {
        return this.err_ !== null ;
    }

    public getError() : Error | null {
        return this.err_ ;
    }

    public getErrorMessage() : string {
        if (this.err_) {
            return this.err_.message ;
        }
        return '' ;
    }

    public getString() : string {
        return this.str_ ;
    }

    public evaluate(varvalues: Map<string, DataValue>) : DataValue {
        if (this.hasError()) {
            return DataValue.fromError(this.err_!) ;
        }

        return this.expr_!.getValue(varvalues) ;
    }

    public variables() : string[] {
        let ret : string[] = [] ;
        if (this.expr_) {
            this.expr_.variables(ret) ;
        }
        return ret ;
    }

    public static parse(str: string) : Expr {
        let result = Expr.parseNode(str, 0) ;
        if (result instanceof Error) {
            return new Expr(str, null, result as Error) ;
        }

        let index = Expr.skipSpaces(str, result[0]) ;
        if (index != str.length) {
            return new Expr(str, null, new Error('Invalid expression')) ;
        }

        return new Expr(str, result[1], null) ;
    }

    private static skipSpaces(str: string, index: number) : number {
        while (index < str.length && str[index] === ' ') {
            index++ ;
        }
        return index ;
    }

    private static isDigit(c: string) : boolean {
        return c >= '0' && c <= '9' ;
    }

    private static isAlpha(c: string) : boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ;
    }

    private static parseOperand(str: string, index: number) : [number, ExprNode] | Error {
        let ret : [number, ExprNode] | Error = new Error('error parsing operand') ;

        index = Expr.skipSpaces(str, index) ;
        if (index >= str.length) {
            return new Error('Invalid operand') ;
        }

        if (str.substring(index).startsWith('(')) {
            let result = Expr.parseNode(str, index + 1) ;
            if (result instanceof Error) {
                return result ;
            }

            index = Expr.skipSpaces(str, result[0]) ;
            if (index >= str.length || str.charAt(index) !== ')') {
                return new Error('Invalid operand') ;
            }
            index++ ;
            ret = [index, result[1]] ;
        }
        else if (Expr.isDigit(str.charAt(index)) || str.charAt(index) === '-' || str.charAt(index) === '+') {
            let start = index ;
            while (index < str.length && (Expr.isDigit(str.charAt(index)) || str.charAt(index) === '.')) {
                index++ ;
            }
            let num = str.substring(start, index) ;
            
            let v : DataValue = DataValue.fromError(new Error('Invalid number')) ;
            if (Number.isInteger(num)) {
                v = DataValue.fromInteger(Number.parseInt(num)) ;
            }
            else {
                let fv = Number.parseFloat(num) ;
                if (Number.isNaN(fv)) {
                    return new Error('Invalid number') ;
                }
                v = DataValue.fromReal(Number.parseFloat(num)) ;
            }
            ret = [index, new ExprValue(v)] ;
        }
        else if (Expr.isAlpha(str.charAt(index))) {
            let start = index ;
            while (index < str.length && (Expr.isAlpha(str.charAt(index)) || Expr.isDigit(str.charAt(index)) || str.charAt(index) === '_')) {
                index++ ;
            }

            let name = str.substring(start, index) ;
            let args : ExprNode[] = [] ;

            if (name.toLowerCase() === 'true') {
                ret = [index, new ExprValue(DataValue.fromBoolean(true))] ;
            }
            else if (name.toLowerCase() === 'false') {
                ret = [index, new ExprValue(DataValue.fromBoolean(false))] ;
            }
            else if (str.charAt(index) === '(') {
                // This is a function call
                index++ ;
                while (true) {
                    let andresult = Expr.parseNode(str, index)
                    if (andresult instanceof Error) {
                        return andresult ;
                    }
        
                    index = andresult[0] ;
                    args.push(andresult[1]) ;

                    index = Expr.skipSpaces(str, index) ;
                    if (index >= str.length) {
                        return new Error('Invalid function call') ;
                    }
                    if (str.charAt(index) === ',') {
                        index++ ;
                    }
                    else if (str.charAt(index) === ')') {
                        index++ ;
                        break ;
                    }
                    else {
                        return new Error('Invalid function call') ;
                    }
                }
            }
            else {
               // This is a variable
               ret = [index, new ExprVariable(name)] ;
            }
        }
        else if (str.charAt(index) === '!') {
            index++ ;
            let result = Expr.parseNode(str, index) ;
            if (result instanceof Error) {
                return result ;
            }

            index = result[0] ;
            ret = [index, new ExprOperator('!')] ;
            (ret[1] as ExprOperator).setArgs([result[1]]) ;
        }
        else if (str.charAt(index) === '[') {
            index++ ;
            let args : ExprNode[] = [] ;
            while (true) {
                let andresult = Expr.parseNode(str, index)
                if (andresult instanceof Error) {
                    return andresult ;
                }
    
                index = andresult[0] ;
                args.push(andresult[1]) ;

                index = Expr.skipSpaces(str, index) ;
                if (index >= str.length) {
                    return new Error('Invalid array') ;
                }
                if (str.charAt(index) === ',') {
                    index++ ;
                }
                else if (str.charAt(index) === ']') {
                    index++ ;
                    break ;
                }
                else {
                    return new Error('Invalid array') ;
                }
            }

            ret = [index, new ExprArray(args)] ;
        }
        else if (str.charAt(index) === '\'') {
            index++ ;
            let start = index ;
            while (index < str.length && str.charAt(index) !== '\'') {
                if (str.charAt(index) === '\\') {
                    index++ ;
                }
                index++ ;
            }
            if (index >= str.length) {
                return new Error('Invalid string') ;
            }
            let strval = str.substring(start, index) ;
            ret = [index + 1, new ExprValue(DataValue.fromString(strval))] ;
        }
        else if (str.charAt(index) === '"') {
            index++ ;
            let start = index ;
            while (index < str.length && str.charAt(index) !== '"') {
                if (str.charAt(index) === '\\') {
                    index++ ;
                }
                index++ ;
            }
            if (index >= str.length) {
                return new Error('Invalid string') ;
            }
            let strval = str.substring(start, index) ;
            ret = [index + 1, new ExprValue(DataValue.fromString(strval))] ;
        }
        else {
            return new Error('Invalid operand') ;
        }

        return ret;
    }

    private static parseOperator(str: string, index: number) : [number, ExprOperator] | Error | null {
        index = Expr.skipSpaces(str, index) ;
        if (index >= str.length) {
            return null ;
        }

        if (str.substring(index).startsWith('+')) {
            index++ ;
            return [index, new ExprOperator('+')] ;
        }
        else if (str.substring(index).startsWith('-')) {
            index++ ;
            return [index, new ExprOperator('-')] ;
        }
        else if (str.substring(index).startsWith('*')) {
            index++ ;
            return [index, new ExprOperator('*')] ;
        }
        else if (str.substring(index).startsWith('/')) {
            index++ ;
            return [index, new ExprOperator('/')] ;
        }
        else if (str.substring(index).startsWith('%')) {
            index++ ;
            return [index, new ExprOperator('%')] ;
        }
        else if (str.substring(index).startsWith('^')) {
            index++ ;
            return [index, new ExprOperator('^')] ;
        }
        else if (str.substring(index).startsWith('==')) {
            index += 2 ;
            return [index, new ExprOperator('==')] ;
        }
        else if (str.substring(index).startsWith('!=')) {
            index += 2 ;
            return [index, new ExprOperator('!=')] ;
        }
        else if (str.substring(index).startsWith('<=')) {
            index += 2 ;
            return [index, new ExprOperator('<=')] ;
        }
        else if (str.substring(index).startsWith('<')) {
            index++ ;
            return [index, new ExprOperator('<')] ;
        }
        else if (str.substring(index).startsWith('>=')) {
            index += 2 ;
            return [index, new ExprOperator('>=')] ;
        }
        else if (str.substring(index).startsWith('>')) {
            index++ ;
            return [index, new ExprOperator('>')] ;
        }
        else if (str.substring(index).startsWith('&&')) {
            index += 2 ;
            return [index, new ExprOperator('&&')] ;
        }
        else if (str.substring(index).startsWith('||')) {
            index += 2 ;
            return [index, new ExprOperator('||')] ;
        }

        return null ;
    }


    private static parseNode(str: string, index: number): [number, ExprNode] | Error {
        let ret = new ExprValue(DataValue.fromError(new Error('Not implemented'))) ;
        let operands : ExprNode[] = [] ;
        let operators : ExprOperator[] = [] ;

        let operand1 = Expr.parseOperand(str, index) ;
        if (operand1 instanceof Error) {
            return operand1 ;
        }

        index = operand1[0] ;
        operands.push(operand1[1]) ;

        let operator1 = Expr.parseOperator(str, index) ;
        if (operator1 instanceof Error) {
            return operator1 ;
        }

        if (operator1 === null) {
            return [index, operands[0]] ;
        }

        index = operator1[0] ;
        operators.push(operator1[1]) ;

        while (index < str.length) {
            let operand2 = Expr.parseOperand(str, index) ;
            if (operand2 instanceof Error) {
                return operand2 ;
            }
    
            index = Expr.skipSpaces(str, operand2[0]) ;
            operands.push(operand2[1]) ;

            let operator2 = Expr.parseOperator(str, index) ;
            if (operator2 instanceof Error) {
                return operator2 ;
            }

            if (operator2 === null) {
                break ;
            }

            index = operator2[0] ;
            while (operators.length > 0 && operators[operators.length - 1].operatorPrecedence() >= operator2[1].operatorPrecedence()) {
                let operand1 = operands.pop() ;
                let operand2 = operands.pop() ;
                let operator = operators.pop()! ;
                operator.setArgs([operand2!, operand1!]) ;
                operands.push(operator) ;
            }
            operators.push(operator2[1]) ;          
        }

        while (operators.length > 0) {
            let operand1 = operands.pop() ;
            let operand2 = operands.pop() ;
            let operator = operators.pop()! ;
            operator.setArgs([operand2!, operand1!]) ;
            operands.push(operator) ;
        }

        return [index, operands.pop()!] ;
    }
}

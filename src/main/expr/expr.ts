import { DataValue } from "../model/datavalue";

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

    constructor(name: string, args: ExprNode[], fun: ExprFunctionDef) {
        super() ;
        this.name_ = name;
        this.func_ = fun;
        this.args_ = args ;
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

        if (args.length !== this.func_.getArgCount() && this.func_.getArgCount() >= 0) {
            return DataValue.fromError(new Error(`Invalid number of arguments for function '${this.name_}'`)) ;
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
        else if (a.isInteger() && b.isInteger()) {
            ret = DataValue.fromInteger(a.toInteger() + b.toInteger()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromReal(a.toReal() + b.toReal()) ;
        }

        return ret;
    }

    private operMinus(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn - invalid argument types')) ;

        if (a.isInteger() && b.isInteger()) {
            ret = DataValue.fromInteger(a.toInteger() - b.toInteger()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromReal(a.toReal() - b.toReal()) ;
        }

        return ret;
    }

    private operMul(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn * invalid argument types')) ;

        if (a.isInteger() && b.isInteger()) {
            ret = DataValue.fromInteger(a.toInteger() * b.toInteger()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromReal(a.toReal() * b.toReal()) ;
        }

        return ret;
    }

    private operDiv(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn / invalid argument types')) ;

        if (a.isInteger() && b.isInteger()) {
            if (b.toInteger() === 0) {
                ret = DataValue.fromError(new Error('division by zero')) ;
            }
            else {
                ret = DataValue.fromInteger(Math.floor(a.toInteger() / b.toInteger())) ;
            }
        }
        else if (a.isNumber() && b.isNumber()) {
            if (b.toReal() === 0.0) {
                ret = DataValue.fromError(new Error('division by zero')) ;
            }
            else {
                ret = DataValue.fromReal(a.toReal() / b.toReal()) ;
            }
        }

        return ret;
    }

    private operMod(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn % invalid argument types')) ;

        if (a.isInteger() && b.isInteger()) {
            if (b.toInteger() === 0) {
                ret = DataValue.fromError(new Error('division by zero')) ;
            }
            else {
                ret = DataValue.fromInteger(a.toInteger() % b.toInteger()) ;
            }
        }
        else if (a.isNumber() && b.isNumber()) {
            if (b.toReal() === 0.0) {
                ret = DataValue.fromError(new Error('division by zero')) ;
            }
            else {
                ret = DataValue.fromReal(a.toReal() % b.toReal()) ;
            }
        }

        return ret;
    }

    private operPow(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn ^ invalid argument types')) ;

        if (a.isInteger() && b.isInteger()) {
            ret = DataValue.fromInteger(Math.pow(a.toInteger(), b.toInteger())) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromReal(Math.pow(a.toReal(), b.toReal())) ;
        }

        return ret;
    }

    private operEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn == invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() === b.toString()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromBoolean(a.toReal() === b.toReal()) ;
        }

        return ret;
    }

    private operNotEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn != invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() !== b.toString()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromBoolean(a.toReal() !== b.toReal()) ;
        }

        return ret;
    }

    private operLess(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn < invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() < b.toString()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromBoolean(a.toReal() < b.toReal()) ;
        }

        return ret;
    }

    private operLessEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn <= invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() <= b.toString()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromBoolean(a.toReal() <= b.toReal()) ;
        }

        return ret;
    }

    private operGreater(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn > invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() > b.toString()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
            ret = DataValue.fromBoolean(a.toReal() > b.toReal()) ;
        }

        return ret;
    }

    private operGreaterEqual(a: DataValue, b: DataValue) : DataValue {
        let ret : DataValue = DataValue.fromError(new Error('operatorn >= invalid argument types')) ;

        if (a.isString() && b.isString()) {
            ret = DataValue.fromBoolean(a.toString() >= b.toString()) ;
        }
        else if (a.isNumber() && b.isNumber()) {
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

    private static inited_ : boolean = false ;
    private static functions_ : Map<string, ExprFunctionDef> = new Map<string, ExprFunctionDef>() ;

    private constructor(str: string, node: ExprNode | null, err: Error | null) {
        this.expr_ = node ;
        this.err_ = err ;
        this.str_ = str ;
    }

    public static registerFunction(name: string, argcnt: number, func: (args: DataValue[]) => DataValue) : void {
        if (Expr.functions_.has(name)) {
            throw new Error('Function already registered') ;
        }
        Expr.functions_.set(name, new ExprFunctionDef(name, argcnt, func)) ;
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
        let ret = this.expr_!.getValue(varvalues) ;
        return ret;
    }

    public variables() : string[] {
        let ret : string[] = [] ;
        if (this.expr_) {
            this.expr_.variables(ret) ;
        }
        return ret ;
    }

    public static parse(str: string) : Expr {
        if (!Expr.inited_) {
            Expr.initFunctions() ;
        }

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

    private static initFunctions() : void {

        Expr.registerFunction('int', 1, (args: DataValue[]) => {
            let ret: DataValue ;

            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function int')) ;
            }

            if (args[0].isInteger()) {
                ret = args[0] ;
            }
            else if (args[0].isReal()) {
                if (args[0].toReal() > Number.MAX_SAFE_INTEGER) {
                    ret = DataValue.fromError(new Error('Integer overflow')) ;
                }
                else if (args[0].toReal() < Number.MIN_SAFE_INTEGER) {
                    ret = DataValue.fromError(new Error('Integer underflow')) ;
                }
                else if (args[0].toReal() > 0) {
                    ret = DataValue.fromInteger(Math.floor(args[0].toReal())) ;
                }
                else {
                    ret = DataValue.fromInteger(Math.ceil(args[0].toReal())) ;
                }
            }
            else {
                ret = DataValue.fromError(new Error('Invalid argument type for function int')) ;
            }
            return ret;
        }) ;

        Expr.registerFunction('abs', 1, (args: DataValue[]) => {
            let ret: DataValue ;

            if (args.length !== 1) {
                ret = DataValue.fromError(new Error('Invalid number of arguments for function abs')) ;
            }
            else if (args[0].isInteger()) {
                ret = DataValue.fromInteger(Math.abs(args[0].toInteger())) ;
            }
            else if (args[0].isReal()) {
                ret = DataValue.fromReal(Math.abs(args[0].toReal())) ;
            }
            else {
                ret = DataValue.fromError(new Error('Invalid argument type for function abs')) ;
            }
            return ret ;
        });

        Expr.registerFunction('ceil', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function ceil')) ;
            }
            return DataValue.fromInteger(Math.ceil(args[0].toReal())) ;
        });

        Expr.registerFunction('floor', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function floor')) ;
            }
            return DataValue.fromInteger(Math.floor(args[0].toReal())) ;
        });

        Expr.registerFunction('round', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function round')) ;
            }
            return DataValue.fromInteger(Math.round(args[0].toReal())) ;
        });

        Expr.registerFunction('sqrt', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function sqrt')) ;
            }

            return DataValue.fromReal(Math.sqrt(args[0].toReal())) ;
        });

        Expr.registerFunction('sin', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function sin')) ;
            }
            return DataValue.fromReal(Math.sin(args[0].toReal())) ;
        });

        Expr.registerFunction('cos', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function cos')) ;
            }
            return DataValue.fromReal(Math.cos(args[0].toReal())) ;
        });

        Expr.registerFunction('tan', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function tan')) ;
            }
            return DataValue.fromReal(Math.tan(args[0].toReal())) ;
        });

        Expr.registerFunction('asin', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function asin')) ;
            }
            return DataValue.fromReal(Math.asin(args[0].toReal())) ;
        });

        Expr.registerFunction('acos', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function acos')) ;
            }
            return DataValue.fromReal(Math.acos(args[0].toReal())) ;
        });

        Expr.registerFunction('atan', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function atan')) ;
            }
            return DataValue.fromReal(Math.atan(args[0].toReal())) ;
        });

        Expr.registerFunction('atan2', 2, (args: DataValue[]) => {
            if (args.length !== 2) {
                return DataValue.fromError(new Error('Invalid number of arguments for function atan2')) ;
            }
            return DataValue.fromReal(Math.atan2(args[0].toReal(), args[1].toReal())) ;
        });

        Expr.registerFunction('exp', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function exp')) ;
            }
            return DataValue.fromReal(Math.exp(args[0].toReal())) ;
        });

        Expr.registerFunction('log', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function log')) ;
            }
            return DataValue.fromReal(Math.log(args[0].toReal())) ;
        });

        Expr.registerFunction('log10', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function log10')) ;
            }
            return DataValue.fromReal(Math.log10(args[0].toReal())) ;
        });

        Expr.registerFunction('log2', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function log2')) ;
            }
            return DataValue.fromReal(Math.log2(args[0].toReal())) ;
        });

        Expr.registerFunction('ln', 1, (args: DataValue[]) => {
            if (args.length !== 1) {
                return DataValue.fromError(new Error('Invalid number of arguments for function ln')) ;
            }
            return DataValue.fromReal(Math.log(args[0].toReal())) ;
        });

        Expr.registerFunction('logn', 2, (args: DataValue[]) => {
            if (args.length !== 2) {
                return DataValue.fromError(new Error('Invalid number of arguments for function logn')) ;
            }
            return DataValue.fromReal(Math.log(args[0].toReal()) / Math.log(args[1].toReal())) ;
        });

        Expr.registerFunction('average', -1, (args: DataValue[]) => {
            if (args.length === 0) {
                return DataValue.fromError(new Error('Invalid number of arguments for function average')) ;
            }

            let result: DataValue[] = [] ;
            Expr.flatten(args, result) ;
            let sum = 0.0 ;
            for(let i = 0; i < result.length; i++) {
                if (result[i].isError()) {
                    return result[i] ;
                }
                else if (!result[i].isNumber()) {
                    return DataValue.fromError(new Error('Invalid argument type for function average')) ;
                }
                sum += result[i].toReal() ;
            }

            return DataValue.fromReal(sum / result.length) ;
        }) ;

        Expr.inited_ = true ;

        Expr.registerFunction('sum', -1, (args: DataValue[]) => {
            if (args.length === 0) {
                return DataValue.fromError(new Error('Invalid number of arguments for function average')) ;
            }

            let result: DataValue[] = [] ;
            Expr.flatten(args, result) ;
            let sum = 0.0 ;
            for(let i = 0; i < result.length; i++) {
                if (result[i].isError()) {
                    return result[i] ;
                }
                else if (!result[i].isNumber()) {
                    return DataValue.fromError(new Error('Invalid argument type for function average')) ;
                }
                sum += result[i].toReal() ;
            }

            return DataValue.fromReal(sum) ;
        }) ;

        Expr.registerFunction('median', -1, (args: DataValue[]) => {
            if (args.length === 0) {
                return DataValue.fromError(new Error('Invalid number of arguments for function average')) ;
            }

            let result: DataValue[] = [] ;
            Expr.flatten(args, result) ;

            for(let i = 0; i < result.length; i++) {
                if (result[i].isError()) {
                    return result[i] ;
                }
                else if (!result[i].isNumber()) {
                    return DataValue.fromError(new Error('Invalid argument type for function average')) ;
                }
            }

            result.sort((a: DataValue, b: DataValue) => {
                return a.toReal() - b.toReal() ;
            }) ;

            let len = result.length / 2 ;
            if (result.length % 2 === 0) {
                return DataValue.fromReal((result[len - 1].toReal() + result[len].toReal()) / 2.0) ;
            }
            else {
                return DataValue.fromReal(result[Math.floor(len)].toReal()) ;
            }
        }) ;     
        
        Expr.registerFunction('variance', -1, (args: DataValue[]) => {
            if (args.length === 0) {
                return DataValue.fromError(new Error('Invalid number of arguments for function average')) ;
            }

            let result: DataValue[] = [] ;
            Expr.flatten(args, result) ;

            let sum = 0.0 ;
            for(let i = 0; i < result.length; i++) {
                if (result[i].isError()) {
                    return result[i] ;
                }
                else if (!result[i].isNumber()) {
                    return DataValue.fromError(new Error('Invalid argument type for function average')) ;
                }
                sum += result[i].toReal() ;
            }

            let sum2 = 0.0 ;
            for(let i = 0; i < result.length; i++) {
                sum2 += Math.pow(result[i].toReal() - sum, 2) ;
            }

            return DataValue.fromReal(sum2 / result.length) ;
        }) ;  
        
        Expr.registerFunction('stddev', -1, (args: DataValue[]) => {
            if (args.length === 0) {
                return DataValue.fromError(new Error('Invalid number of arguments for function average')) ;
            }

            let result: DataValue[] = [] ;
            Expr.flatten(args, result) ;

            let sum = 0.0 ;
            for(let i = 0; i < result.length; i++) {
                if (result[i].isError()) {
                    return result[i] ;
                }
                else if (!result[i].isNumber()) {
                    return DataValue.fromError(new Error('Invalid argument type for function average')) ;
                }
                sum += result[i].toReal() ;
            }

            let avg = sum / result.length ;
            let sum2 = 0.0 ;
            for(let i = 0; i < result.length; i++) {
                sum2 += Math.pow(result[i].toReal() - avg, 2) ;
            }

            return DataValue.fromReal(Math.sqrt(sum2 / result.length)) ;
        }) ;         

        Expr.inited_ = true ;
    }

    private static flatten(args: DataValue[], result : DataValue[]) : void {
        for(let arg of args) {
            if (arg.isArray()) {
                Expr.flatten(arg.toArray(), result) ;
            }
            else {
                result.push(arg) ;
            }
        }
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

            if (str.charAt(index) === '-' || str.charAt(index) === '+') {
                index++ ;
            }
            while (index < str.length && Expr.isDigit(str.charAt(index))) {
                index++ ;
            }

            if (index < str.length && str.charAt(index) === '.') {
                index++ ;
                while (index < str.length && Expr.isDigit(str.charAt(index))) {
                    index++ ;
                }
            }

            if (index < str.length && str.charAt(index).toLowerCase() === 'e') {
                index++ ;
                if (index < str.length && (str.charAt(index) === '+' || str.charAt(index) === '-')) {
                    index++ ;
                }
                while (index < str.length && Expr.isDigit(str.charAt(index))) {
                    index++ ;
                }
            }

            let num = str.substring(start, index) ;
            
            let v : DataValue = DataValue.fromError(new Error('Invalid number')) ;
            if (num.match(/^[+-]?\d+$/)) {
                v = DataValue.fromInteger(Number.parseInt(num)) ;
            }
            else {
                let fv = Number.parseFloat(num) ;
                if (Number.isNaN(fv)) {
                    return new Error('Invalid number') ;
                }
                v = DataValue.fromReal(fv) ;
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

                if (!Expr.functions_.has(name)) {
                    return new Error('function ' + name + ' not found') ;
                }

                let func = Expr.functions_.get(name)! ;
                if (args.length !== func.getArgCount() && func.getArgCount() >= 0) {
                    return new Error('Invalid number of arguments for function ' + name) ;
                }
                ret = [index, new ExprFunction(name, args, func)] ;
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

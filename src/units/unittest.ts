import { Expr } from "../expr/expr";
import { DataValue } from "../model/datavalue";

export function runUnitTests() : void {
    testExpression("1 + 2", new Map<string, DataValue>(), DataValue.fromInteger(3)) ;
    testExpression("10 - 4", new Map<string, DataValue>(), DataValue.fromInteger(6)) ;
    testExpression("2 * 3", new Map<string, DataValue>(), DataValue.fromInteger(6)) ;
    testExpression("8 / 2", new Map<string, DataValue>(), DataValue.fromInteger(4)) ;
    testExpression("2 ^ 3", new Map<string, DataValue>(), DataValue.fromInteger(8)) ;
    testExpression("9 % 4", new Map<string, DataValue>(), DataValue.fromInteger(1)) ;
    testExpression("3 == 3", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("3 == 4", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("3 != 4", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("3 != 3", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("3 < 4", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("3 < 3", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression ("4 < 3", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("3 <= 4", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("3 <= 3", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("4 <= 3", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("3 > 4", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("3 > 3", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("4 > 3", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("3 >= 4", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("3 >= 3", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("4 >= 3", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;

    testExpression("1 + 2 * 3", new Map<string, DataValue>(), DataValue.fromInteger(7)) ;
    testExpression("1 + 2 * 3 - 4", new Map<string, DataValue>(), DataValue.fromInteger(3)) ;
    testExpression("1 + 2 * 3 - 4 / 2", new Map<string, DataValue>(), DataValue.fromInteger(5)) ;
    testExpression("(1 + 2) * (3 - 4)", new Map<string, DataValue>(), DataValue.fromInteger(-3)) ;

    testExpression("true && true", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("true && false", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("false && true", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("false && false", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression("true || true", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("true || false", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("false || true", new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression("false || false", new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;

    testExpression("'hello' + ' ' + 'world'", new Map<string, DataValue>(), DataValue.fromString("hello world")) ; 
    testExpression('"hello" < "world"', new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression('"hello" > "world"', new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression('"hello" == "world"', new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression('"hello" != "world"', new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression('"hello" <= "world"', new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression('"hello" >= "world"', new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;
    testExpression('"hello" == "hello"', new Map<string, DataValue>(), DataValue.fromBoolean(true)) ;
    testExpression('"hello" != "hello"', new Map<string, DataValue>(), DataValue.fromBoolean(false)) ;

    let vars = new Map<string, DataValue>() ;
    vars.set("x", DataValue.fromInteger(2)) ;
    vars.set("y", DataValue.fromInteger(3)) ;
    testExpression("x + y", vars, DataValue.fromInteger(5)) ;

    vars.clear() ;
    vars.set("xxx", DataValue.fromString("hello")) ;
    vars.set("yyy", DataValue.fromString(" ")) ;
    vars.set("zzz", DataValue.fromString("world")) ;
    testExpression("xxx + yyy + zzz", vars, DataValue.fromString("hello world")) ;
}

function testExpression(exprstr: string, vars: Map<string, DataValue>, expected: DataValue) : boolean {
    let expr = Expr.parse(exprstr) ;
    if (expr.hasError()) {
        console.log(`Error parsing expression '${expr.getString()}: ${expr.getErrorMessage()} `) ;
        return false ;
    }

    let v = expr.evaluate(vars) ;
    if (v instanceof Error) {
        console.log("Error evaluating expression: " + v.message) ;
        return false ;
    }

    if (!v.equals(expected)) {
        console.log(`Error evaluating expression: expected ${expected.toValueString()}, got ${v.toValueString()}`) ;
        return false ;
    }

    return true ;
}
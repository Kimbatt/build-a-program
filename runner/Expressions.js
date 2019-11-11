
async function EvaluateExpression(data, parentBlock)
{
    return await expressionEvaluators[data.expressionType](data, parentBlock);
}

async function EvaluateLiteral(data, parentBlock)
{
    return {
        type: data.type,
        value: data.value
    };
}

async function EvaluateVariable(data, parentBlock)
{
    const variableValue = GetVariable(data.variableName, parentBlock).variableValue;
    return {
        type: variableValue.type,
        value: variableValue.value
    }
}

async function EvaluateUnaryBooleanExpression(data, parentBlock) // operator boolean -> boolean
{
    const { value, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsBooleanValue = (await EvaluateExpression(value, parentBlock)).value;

    switch (operator)
    {
        case "!":
            ret.value = !jsBooleanValue;
            break;
        default:
            console.error("unknown unary boolean operator: " + operator);
            break;
    }

    return ret;
}

async function EvaluateBinaryBooleanExpression(data, parentBlock) // boolean operator boolean -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsBooleanValueFirst = (await EvaluateExpression(first, parentBlock)).value;
    if (operator === "&&") // boolean short-circuit for && and ||
        ret.value = jsBooleanValueFirst && (await EvaluateExpression(first, parentBlock)).value;
    else if (operator === "||")
        ret.value = jsBooleanValueFirst || (await EvaluateExpression(first, parentBlock)).value;
    else
    {
        const jsBooleanValueSecond = (await EvaluateExpression(second, parentBlock)).value;
        switch (operator)
        {
            case "^":
                ret.value = jsBooleanValueFirst ^ jsBooleanValueSecond;
                break;
            case "==":
                ret.value = jsBooleanValueFirst === jsBooleanValueSecond;
                break;
            case "!=":
                ret.value = jsBooleanValueFirst !== jsBooleanValueSecond;
                break;
            default:
                console.error("unknown binary boolean operator: " + operator);
                break;
        }
    }

    return ret;
}

async function EvaluateUnaryNumericExpression(data, parentBlock) // operator number -> number
{
    const { value, operator } = data;

    const ret = {
        type: "number"
    }

    const jsNumberValue = (await EvaluateExpression(value, parentBlock)).value;
    switch (operator)
    {
        case "+":
            ret.value = Math.abs(jsNumberValue);
            break;
        case "-":
            ret.value = -jsNumberValue;
            break;
        case "~":
            ret.value = ~jsNumberValue;
            break;
        default:
            console.error("unknown unary numeric operator: " + operator);
            break;
    }

    return ret;
}

async function EvaluateBinaryNumericExpression(data, parentBlock) // number operator number -> number
{
    const { first, second, operator } = data;

    const ret = {
        type: "number"
    }

    const jsNumberValueFirst = (await EvaluateExpression(first, parentBlock)).value;
    const jsNumberValueSecond = (await EvaluateExpression(second, parentBlock)).value;

    switch (operator)
    {
        case "+":
            ret.value = jsNumberValueFirst + jsNumberValueSecond;
            break;
        case "-":
            ret.value = jsNumberValueFirst - jsNumberValueSecond;
            break;
        case "*":
            ret.value = jsNumberValueFirst * jsNumberValueSecond;
            break;
        case "/":
            ret.value = jsNumberValueFirst / jsNumberValueSecond;
            break;
        case "%":
            ret.value = jsNumberValueFirst % jsNumberValueSecond;
            break;
        case "**":
            ret.value = jsNumberValueFirst ** jsNumberValueSecond;
            break;
        case "&":
            ret.value = jsNumberValueFirst & jsNumberValueSecond;
            break;
        case "|":
            ret.value = jsNumberValueFirst | jsNumberValueSecond;
            break;
        case "^":
            ret.value = jsNumberValueFirst ^ jsNumberValueSecond;
            break;
        case "<<":
            ret.value = jsNumberValueFirst << jsNumberValueSecond;
            break;
        case ">>":
            ret.value = jsNumberValueFirst >> jsNumberValueSecond;
            break;
        default:
            console.error("unknown binary numeric operator: " + operator);
            break;
    }

    return ret;
}

async function EvaluateNumberComparison(data, parentBlock) // number operator number -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsNumberValueFirst = (await EvaluateExpression(first, parentBlock)).value;
    const jsNumberValueSecond = (await EvaluateExpression(second, parentBlock)).value;

    switch (operator)
    {
        case "<":
            ret.value = jsNumberValueFirst < jsNumberValueSecond;
            break;
        case ">":
            ret.value = jsNumberValueFirst > jsNumberValueSecond;
            break;
        case "<=":
            ret.value = jsNumberValueFirst <= jsNumberValueSecond;
            break;
        case ">=":
            ret.value = jsNumberValueFirst >= jsNumberValueSecond;
            break;
        case "==":
            ret.value = jsNumberValueFirst == jsNumberValueSecond;
            break;
        case "!=":
            ret.value = jsNumberValueFirst != jsNumberValueSecond;
            break;
        default:
            console.error("unknown number comparison operator: " + operator);
            break;
    }

    return ret;
}

async function EvaluateStringComparison(data, parentBlock) // string operator string -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsStringValueFirst = (await EvaluateExpression(first, parentBlock)).value;
    const jsStringValueSecond = (await EvaluateExpression(second, parentBlock)).value;

    switch (operator)
    {
        case "==":
            ret.value = jsStringValueFirst === jsStringValueSecond;
            break;
        case "!=":
            ret.value = jsStringValueFirst !== jsStringValueSecond;
            break;
        default:
            console.error("unknown string comparison operator: " + operator);
            break;
    }

    return ret;
}

async function EvaluateBinaryStringExpression(data, parentBlock) // string operator string -> string
{
    const { first, second, operator } = data;

    const ret = {
        type: "string"
    }

    const jsStringValueFirst = (await EvaluateExpression(first, parentBlock)).value;
    const jsStringValueSecond = (await EvaluateExpression(second, parentBlock)).value;

    switch (operator)
    {
        case "+":
            ret.value = jsStringValueFirst + jsStringValueSecond;
            break;
        default:
            console.error("unknown binary string operator: " + operator);
            break;
    }

    return ret;
}

async function EvaluateFunctionCall(data, parentBlock)
{
    return await HandleFunctionCall(data, parentBlock);
}

const expressionEvaluators = {
    literal: EvaluateLiteral,
    variable: EvaluateVariable,
    unaryBooleanExpression: EvaluateUnaryBooleanExpression,
    binaryBooleanExpression: EvaluateBinaryBooleanExpression,
    unaryNumericExpression: EvaluateUnaryNumericExpression,
    binaryNumericExpression: EvaluateBinaryNumericExpression,
    numberComparison: EvaluateNumberComparison,
    binaryStringExpression: EvaluateBinaryStringExpression,
    stringComparison: EvaluateStringComparison,
    functionCall: EvaluateFunctionCall
};


runner.EvaluateExpression = async function(data, parentBlock)
{
    return await runner.expressionEvaluators[data.expressionType](data, parentBlock);
};

runner.EvaluateLiteral = async function(data, parentBlock)
{
    return {
        type: data.type,
        value: data.value
    };
};

runner.EvaluateVariable = async function(data, parentBlock)
{
    const variableValue = runner.GetVariable(data.variableName, parentBlock).variableValue;
    return {
        type: variableValue.type,
        value: variableValue.value
    }
};

runner.EvaluateUnaryBooleanExpression = async function(data, parentBlock) // operator boolean -> boolean
{
    const { value, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsBooleanValue = (await runner.EvaluateExpression(value, parentBlock)).value;

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
};

runner.EvaluateBinaryBooleanExpression = async function(data, parentBlock) // boolean operator boolean -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsBooleanValueFirst = (await runner.EvaluateExpression(first, parentBlock)).value;
    if (operator === "&&") // boolean short-circuit for && and ||
        ret.value = jsBooleanValueFirst && (await runner.EvaluateExpression(second, parentBlock)).value;
    else if (operator === "||")
        ret.value = jsBooleanValueFirst || (await runner.EvaluateExpression(second, parentBlock)).value;
    else
    {
        const jsBooleanValueSecond = (await runner.EvaluateExpression(second, parentBlock)).value;
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
};

runner.EvaluateUnaryNumericExpression = async function(data, parentBlock) // operator number -> number
{
    const { value, operator } = data;

    const ret = {
        type: "number"
    }

    const jsNumberValue = (await runner.EvaluateExpression(value, parentBlock)).value;
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
};

runner.EvaluateBinaryNumericExpression = async function(data, parentBlock) // number operator number -> number
{
    const { first, second, operator } = data;

    const ret = {
        type: "number"
    }

    const jsNumberValueFirst = (await runner.EvaluateExpression(first, parentBlock)).value;
    const jsNumberValueSecond = (await runner.EvaluateExpression(second, parentBlock)).value;

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
};

runner.EvaluateNumberComparison = async function(data, parentBlock) // number operator number -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsNumberValueFirst = (await runner.EvaluateExpression(first, parentBlock)).value;
    const jsNumberValueSecond = (await runner.EvaluateExpression(second, parentBlock)).value;

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
            ret.value = jsNumberValueFirst === jsNumberValueSecond;
            break;
        case "!=":
            ret.value = jsNumberValueFirst !== jsNumberValueSecond;
            break;
        default:
            console.error("unknown number comparison operator: " + operator);
            break;
    }

    return ret;
};

runner.EvaluateStringComparison = async function(data, parentBlock) // string operator string -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsStringValueFirst = (await runner.EvaluateExpression(first, parentBlock)).value;
    const jsStringValueSecond = (await runner.EvaluateExpression(second, parentBlock)).value;

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
};

runner.EvaluateBinaryStringExpression = async function(data, parentBlock) // string operator string -> string
{
    const { first, second, operator } = data;

    const ret = {
        type: "string"
    }

    const jsStringValueFirst = (await runner.EvaluateExpression(first, parentBlock)).value;
    const jsStringValueSecond = (await runner.EvaluateExpression(second, parentBlock)).value;

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
};

runner.EvaluateFunctionCall = async function(data, parentBlock)
{
    return await runner.HandleFunctionCall(data, parentBlock);
};

runner.expressionEvaluators = {
    numberLiteralExpression: runner.EvaluateLiteral,
    booleanLiteralExpression: runner.EvaluateLiteral,
    stringLiteralExpression: runner.EvaluateLiteral,
    variableExpression: runner.EvaluateVariable,
    unaryBooleanExpression: runner.EvaluateUnaryBooleanExpression,
    binaryBooleanExpression: runner.EvaluateBinaryBooleanExpression,
    unaryNumericExpression: runner.EvaluateUnaryNumericExpression,
    binaryNumericExpression: runner.EvaluateBinaryNumericExpression,
    numberComparison: runner.EvaluateNumberComparison,
    binaryStringExpression: runner.EvaluateBinaryStringExpression,
    stringComparison: runner.EvaluateStringComparison,
    functionCall: runner.EvaluateFunctionCall
};

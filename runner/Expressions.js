
runner.EvaluateExpression = async function(data, parentBlock)
{
    const handler = runner.expressionEvaluators[data.expressionType];
    if (!handler)
    {
        console.error("unknown expression, should not happen: " + data.expressionType);
        return {
            errorType: "error",
            errorMessage: "Unknown expression type: " + data.expressionType
        };
    }
    
    return await handler(data, parentBlock);
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
    };
};

runner.EvaluateUnaryBooleanExpression = async function(data, parentBlock) // operator boolean -> boolean
{
    const { value, operator } = data;

    const ret = {
        type: "boolean"
    };

    const result = await runner.EvaluateExpression(value, parentBlock);
    if (result.hasOwnProperty("errorType"))
        return result;

    const jsBooleanValue = result.value;

    switch (operator)
    {
        case "!":
            ret.value = !jsBooleanValue;
            break;
        default:
            ret.value = false;
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
    };

    const firstResult = await runner.EvaluateExpression(first, parentBlock);
    if (firstResult.hasOwnProperty("errorType"))
        return firstResult;

    const jsBooleanValueFirst = firstResult.value;
    if (operator === "&&") // boolean short-circuit for && and ||
    {
        if (jsBooleanValueFirst === false) // if the first is false then the result must be false
            ret.value = false;
        else
        {
            const secondResult = await runner.EvaluateExpression(second, parentBlock);
            if (secondResult.hasOwnProperty("errorType"))
                return secondResult;

            ret.value = secondResult.value;
        }
    }
    else if (operator === "||")
    {
        if (jsBooleanValueFirst === true) // if the first is true then the result must be true
            ret.value = true;
        else
        {
            const secondResult = await runner.EvaluateExpression(second, parentBlock);
            if (secondResult.hasOwnProperty("errorType"))
                return secondResult;

            ret.value = secondResult.value;
        }
    }
    else
    {
        const secondResult = await runner.EvaluateExpression(second, parentBlock);
        if (secondResult.hasOwnProperty("errorType"))
            return secondResult;

        const jsBooleanValueSecond = secondResult.value;
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
                ret.value = false;
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
    };

    const result = await runner.EvaluateExpression(value, parentBlock);
    if (result.hasOwnProperty("errorType"))
        return result;

    const jsNumberValue = result.value;
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
            ret.value = 0;
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
    };

    const firstResult = await runner.EvaluateExpression(first, parentBlock);
    if (firstResult.hasOwnProperty("errorType"))
        return firstResult;

    const jsNumberValueFirst = firstResult.value;

    const secondResult = await runner.EvaluateExpression(second, parentBlock);
    if (secondResult.hasOwnProperty("errorType"))
        return secondResult;

    const jsNumberValueSecond = secondResult.value;

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
            ret.value = 0;
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
    };

    const firstResult = await runner.EvaluateExpression(first, parentBlock);
    if (firstResult.hasOwnProperty("errorType"))
        return firstResult;

    const jsNumberValueFirst = firstResult.value;

    const secondResult = await runner.EvaluateExpression(second, parentBlock);
    if (secondResult.hasOwnProperty("errorType"))
        return secondResult;

    const jsNumberValueSecond = secondResult.value;

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
            ret.value = false;
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
    };

    const firstResult = await runner.EvaluateExpression(first, parentBlock);
    if (firstResult.hasOwnProperty("errorType"))
        return firstResult;

    const jsStringValueFirst = firstResult.value;

    const secondResult = await runner.EvaluateExpression(second, parentBlock);
    if (secondResult.hasOwnProperty("errorType"))
        return secondResult;

    const jsStringValueSecond = secondResult.value;

    switch (operator)
    {
        case "==":
            ret.value = jsStringValueFirst === jsStringValueSecond;
            break;
        case "!=":
            ret.value = jsStringValueFirst !== jsStringValueSecond;
            break;
        default:
            ret.value = false;
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
    };

    const firstResult = await runner.EvaluateExpression(first, parentBlock);
    if (firstResult.hasOwnProperty("errorType"))
        return firstResult;

    const jsStringValueFirst = firstResult.value;

    const secondResult = await runner.EvaluateExpression(second, parentBlock);
    if (secondResult.hasOwnProperty("errorType"))
        return secondResult;

    const jsStringValueSecond = secondResult.value;

    switch (operator)
    {
        case "+":
            ret.value = jsStringValueFirst + jsStringValueSecond;
            break;
        default:
            ret.value = "";
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


function GetVariable(variableName, parentBlock)
{
    let currentBlock = parentBlock;
    while (currentBlock)
    {
        variable = currentBlock.variables[variableName];
        if (variable)
            return variable;

        currentBlock = currentBlock.parent;
    }

    // should not happen, variables should be checked before running
    console.error("cannot find variable, should not happen: " + variableName);
    return null;
}

/// statement handlers

function HandleBlockStatement(data, parentBlock)
{
    const { block } = data;
    const thisBlock = {
        parentBlock: parentBlock,
        childBlocks: [],
        variables: {}
    };

    const statements = block.statements;

    for (let i = 0; i < statements.length; ++i)
    {
        const statement = statements[i];

        const handler = statementHandlers[statement.statementType];
        if (!handler)
        {
            console.error("unknown statement, should not happen: " + statement.statementType);
            continue;
        }

        handler(statement, thisBlock);
    }
}

function HandleIfStatement(data, parentBlock)
{
    const { conditions, blocks, elseBlock } = data;

    for (let i = 0; i < conditions.length; ++i)
    {
        const conditionValue = EvaluateExpression(conditions[i], parentBlock);
        if (conditionValue.value /* === true */)
        {
            HandleBlockStatement(blocks[i], parentBlock);
            return;
        }
    }

    // no conditions met, handle else block if any
    if (elseBlock)
    {
        HandleBlockStatement(elseBlock, parentBlock);
    }
}

function HandleWhileStatement(data, parentBlock)
{
    const { condition, block } = data;
    while (EvaluateExpression(condition, parentBlock).value /* === true */)
    {
        HandleBlockStatement(block, parentBlock);
    }
}

const builtInFunctions = {
    write: (...params) =>
    {
        console.log(...params.map(param => param.value));
    }
};

function HandleFunctionCall(data, parentBlock)
{
    const { functionName, parameters } = data;

    const parameterValues = [];
    for (let i = 0; i < parameters.length; ++i)
    {
        const param = parameters[i];
        parameterValues.push(EvaluateExpression(param, parentBlock));
    }

    const builtInFunction = builtInFunctions[functionName];
    if (builtInFunction)
    {
        builtInFunction(...parameterValues);
        return;
    }

    // NYI
}

function HandleVariableDeclaration(data, parentBlock)
{
    const { variableName, variableValue } = data;

    parentBlock.variables[variableName] = {
        variableValue: {
            // copy
            type: variableValue.type,
            value: variableValue.value
        },
        variableName: variableName
    };
}

function HandleVariableAssignment(data, parentBlock)
{
    const { variableName, newVariableValue } = data;
    let variable = GetVariable(variableName, parentBlock);

    variable.variableValue = EvaluateExpression(newVariableValue, parentBlock);
}

const statementHandlers = {
    block: HandleBlockStatement,
    ifStatement: HandleIfStatement,
    whileStatement: HandleWhileStatement,
    functionCall: HandleFunctionCall,
    variableDeclaration: HandleVariableDeclaration,
    variableAssignment: HandleVariableAssignment
};

/// expression evaluators

function EvaluateExpression(data, parentBlock)
{
    return expressionEvaluators[data.expressionType](data, parentBlock);
}

function EvaluateLiteral(data, parentBlock)
{
    return {
        type: data.type,
        value: data.value
    };
}

function EvaluateVariable(data, parentBlock)
{
    const variableValue = GetVariable(data.variableName, parentBlock).variableValue;
    return {
        type: variableValue.type,
        value: variableValue.value
    }
}

function EvaluateUnaryBooleanExpression(data, parentBlock) // operator boolean -> boolean
{
    const { value, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsBooleanValue = EvaluateExpression(value, parentBlock).value;

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

function EvaluateBinaryBooleanExpression(data, parentBlock) // boolean operator boolean -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsBooleanValueFirst = EvaluateExpression(first, parentBlock).value;
    const jsBooleanValueSecond = EvaluateExpression(second, parentBlock).value;

    switch (operator)
    {
        case "&&":
            ret.value = jsBooleanValueFirst && jsBooleanValueSecond;
            break;
        case "||":
            ret.value = jsBooleanValueFirst || jsBooleanValueSecond;
            break;
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

    return ret;
}

function EvaluateUnaryNumericExpression(data, parentBlock) // operator number -> number
{
    const { value, operator } = data;

    const ret = {
        type: "number"
    }

    const jsNumberValue = EvaluateExpression(value, parentBlock).value;
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

function EvaluateBinaryNumericExpression(data, parentBlock) // number operator number -> number
{
    const { first, second, operator } = data;

    const ret = {
        type: "number"
    }

    const jsNumberValueFirst = EvaluateExpression(first, parentBlock).value;
    const jsNumberValueSecond = EvaluateExpression(second, parentBlock).value;

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

function EvaluateNumberComparison(data, parentBlock) // number operator number -> boolean
{
    const { first, second, operator } = data;

    const ret = {
        type: "boolean"
    }

    const jsNumberValueFirst = EvaluateExpression(first, parentBlock).value;
    const jsNumberValueSecond = EvaluateExpression(second, parentBlock).value;

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

const expressionEvaluators = {
    literal: EvaluateLiteral,
    variable: EvaluateVariable,
    unaryBooleanExpression: EvaluateUnaryBooleanExpression,
    binaryBooleanExpression: EvaluateBinaryBooleanExpression,
    unaryNumericExpression: EvaluateUnaryNumericExpression,
    binaryNumericExpression: EvaluateBinaryNumericExpression,
    numberComparison: EvaluateNumberComparison
};

function RunProgram(mainFunction)
{
    HandleBlockStatement(mainFunction, null);
}

function CreateTestProgram()
{
    const mainFunction = {
        parameters: [],
        block: {
            statementType: "block",
            statements: [
                {
                    statementType: "variableDeclaration", // only literals at declaration
                    variableName: "asd",
                    variableValue: {
                        expressionType: "literal",
                        type: "number",
                        value: 17
                    }
                }, {
                    statementType: "variableAssignment",
                    variableName: "asd",
                    newVariableValue: {
                        expressionType: "binaryNumericExpression",
                        first: {
                            expressionType: "variable",
                            variableName: "asd",
                        },
                        second: {
                            expressionType: "literal",
                            type: "number",
                            value: 9
                        },
                        operator: "*"
                    }
                }, {
                    statementType: "functionCall",
                    functionName: "write",
                    parameters: [
                        {
                            expressionType: "variable",
                            variableName: "asd"
                        }
                    ]
                }
            ]
        }
    };

    RunProgram(mainFunction);
}

CreateTestProgram();
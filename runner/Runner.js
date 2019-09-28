
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

function HandleBlockStatement(block, parentBlock)
{
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
        variableValue: variableValue,
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
    return data.literalValue;
}

function EvaluateVariable(data, parentBlock)
{
    return GetVariable(data.variableName, parentBlock).variableValue;
}

const expressionEvaluators = {
    literal: EvaluateLiteral,
    variable: EvaluateVariable,
};

function RunProgram(mainFunction)
{
    HandleBlockStatement(mainFunction.block, null);
}

function CreateTestProgram()
{
    const mainFunction = {
        parameters: [],
        block: {
            type: "statement",
            statementType: "block",
            statements: [
                {
                    type: "statement",
                    statementType: "variableDeclaration", // only literals at declaration
                    variableName: "asd",
                    variableValue: {
                        type: "number",
                        value: 0
                    }
                }, {
                    type: "statement",
                    statementType: "variableAssignment",
                    variableName: "asd",
                    newVariableValue: {
                        type: "expression",
                        expressionType: "literal",
                        literalValue: {
                            type: "number",
                            value: 50
                        }
                    }
                }, {
                    type: "statement",
                    statementType: "functionCall",
                    functionName: "write",
                    parameters: [
                        {
                            type: "expression",
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

function HandleBlockStatement(data, parentBlock)
{
    const { statements } = data;
    const thisBlock = {
        parentBlock: parentBlock,
        childBlocks: [],
        variables: {}
    };

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
        ConsoleWrite(...params.map(param => param.value));
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
    const { variableName, variableType } = data;

    const variable =  {
        variableValue: {
            type: variableType,
            value: null
        },
        variableName: variableName
    };

    switch (variableType)
    {
        case "number":
            variable.variableValue.value = 0;
            break;
        case "string":
            variable.variableValue.value = "";
            break;
        case "boolean":
            variable.variableValue.value = false;
            break;
    }

    parentBlock.variables[variableName] = variable;
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

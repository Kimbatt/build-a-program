
runner.blockStatementCounter = 0;
runner.blockStatementMaxCount = 100; // check time every 100 block statements
runner.lastFrameCheckTime = 0;
runner.maxFrameTime = 1000 / 60;

runner.HandleBlockStatement = async function(data, parentBlock)
{
    const { statements } = data;
    const thisBlock = {
        parentBlock: parentBlock,
        variables: {}
    };

    // blocks statements are common in most programs, so we can check here if we should pause for a little, so the browser won't freeze
    if (++runner.blockStatementCounter === runner.blockStatementMaxCount)
    {
        runner.blockStatementCounter = 0;
        const now = performance.now();
        if (now > runner.lastFrameCheckTime + runner.maxFrameTime)
        {
            // wait for a browser update
            runner.lastFrameCheckTime = now;
            await WaitImmediate();
        }
    }

    for (let i = 0; i < statements.length; ++i)
    {
        const statement = statements[i];

        const handler = runner.statementHandlers[statement.statementType];
        if (!handler)
        {
            console.error("unknown statement, should not happen: " + statement.statementType);
            continue;
        }

        await handler(statement, thisBlock);
    }
};

runner.HandleIfStatement = async function(data, parentBlock)
{
    const { conditions, blocks, elseBlock } = data;

    for (let i = 0; i < conditions.length; ++i)
    {
        const conditionValue = await runner.EvaluateExpression(conditions[i], parentBlock);
        if (conditionValue.value /* === true */)
        {
            await runner.HandleBlockStatement(blocks[i], parentBlock);
            return;
        }
    }

    // no conditions met, handle else block if any
    if (elseBlock)
        await runner.HandleBlockStatement(elseBlock, parentBlock);
};

runner.HandleWhileStatement = async function(data, parentBlock)
{
    const { condition, block } = data;
    while ((await runner.EvaluateExpression(condition, parentBlock)).value /* === true */)
    {
        await runner.HandleBlockStatement(block, parentBlock);
    }
};

runner.maxCallStackSize = 200;
runner.currentCallStackSize = 0;
runner.HandleFunctionCall = async function(data, parentBlock)
{
    ++runner.currentCallStackSize;
    // TODO: throw an exception if max call stack size is exceeded

    const parameterValues = [];
    for (let param of data.parameters)
        parameterValues.push(await runner.EvaluateExpression(param, parentBlock));

    let result;

    const builtinFunction = builtInFunctions.getOwnProperty(data.functionName);
    if (builtinFunction)
    {
        const func = builtinFunction.func;
        // only await if the function is async (builtin functions are usually not)
        if (func.constructor.name === "AsyncFunction")
            result = await func(parameterValues);
        else
            result = func(parameterValues);
    }
    else
    {
        // custom function
        // TODO: return values
        result = await runner.RunFunction(runner.currentlyRunningProgram[data.functionName], parameterValues);
    }

    --runner.currentCallStackSize;
    return result;
};

runner.HandleVariableDeclaration = async function(data, parentBlock)
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
};

runner.HandleVariableAssignment = async function(data, parentBlock)
{
    const { variableName, newVariableValue } = data;
    let variable = runner.GetVariable(variableName, parentBlock);

    variable.variableValue = await runner.EvaluateExpression(newVariableValue, parentBlock);
};

runner.statementHandlers = {
    block: runner.HandleBlockStatement,
    ifStatement: runner.HandleIfStatement,
    whileStatement: runner.HandleWhileStatement,
    functionCall: runner.HandleFunctionCall,
    variableDeclaration: runner.HandleVariableDeclaration,
    variableAssignment: runner.HandleVariableAssignment
};

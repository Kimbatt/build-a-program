
runner.blockStatementCounter = 0;
runner.blockStatementMaxCount = 100; // check time every 100 block statements
runner.lastFrameCheckTime = 0;
runner.maxFrameTime = 1000 / 60;
runner.aborted = false;

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
            Console.FinalizeWrite();

            // wait for a browser update
            runner.lastFrameCheckTime = now;
            await WaitImmediate();

            if (runner.aborted)
            {
                runner.aborted = false;
                return {
                    errorType: "aborted"
                }
            }
        }
    }

    for (let i = 0; i < statements.length; ++i)
    {
        const statement = statements[i];

        const handler = runner.statementHandlers[statement.statementType];
        if (!handler)
        {
            console.error("unknown statement, should not happen: " + statement.statementType);
            return {
                errorType: "error",
                errorMessage: "Unknown statement type: " + statement.statementType
            };
        }

        const statementResult = await handler(statement, thisBlock);
        if (statementResult.hasOwnProperty("errorType"))
            return statementResult;
    }

    return {};
};

runner.HandleIfStatement = async function(data, parentBlock)
{
    const { conditions, blocks, elseBlock } = data;

    for (let i = 0; i < conditions.length; ++i)
    {
        const conditionValue = await runner.EvaluateExpression(conditions[i], parentBlock);
        if (conditionValue.hasOwnProperty("errorType"))
            return conditionValue;

        if (conditionValue.value /* === true */)
        {
            const statementResult = await runner.HandleBlockStatement(blocks[i], parentBlock);
            if (statementResult.hasOwnProperty("errorType"))
                return statementResult;

            return {};
        }
    }

    // no conditions met, handle else block if any
    if (elseBlock)
    {
        const statementResult = await runner.HandleBlockStatement(elseBlock, parentBlock);
        if (statementResult.hasOwnProperty("errorType"))
            return statementResult;
    }

    return {};
};

runner.HandleWhileStatement = async function(data, parentBlock)
{
    const { condition, block } = data;
    while (true)
    {
        const expressionValue = await runner.EvaluateExpression(condition, parentBlock);
        if (expressionValue.hasOwnProperty("errorType"))
            return expressionValue;

        if (expressionValue.value /* === true */)
        {
            const statementResult = await runner.HandleBlockStatement(block, parentBlock);
            if (statementResult.hasOwnProperty("errorType"))
                return statementResult;
        }
        else
            break;
    }

    return {};
};

runner.maxCallStackSize = 200;
runner.currentCallStackSize = 0;
runner.HandleFunctionCall = async function(data, parentBlock)
{
    if (runner.currentCallStackSize > runner.maxCallStackSize)
    {
        return {
            errorType: "error",
            exceptionType: "RecursionError",
            errorMessage: "Maximum recursion depth reached"
        }
    }

    ++runner.currentCallStackSize;

    const parameterValues = [];
    for (let param of data.parameters)
    {
        const expressionValue = await runner.EvaluateExpression(param, parentBlock);
        if (expressionValue.hasOwnProperty("errorType"))
            return expressionValue;
        
        parameterValues.push(expressionValue);
    }

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

        if (result === undefined)
            result = {};
    }
    else
    {
        // custom function

        // result will contain errorType if needed
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

    return {};
};

runner.HandleVariableAssignment = async function(data, parentBlock)
{
    const { variableName, newVariableValue } = data;
    let variable = runner.GetVariable(variableName, parentBlock);

    const expressionValue = await runner.EvaluateExpression(newVariableValue, parentBlock);
    if (expressionValue.hasOwnProperty("errorType"))
        return expressionValue;

    variable.variableValue = expressionValue;

    return {};
};

runner.HandleReturnStatement = async function(data, parentBlock)
{
    if (data.hasOwnProperty("returnValue"))
    {
        const expressionValue = await runner.EvaluateExpression(data.returnValue, parentBlock);
        if (expressionValue.hasOwnProperty("errorType"))
            return expressionValue;

        expressionValue.errorType = "return";
        return expressionValue;
    }
    else
    {
        return {
            errorType: "return"
        };
    }
};

runner.statementHandlers = {
    block: runner.HandleBlockStatement,
    ifStatement: runner.HandleIfStatement,
    whileStatement: runner.HandleWhileStatement,
    functionCall: runner.HandleFunctionCall,
    variableDeclaration: runner.HandleVariableDeclaration,
    variableAssignment: runner.HandleVariableAssignment,
    returnStatement: runner.HandleReturnStatement
};

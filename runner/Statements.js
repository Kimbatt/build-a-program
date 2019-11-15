
var blockStatementCounter = 0;
var blockStatementMaxCount = 100; // check time every 100 block statements
var lastFrameCheckTime = 0;
var maxFrameTime = 1000 / 60;
async function HandleBlockStatement(data, parentBlock)
{
    const { statements } = data;
    const thisBlock = {
        parentBlock: parentBlock,
        variables: {}
    };

    // blocks statements are common in most programs, so we can check here if we should pause for a little, so the browser won't freeze
    if (++blockStatementCounter === blockStatementMaxCount)
    {
        blockStatementCounter = 0;
        const now = performance.now();
        if (now > lastFrameCheckTime + maxFrameTime)
        {
            lastFrameCheckTime = now;
            consoleDiv.style.display = "";
            consoleLinesDiv.scrollTo(0, consoleLinesDiv.scrollHeight);
            await WaitImmediate();
            consoleDiv.style.display = "none";
        }
    }

    for (let i = 0; i < statements.length; ++i)
    {
        const statement = statements[i];

        const handler = statementHandlers[statement.statementType];
        if (!handler)
        {
            console.error("unknown statement, should not happen: " + statement.statementType);
            continue;
        }

        await handler(statement, thisBlock);
    }
}

async function HandleIfStatement(data, parentBlock)
{
    const { conditions, blocks, elseBlock } = data;

    for (let i = 0; i < conditions.length; ++i)
    {
        const conditionValue = await EvaluateExpression(conditions[i], parentBlock);
        if (conditionValue.value /* === true */)
        {
            await HandleBlockStatement(blocks[i], parentBlock);
            return;
        }
    }

    // no conditions met, handle else block if any
    if (elseBlock)
    {
        await HandleBlockStatement(elseBlock, parentBlock);
    }
}

async function HandleWhileStatement(data, parentBlock)
{
    const { condition, block } = data;
    while ((await EvaluateExpression(condition, parentBlock)).value /* === true */)
    {
        await HandleBlockStatement(block, parentBlock);
    }
}

async function HandleFunctionCall(data, parentBlock)
{
    const parameterValues = [];
    for (let param of data.parameters)
        parameterValues.push(await EvaluateExpression(param, parentBlock));

    const func = data.functionData.func;
    if (func) // built-in functions
    {
        // only await if the function is async (builtin functions are not)
        if (func.constructor.name === "AsyncFunction")
            return await func(parameterValues);
        else
            return func(parameterValues);
    }
    else
    {
        // custom function
        return await RunFunction(currentlyRunningProgram[data.functionData.name], parameterValues);
    }
}

async function HandleVariableDeclaration(data, parentBlock)
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

async function HandleVariableAssignment(data, parentBlock)
{
    const { variableName, newVariableValue } = data;
    let variable = GetVariable(variableName, parentBlock);

    variable.variableValue = await EvaluateExpression(newVariableValue, parentBlock);
}

const statementHandlers = {
    block: HandleBlockStatement,
    ifStatement: HandleIfStatement,
    whileStatement: HandleWhileStatement,
    functionCall: HandleFunctionCall,
    variableDeclaration: HandleVariableDeclaration,
    variableAssignment: HandleVariableAssignment
};

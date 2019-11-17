
const runner = {};

const customFunctions = {};
const customFunctionsByName = {};

runner.GetVariable = function(variableName, parentBlock)
{
    let currentBlock = parentBlock;
    while (currentBlock)
    {
        variable = currentBlock.variables.getOwnProperty(variableName);
        if (variable)
            return variable;

        currentBlock = currentBlock.parentBlock;
    }

    // should not happen, variables should be checked before running
    console.error("cannot find variable, should not happen: " + variableName);
    return null;
};

runner.RunFunction = async function(func, parameterValues)
{
    const functionBlock = {
        parentBlock: null,
        variables: {}
    };

    for (let i = 0; i < parameterValues.length; ++i)
    {
        const parameterDefinition = func.parameters[i];
        const parameterValue = parameterValues[i];
        const parameterName = parameterDefinition.name;
        
        functionBlock.variables[parameterName] = {
            variableValue: {
                type: parameterValue.type,
                value: parameterValue.value
            },
            variableName: parameterName
        };
    }

    await runner.HandleBlockStatement(func.block, functionBlock);
};

runner.currentlyRunningProgram = undefined;
runner.RunProgram = async function(program)
{
    runner.currentlyRunningProgram = program;
    runner.ProgramStartedRunning();

    await runner.RunFunction(program["Main"], []);

    runner.currentlyRunningProgram = undefined;
    runner.ProgramFinishedRunning();
};

runner.ProgramStartedRunning = function()
{
    runner.blockStatementCounter = 0;
    const runButton = document.getElementById("run-button");
    const spinner = document.getElementById("spinner");
    runButton.disabled = true;
    runButton.innerText = "Running";
    spinner.classList.remove("loading-spinner-hidden");
    spinner.classList.add("loading-spinner-visible");
};

runner.ProgramFinishedRunning = function()
{
    const runButton = document.getElementById("run-button");
    runButton.disabled = false;
    runButton.innerText = "Run";
    spinner.classList.remove("loading-spinner-visible");
    spinner.classList.add("loading-spinner-hidden");
    Console.CancelRead();
    Console.Notification("Program finished running");
};

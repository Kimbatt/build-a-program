
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

    // should not happen, variables are checked before running
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

    const returned = await runner.HandleBlockStatement(func.block, functionBlock);
    if (returned.hasOwnProperty("errorType"))
    {
        if (returned.errorType === "return")
        {
            const returnedType = returned.getOwnProperty("type");
            const returnedValue = returned.getOwnProperty("value");
            
            if (returnedType !== undefined && returnedValue !== undefined)
            {
                // return with values
                return {
                    type: returnedType,
                    value: returnedValue
                }
            }
            else
                return {}; // return from void function (no values)
        }
        else
            return returned;
    }

    // no explicit return statement
    // if the function is void, then it's fine
    // if it's not void, then we return the default value
    switch (func.returnType)
    {
        case "number":
        {
            return {
                type: "number",
                value: 0
            };
        }
        case "boolean":
        {
            return {
                type: "boolean",
                value: false
            };
        }
        case "string":
        {
            return {
                type: "string",
                value: ""
            };
        }
        default:
            return {};
    }
};

runner.running = false;
runner.RunButtonClicked = function()
{
    if (runner.running)
    {
        runner.aborted = true;
        if (Console.enterPressedCallback)
        {
            Console.enterPressedCallback();
            Console.enterPressedCallback = undefined;
        }
    }
    else
        compiler.CompileAndRun();
};

runner.currentlyRunningProgram = undefined;
runner.RunProgram = async function(program)
{
    runner.currentlyRunningProgram = program;
    runner.ProgramStartedRunning();

    const result = await runner.RunFunction(program["Main"], []);
    let success = true;
    if (result.hasOwnProperty("errorType"))
    {
        switch (result.errorType)
        {
            case "error":
                Console.Error("Runtime error: " + result.errorMessage);
                success = false;
                break;
            case "aborted":
                Console.Error("Program running was aborted");
                success = false;
                break;
        }
    }

    runner.currentlyRunningProgram = undefined;
    runner.ProgramFinishedRunning(success);
};

runner.ProgramStartedRunning = function()
{
    runner.running = true;
    runner.blockStatementCounter = 0;
    runner.currentCallStackSize = 0;
    runner.aborted = false;
    const runButton = document.getElementById("run-button");
    const spinner = document.getElementById("spinner");
    runButton.innerText = "Stop";
    spinner.classList.remove("loading-spinner-hidden");
    spinner.classList.add("loading-spinner-visible");
};

runner.ProgramFinishedRunning = function(success)
{
    runner.running = false;
    runner.blockStatementCounter = 0;
    runner.currentCallStackSize = 0;
    runner.aborted = false;
    const runButton = document.getElementById("run-button");
    runButton.innerText = "Run";
    spinner.classList.remove("loading-spinner-visible");
    spinner.classList.add("loading-spinner-hidden");
    Console.CancelRead();

    if (success)
        Console.Notification("Program finished running");
};

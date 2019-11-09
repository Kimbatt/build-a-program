
const dragArea = document.getElementById("main-drag-area");
const mainFunction = new FunctionBody(dragArea, "Main");
mainFunction.element.style.left = "100px";
mainFunction.element.style.top = "100px";

let consoleIsVisible = false;
function ConsoleShow()
{
    consoleIsVisible = true;

    const consoleHidden = document.getElementById("console-hidden");
    consoleHidden.classList.remove("console-hidden-visible");
    consoleHidden.classList.add("console-hidden-hidden");

    consoleDiv.classList.remove("console-hidden");
    consoleDiv.classList.add("console-visible");
}

function ConsoleHide()
{
    consoleIsVisible = false;

    const consoleHidden = document.getElementById("console-hidden");
    consoleHidden.classList.remove("console-hidden-hidden");
    consoleHidden.classList.add("console-hidden-visible");

    consoleDiv.classList.remove("console-visible");
    consoleDiv.classList.add("console-hidden");
}

const consoleLinesPool = []; // reuse console lines for better performance
function GetConsoleLineDiv(text, className)
{
    let div;
    if (consoleLinesPool.length === 0)
        div = document.createElement("div");
    else
        div = consoleLinesPool.pop();

    div.innerText = text;
    div.className = className;
    return div;
}

const consoleLinesDiv = document.getElementById("console-lines-div");
const consoleDiv = document.getElementById("console");
function CheckConsoleMaxSize()
{
    while (consoleLinesDiv.children.length >= 1000)
    {
        const line = consoleLinesDiv.firstChild;
        consoleLinesPool.push(line);
        consoleLinesDiv.removeChild(line);
    }
}

function ConsoleWrite(...args)
{
    consoleLinesDiv.appendChild(GetConsoleLineDiv(args.join(" "), "console-line"));
    CheckConsoleMaxSize();
}

function ConsoleError(...args)
{
    consoleLinesDiv.appendChild(GetConsoleLineDiv(args.join(" "), "console-line console-line-error"));
    CheckConsoleMaxSize();
}

function ConsoleClear()
{
    while (consoleLinesDiv.lastChild)
    {
        const line = consoleLinesDiv.lastChild;
        consoleLinesPool.push(line);
        consoleLinesDiv.removeChild(line);
    }
}

function ShowFunctionInfo(show, func)
{
    if (!show)
    {
        document.getElementById("function-viewer-overlay").style.display = "none";
        return;
    }

    const functionViewerDiv = document.getElementById("function-viewer");

    functionViewerDiv.querySelector("#function-viewer-function-name").innerText = func.name;
    functionViewerDiv.querySelector("#function-viewer-function-description").innerText = func.description;
    functionViewerDiv.querySelector("#function-viewer-function-return-type").innerText = func.returnType;

    const tableRows =  functionViewerDiv.querySelector(".function-viewer-parameters-table tbody");
    const firstRow = tableRows.children[0];
    while (tableRows.lastChild !== firstRow)
        tableRows.removeChild(tableRows.lastChild);

    if (func.parameters.length === 0)
    {
        functionViewerDiv.querySelector("#function-viewer-no-parameters-text").style.display = "";
        functionViewerDiv.querySelector(".function-viewer-parameters-table").style.display = "none";
    }
    else
    {
        for (let parameter of func.parameters)
        {
            const row = document.createElement("tr");

            const nameTd = document.createElement("td");
            nameTd.innerText = parameter.name;
            row.appendChild(nameTd);

            const typeTd = document.createElement("td");
            typeTd.innerText = parameter.type;
            row.appendChild(typeTd);

            const descriptionTd = document.createElement("td");
            descriptionTd.innerText = parameter.description;
            row.appendChild(descriptionTd);

            tableRows.appendChild(row);
        }

        functionViewerDiv.querySelector("#function-viewer-no-parameters-text").style.display = "none";
        functionViewerDiv.querySelector(".function-viewer-parameters-table").style.display = "";
    }

    document.getElementById("function-viewer-overlay").style.display = "flex";
}

function CreateFunctionInfoLine(func)
{
    const container = document.createElement("div");
    container.style.position = "relative";

    const line = document.createElement("div");
    line.className = "function-selector-line";
    line.onclick = ev =>
    {
        ev.stopPropagation();
        document.getElementById("function-selector-overlay").style.display = "none";
        functionSelectedCallback && functionSelectedCallback(func);
    };

    const functionInfoDiv = document.createElement("div");
    functionInfoDiv.className = "function-info";

    const functionNameDiv = document.createElement("div");
    functionNameDiv.className = "function-name";
    functionNameDiv.innerText = func.name + " : (" + func.parameters.map(param => param.type).join(", ") + ") → " + func.returnType;

    const functionDescriptionDiv = document.createElement("div");
    functionDescriptionDiv.className = "function-description";
    functionDescriptionDiv.innerText = func.description;

    functionInfoDiv.appendChild(functionNameDiv);
    functionInfoDiv.appendChild(functionDescriptionDiv);

    const detailsButton = document.createElement("button");
    detailsButton.className = "function-details-button buttonbutton";
    detailsButton.innerText = "Details";
    detailsButton.onclick = ev =>
    {
        ev.stopPropagation();
        ShowFunctionInfo(true, func);
    };

    line.appendChild(functionInfoDiv);

    container.appendChild(line);
    container.appendChild(detailsButton);

    return container;
}

let functionSelectedCallback;
function PrepareBuiltInFunctionsList()
{
    const functionsListDiv = document.getElementById("function-selector").querySelector("#builtin-function-list");
    for (let functionName in builtInFunctions)
    {
        const func = builtInFunctions[functionName];
        const functionLineDiv = CreateFunctionInfoLine(func);
        functionsListDiv.appendChild(functionLineDiv);
    }
}

PrepareBuiltInFunctionsList();

const customFunctions = {
    
    Test123: {
        name: "Test123",
        description: "test description",
        returnType: "void",
        parameters: [
            {
                name: "str",
                type: "string",
                description: "test string"
            }
        ],
        func: params =>
        {
            console.log("test function", params[0].value);
        }
    }
};

const customFunctionsInfoLines = {};
function UpdateCustomFunctionLines()
{
    const functionsListDiv = document.getElementById("function-selector").querySelector("#custom-function-list");

    // remove deleted functions
    for (let customFunctionName in customFunctionsInfoLines)
    {
        const func = customFunctions[customFunctionName];
        if (!func)
        {
            // this function has a line, but the function was deleted
            const functionLineDiv = customFunctionsInfoLines[customFunctionName];
            functionsListDiv.removeChild(functionLineDiv);
            delete customFunctionsInfoLines[customFunctionName];
        }
    }

    // look for new functions
    for (let customFunctionName in customFunctions)
    {
        let functionLineDiv = customFunctionsInfoLines[customFunctionName];
        if (!functionLineDiv)
        {
            // this function does not have a line yet
            const func = customFunctions[customFunctionName];
            functionLineDiv = CreateFunctionInfoLine(func);
            functionsListDiv.appendChild(functionLineDiv);
            customFunctionsInfoLines[customFunctionName] = functionLineDiv;
        }
    }
}

function ShowAvailableFunctions(show)
{
    if (show)
        UpdateCustomFunctionLines();
    else
        functionSelectedCallback && functionSelectedCallback(null);

    const funcitonSelector = document.getElementById("function-selector-overlay");
    funcitonSelector.style.display = show ? "flex" : "none";
    funcitonSelector.classList.add("not-function-editor");
    funcitonSelector.classList.remove("function-editor");
}

function ShowFunctionEditorList(show)
{
    if (show)
        UpdateCustomFunctionLines();

    const funcitonSelector = document.getElementById("function-selector-overlay");
    funcitonSelector.style.display = show ? "flex" : "none";
    funcitonSelector.classList.remove("not-function-editor");
    funcitonSelector.classList.add("function-editor");
}

function ShowFunctionEditor(show)
{
    
}

function ProgramStartedRunning()
{
    const runButton = document.getElementById("run-button");
    const spinner = document.getElementById("spinner");
    consoleDiv.style.display = "none";
    runButton.disabled = true;
    runButton.innerText = "Running";
    spinner.style.visibility = "";
    spinner.style.opacity = 1;
}

function ProgramFinishedRunning()
{
    const runButton = document.getElementById("run-button");
    consoleDiv.style.display = "";
    runButton.disabled = false;
    runButton.innerText = "Run";
    spinner.style.visibility = "hidden";
    spinner.style.opacity = 0;
}
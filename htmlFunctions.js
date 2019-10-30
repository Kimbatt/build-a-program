
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

    const consoleDiv = document.getElementById("console");
    consoleDiv.classList.remove("console-hidden");
    consoleDiv.classList.add("console-visible");
}

function ConsoleHide()
{
    consoleIsVisible = false;

    const consoleHidden = document.getElementById("console-hidden");
    consoleHidden.classList.remove("console-hidden-hidden");
    consoleHidden.classList.add("console-hidden-visible");

    const consoleDiv = document.getElementById("console");
    consoleDiv.classList.remove("console-visible");
    consoleDiv.classList.add("console-hidden");
}

function ConsoleWrite(...args)
{
    const consoleLines = document.getElementById("console-lines-div");
    const newConsoleLine = document.createElement("div");
    newConsoleLine.innerText = args.join(" ");
    newConsoleLine.className = "console-line";
    consoleLines.appendChild(newConsoleLine);

    consoleLines.scrollTo(0, consoleLines.scrollHeight);
}

function ConsoleError(...args)
{
    const consoleLines = document.getElementById("console-lines-div");
    const newConsoleLine = document.createElement("div");
    newConsoleLine.innerText = args.join(" ");
    newConsoleLine.className = "console-line console-line-error";
    consoleLines.appendChild(newConsoleLine);

    consoleLines.scrollTo(0, consoleLines.scrollHeight);
}

function ConsoleClear()
{
    const consoleLines = document.getElementById("console-lines-div");
    while (consoleLines.lastChild)
        consoleLines.removeChild(consoleLines.lastChild)
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

let functionSelectedCallback;
function PrepareBuiltInFunctionsList()
{
    const functionsListDiv = document.getElementById("function-selector").querySelector("#builtin-function-list");
    for (let functionName in builtInFunctions)
    {
        const func = builtInFunctions[functionName];

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
        functionsListDiv.appendChild(container);
    }
}

PrepareBuiltInFunctionsList();

const customFunctions = {};
function ShowAvailableFunctions(show)
{
    if (!show)
        functionSelectedCallback && functionSelectedCallback(null);

    document.getElementById("function-selector-overlay").style.display = show ? "flex" : "none";
}

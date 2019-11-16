
const functionViewer = {};

functionViewer.ShowFunctionInfo = function(show, func)
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

    document.getElementById("function-viewer-overlay").style.display = "";
};

functionViewer.CreateFunctionInfoLine = function(func)
{
    const container = document.createElement("div");
    container.style.position = "relative";

    const line = document.createElement("div");
    line.className = "function-selector-line";
    line.onclick = () =>
    {
        // if in function editor, then switch to the clicked function
        const isFunctionEditor = document.getElementById("function-selector-overlay").classList.contains("function-editor");
        if (isFunctionEditor)
            elementHandler.SwitchToFunction(func.guid, true);
        else
        {
            document.getElementById("function-selector-overlay").style.display = "none";
            functionViewer.functionSelectedCallback && functionViewer.functionSelectedCallback(func);
        }
    };

    const functionInfoDiv = document.createElement("div");
    functionInfoDiv.className = "function-info";

    const functionNameDiv = document.createElement("div");
    functionNameDiv.className = "function-name";
    functionNameDiv.innerText = func.name + " : (" + func.parameters.map(param => param.type).join(", ") + ") → " + func.returnType;

    const functionDescriptionDiv = document.createElement("div");
    functionDescriptionDiv.className = "function-description";
    if (func.description)
        functionDescriptionDiv.innerText = func.description;
    else
        functionDescriptionDiv.innerHTML = "<span style=\"font-style: italic; color: #808080;\">No description provided</span>";

    functionInfoDiv.appendChild(functionNameDiv);
    functionInfoDiv.appendChild(functionDescriptionDiv);

    const detailsButton = document.createElement("button");
    detailsButton.className = "function-details-button buttonbutton hidden-in-function-editor";
    detailsButton.innerText = "Details";
    detailsButton.style.margin = "auto 10px";
    detailsButton.onclick = () => functionViewer.ShowFunctionInfo(true, func);

    // for function editor
    const editButton = document.createElement("button");
    editButton.className = "function-details-button buttonbutton visible-in-function-editor";
    editButton.innerText = "Edit definition";
    editButton.style.width = "180px";
    editButton.style.margin = "auto 10px";
    editButton.onclick = () => functionEditor.ShowFunctionEditor(true, func, true);

    const deleteButton = document.createElement("button");
    deleteButton.className = "function-details-button buttonbutton visible-in-function-editor";
    deleteButton.innerText = "Delete";
    deleteButton.style.width = "120px";
    deleteButton.style.margin = "auto 200px";
    deleteButton.onclick = async () =>
    {
        if (await Confirm("Do you really want to delete the function \"" + func.name + "\"?"))
        {
            functionEditor.FunctionWasDeleted(func); // delete references after this

            delete customFunctionsByName[func.name];
            delete customFunctions[func.guid];
            delete elementHandler.functionBodyDragContainers[func.guid];
            delete elementHandler.functionBodies[func.guid];

            functionViewer.UpdateCustomFunctionLines();
        }
    };

    line.appendChild(functionInfoDiv);

    container.appendChild(line);
    container.appendChild(detailsButton);
    container.appendChild(editButton);
    container.appendChild(deleteButton);

    return container;
};

functionViewer.functionSelectedCallback = undefined;
(() =>
{
    // prepare built-in functions list
    const functionsListDiv = document.getElementById("function-selector").querySelector("#builtin-function-list");
    for (let functionName in builtInFunctions)
    {
        const func = builtInFunctions[functionName];
        const functionLineDiv = functionViewer.CreateFunctionInfoLine(func);
        functionsListDiv.appendChild(functionLineDiv);
    }
})();

functionViewer.customFunctionsInfoLines = {};
functionViewer.UpdateCustomFunctionLines = function()
{
    const functionsListDiv = document.getElementById("function-selector").querySelector("#custom-function-list");
    const customFunctionsInfoLines = functionViewer.customFunctionsInfoLines;

    // remove deleted functions
    for (let customFunctionGuid in customFunctionsInfoLines)
    {
        const func = customFunctions[customFunctionGuid];
        if (!func)
        {
            // this function has a line, but the function was deleted
            const functionLineDiv = customFunctionsInfoLines[customFunctionGuid];
            functionsListDiv.removeChild(functionLineDiv);
            delete customFunctionsInfoLines[customFunctionGuid];
        }
    }

    // look for new functions
    for (let customFunctionGuid in customFunctions)
    {
        let functionLineDiv = customFunctionsInfoLines[customFunctionGuid];
        if (!functionLineDiv)
        {
            // this function does not have a line yet
            const func = customFunctions[customFunctionGuid];
            functionLineDiv = functionViewer.CreateFunctionInfoLine(func);
            functionsListDiv.appendChild(functionLineDiv);
            customFunctionsInfoLines[customFunctionGuid] = functionLineDiv;
        }
    }

    if (functionEditor.currentEditedFunction)
    {
        // update the line of the edited function
        const functionLineDiv = customFunctionsInfoLines[functionEditor.currentEditedFunction.guid];
        const nextSibling = functionLineDiv.nextSibling;
        functionsListDiv.removeChild(functionLineDiv);

        const newFunctionLineDiv = functionViewer.CreateFunctionInfoLine(functionEditor.currentEditedFunction);
        customFunctionsInfoLines[functionEditor.currentEditedFunction.guid] = newFunctionLineDiv;
        functionsListDiv.insertBefore(newFunctionLineDiv, nextSibling);
    }
};

functionViewer.ShowAvailableFunctions = function(show)
{
    if (show)
        functionViewer.UpdateCustomFunctionLines();
    else
        functionViewer.functionSelectedCallback && functionViewer.functionSelectedCallback(null);

    const funcitonSelector = document.getElementById("function-selector-overlay");
    funcitonSelector.style.display = show ? "" : "none";
    funcitonSelector.classList.add("not-function-editor");
    funcitonSelector.classList.remove("function-editor");
};

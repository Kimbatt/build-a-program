
const functionEditor = {};

functionEditor.ShowFunctionEditorList = function(show)
{
    if (show)
        functionViewer.UpdateCustomFunctionLines();

    const funcitonSelector = document.getElementById("function-selector-overlay");
    funcitonSelector.style.display = show ? "flex" : "none";
    funcitonSelector.classList.remove("not-function-editor");
    funcitonSelector.classList.add("function-editor");
};

functionEditor.functionEditorHasChanged = false;
functionEditor.currentEditedFunction = undefined;

functionEditor.ShowFunctionEditor = function(show, functionData, isEdit)
{
    if (show)
    {
        if (isEdit)
            functionEditor.currentEditedFunction = functionData;

        const functionEditorDiv = document.getElementById("function-editor");
        const functionNameInput = functionEditorDiv.querySelector("#function-editor-function-name");
        const functionDescriptionInput = functionEditorDiv.querySelector("#function-editor-function-description");
        const functionReturnTypeSelector = functionEditorDiv.querySelector("#function-editor-function-return-type");
        const functionEditorParametersTable = functionEditorDiv.querySelector("#function-editor-parameters-table");
        const parametersTbody = functionEditorParametersTable.children[0];

        if (functionData)
        {
            functionNameInput.value = functionData.name;
            functionDescriptionInput.value = functionData.description;
            functionReturnTypeSelector.value = functionData.returnType;

            const functionParams = functionData.parameters;
            const numParameters = functionParams.length;
            while (parametersTbody.children.length - 1 < numParameters)
                parametersTbody.appendChild(functionEditor.CreateFunctionEditorParameterRow());

            for (let i = 0; i < numParameters; ++i)
            {
                const currentRow = parametersTbody.children[i + 1];
                const currentParam = functionParams[i];

                currentRow.children[0].children[0].value = currentParam.name;
                currentRow.children[1].children[0].value = currentParam.type;
                currentRow.children[2].children[0].value = currentParam.description;
            }
        }
        else
        {
            // new function
            functionNameInput.value = "";
            functionDescriptionInput.value = "";
            functionReturnTypeSelector.value = "void";

            while (parametersTbody.children.length > 1)
                parametersTbody.removeChild(parametersTbody.lastChild);
        }

        functionEditor.FunctionEditorParameterChanged(false); // add an empty line if needed
        functionEditor.functionEditorHasChanged = false;
    }

    document.getElementById("function-editor-overlay").style.display = show ? "" : "none";
};

functionEditor.CreateFunctionEditorParameterRow = function()
{
    const types = ["number", "string", "boolean"];

    const row = document.createElement("tr");

    const paramNameTd = document.createElement("td");
    paramNameTd.className = "function-editor-parameter-input";

    const paramNameInput = document.createElement("input");
    paramNameInput.type = "text";
    paramNameInput.className = "text-input";
    paramNameInput.style.width = "250px";
    paramNameInput.placeholder = "Type to add new parameter";
    paramNameInput.onchange = () => functionEditor.FunctionEditorParameterChanged(false);
    paramNameTd.appendChild(paramNameInput);

    const paramTypeTd = document.createElement("td");
    paramTypeTd.className = "function-editor-parameter-input";

    const paramTypeSelector = document.createElement("select");
    paramTypeSelector.className = "type-selector";
    paramTypeSelector.style.width = "100%";
    paramTypeSelector.style.height = "36px";
    paramTypeSelector.style.border = "0px";
    paramTypeSelector.oninput = () => functionEditor.FunctionEditorParameterChanged(false);
    paramTypeTd.appendChild(paramTypeSelector);

    for (let type of types)
    {
        const typeOption = document.createElement("option");
        typeOption.value = type;
        typeOption.innerText = type[0].toUpperCase() + type.substr(1);
        paramTypeSelector.appendChild(typeOption);
    }

    const paramDescriptionTd = document.createElement("td");
    paramDescriptionTd.className = "function-editor-parameter-input";

    const paramDescriptionInput = document.createElement("input");
    paramDescriptionInput.type = "text";
    paramDescriptionInput.className = "text-input";
    paramDescriptionInput.style.width = "calc(100% - 12px)";
    paramDescriptionInput.onchange = () => functionEditor.FunctionEditorParameterChanged(false);
    paramDescriptionTd.appendChild(paramDescriptionInput);

    row.appendChild(paramNameTd);
    row.appendChild(paramTypeTd);
    row.appendChild(paramDescriptionTd);

    return row;
};

/**
 * @param {HTMLInputElement} input 
 */
functionEditor.FunctionEditorParameterChanged = function(setChangedOnly)
{
    //setChangedOnly: don't check if we need to add a new row, just set functionEditor.functionEditorHasChanged to true

    functionEditor.functionEditorHasChanged = true;

    if (!setChangedOnly)
    {
        const functionEditorParametersTable = document.getElementById("function-editor-parameters-table");
        const tbody = functionEditorParametersTable.children[0];
        const rows = tbody.children;

        // if we have an empty row, then no need to add a new one
        let emptyRow = undefined;
        let lastRowIsEmpty = false;

        // 0th row is the header
        for (let i = 1; i < rows.length; ++i)
        {
            const currentRow = rows[i];
            const nameInput = currentRow.children[0].children[0];
            const descriptionInput = currentRow.children[2].children[0];
            if (nameInput.value === "" && descriptionInput.value === "")
            {
                if (i === rows.length - 1)
                {
                    lastRowIsEmpty = true;
                }
                else
                {
                    emptyRow = currentRow;
                    tbody.removeChild(currentRow);
                    --i; // ^---- rows.length becomes 1 less here
                }
            }
        }

        if (!lastRowIsEmpty)
            tbody.appendChild(emptyRow || functionEditor.CreateFunctionEditorParameterRow());
    }
};

functionEditor.ExitFunctionEditor = async function(save)
{
    const functionEditorOverlay = document.getElementById("function-editor-overlay");
    const functionEditorDiv = document.getElementById("function-editor");
    const errorText = functionEditorDiv.querySelector("#function-editor-error-text");

    if (!save)
    {
        if (!functionEditor.functionEditorHasChanged || await Confirm("Exit without saving?", "Yes", "Cancel"))
        {
            functionEditorOverlay.style.display = "none";
            errorText.style.display = "none";
            functionEditor.currentEditedFunction = undefined;
        }

        return;
    }

    function CheckName(name)
    {
        if (name === "")
            return " cannot be empty";

        if (/^[0-9]/.test(name))
            return " must not start with a number";

        if (name.includes(" "))
            return " must not contain spaces";

        if (/[!"#%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/.test(name))
            return " cannot contain any of the following characters: ! \" # % & ' ( ) * + , . / : ; < = > ? @ [ \\ ] ^ ` { | } ~";

        if (name === "hasOwnProperty")
            return " cannot be \"hasOwnProperty\", this name is reserved in JavaScript";

        return "OK";
    }
    
    const functionNameInput = functionEditorDiv.querySelector("#function-editor-function-name");
    const functionDescriptionInput = functionEditorDiv.querySelector("#function-editor-function-description");
    const functionReturnTypeSelector = functionEditorDiv.querySelector("#function-editor-function-return-type");
    const functionEditorParametersTable = functionEditorDiv.querySelector("#function-editor-parameters-table");
    const parametersTbody = functionEditorParametersTable.children[0];

    let checkResult;
    
    const functionName = functionNameInput.value;
    if (functionName === "Main")
    {
        errorText.style.display = "";
        errorText.innerText = "Function name \"Main\" is reserved, use a different name";
        return;
    }

    if (builtInFunctions.hasOwnProperty(functionName))
    {
        errorText.style.display = "";
        errorText.innerText = "A built-in function with the name \"" + functionName + "\" already exists";
        return;
    }

    let nameTaken;
    if (functionEditor.currentEditedFunction)
    {
        const functionWithThisName = customFunctionsByName.getOwnProperty(functionName);
        if (functionWithThisName)
            nameTaken = functionWithThisName !== functionEditor.currentEditedFunction;
        else
            nameTaken = false;
    }
    else
        nameTaken = customFunctionsByName.hasOwnProperty(functionName);

    if (nameTaken)
    {
        errorText.style.display = "";
        errorText.innerText = "A function with the name \"" + functionName + "\" already exists";
        return;
    }

    checkResult = CheckName(functionName);
    if (checkResult !== "OK")
    {
        errorText.style.display = "";
        errorText.innerText = "Function name" + checkResult;
        return;
    }

    const paramNames = new Set();
    const params = [];
    //                       last row is always empty ----v
    for (let i = 1; i < parametersTbody.children.length - 1; ++i)
    {
        const currentRow = parametersTbody.children[i];

        const paramName = currentRow.children[0].children[0].value;
        if (paramNames.has(paramName))
        {
            errorText.style.display = "";
            errorText.innerText = "All parameters must have unique names (" + paramName + ")";
            return;
        }

        checkResult = CheckName(paramName);
        if (checkResult !== "OK")
        {
            errorText.style.display = "";
            errorText.innerText = "Parameter name" + checkResult + " (" + paramName + ")";
            return;
        }

        paramNames.add(paramName);

        const paramType = currentRow.children[1].children[0].value;
        const paramDescription = currentRow.children[2].children[0].value
        params.push({
            name: paramName,
            type: paramType,
            description: paramDescription
        });
    }

    let functionObj;
    if (functionEditor.currentEditedFunction)
    {
        functionObj = functionEditor.currentEditedFunction;
        delete customFunctionsByName[functionEditor.currentEditedFunction.name];
    }
    else
    {
        const guid = helper.GetGuid("customFunction");
        functionObj = {
            guid: guid
        };

        customFunctions[guid] = functionObj;
    }

    customFunctionsByName[functionName] = functionObj;
    functionObj.name = functionName;
    functionObj.description = functionDescriptionInput.value;
    functionObj.returnType = functionReturnTypeSelector.value;
    functionObj.parameters = params;

    errorText.style.display = "none";
    functionEditorOverlay.style.display = "none";

    // functionEditor.currentEditedFunction must exist before calling functionViewer.UpdateCustomFunctionLines
    functionViewer.UpdateCustomFunctionLines();

    if (functionEditor.currentEditedFunction)
    {
        functionEditor.currentEditedFunction = undefined;
        functionEditor.FunctionWasEdited(functionObj);
    }
};

functionEditor.FunctionWasEdited = function(functionData)
{
    // update all function call statements of this function
    // also update the header text of the function body element

    const functionBody = elementHandler.functionBodies.getOwnProperty(functionData.guid);
    if (functionBody)
        functionBody.updateHeaderText();

    const allFunctionCalls = allUIElementsByType["FunctionCall"] || {};
    for (let elementGuid in allFunctionCalls)
    {
        const element = allFunctionCalls[elementGuid];
        const selectedFunction = element.selectedFunction;

        if (selectedFunction && selectedFunction === functionData)
            element.selectedFunctionChanged(selectedFunction);
    }

    const allReturnStatements = allUIElementsByType["ReturnStatement"] || {};
    for (let elementGuid in allReturnStatements)
    {
        const element = allReturnStatements[elementGuid];
        const parentFunction = element.parentFunction;

        if (parentFunction === functionData)
            element.parentFunctionWasEdited();
    }
};

functionEditor.FunctionWasDeleted = function(functionData)
{
    // delete all function call statements of this function
    // if currently editing the deleted function, switch back to the Main function

    if (functionData.guid === elementHandler.activeFunctionGuid)
        elementHandler.SwitchToMainFunction(false);

    const allFunctionCalls = allUIElementsByType["FunctionCall"] || {};

    for (let elementGuid in allFunctionCalls)
    {
        const element = allFunctionCalls[elementGuid];
        const selectedFunction = element.selectedFunction;

        if (selectedFunction && selectedFunction === functionData)
            element.selectedFunctionChanged(undefined);
    }
};

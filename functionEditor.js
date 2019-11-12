
function ShowFunctionEditorList(show)
{
    if (show)
        UpdateCustomFunctionLines();

    const funcitonSelector = document.getElementById("function-selector-overlay");
    funcitonSelector.style.display = show ? "flex" : "none";
    funcitonSelector.classList.remove("not-function-editor");
    funcitonSelector.classList.add("function-editor");
}

let functionEditorHasChanged = false;
function ShowFunctionEditor(show)
{
    if (show)
    {
        FunctionEditorParameterChanged(false); // add an empty line if needed
        functionEditorHasChanged = false;

        const allTypes = new Set(["void", "number", "boolean", "string"]);

        const availableTypesSelector = document.getElementById("function-editor").querySelector("#function-editor-function-return-type");
        const availableTypes = availableTypesSelector.children;

        const currentTypes = new Set();
        for (let typeDiv of availableTypes)
        {
            currentTypes.add(typeDiv.value);

            if (!allTypes.has(typeDiv.value))
                availableTypesSelector.removeChild(typeDiv);
        }

        for (let type of allTypes)
        {
            if (!currentTypes.has(type))
            {
                const typeOption = document.createElement("option");
                typeOption.value = type;
                typeOption.innerText = type[0].toUpperCase() + type.substr(1);
                availableTypesSelector.appendChild(typeOption);
            }
        }
    }

    document.getElementById("function-editor-overlay").style.display = show ? "flex" : "none";
}

function CreateFunctionEditorParameterRow()
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
    paramNameInput.onchange = FunctionEditorParameterChanged;
    paramNameTd.appendChild(paramNameInput);

    const paramTypeTd = document.createElement("td");
    paramTypeTd.className = "function-editor-parameter-input";

    const paramTypeSelector = document.createElement("select");
    paramTypeSelector.className = "type-selector";
    paramTypeSelector.style.width = "100%";
    paramTypeSelector.style.height = "36px";
    paramTypeSelector.style.border = "0px";
    paramTypeSelector.oninput = FunctionEditorParameterChanged;
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
    paramDescriptionInput.onchange = FunctionEditorParameterChanged;
    paramDescriptionTd.appendChild(paramDescriptionInput);

    row.appendChild(paramNameTd);
    row.appendChild(paramTypeTd);
    row.appendChild(paramDescriptionTd);

    return row;
}

const functionEditorParametersTable = document.getElementById("function-editor-parameters-table");

/**
 * @param {HTMLInputElement} input 
 */
function FunctionEditorParameterChanged(setChangedOnly)
{
    functionEditorHasChanged = true;

    if (!setChangedOnly)
    {
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
            tbody.appendChild(emptyRow || CreateFunctionEditorParameterRow());
    }
}

function ExitFunctionEditor(save)
{
    if (!save)
    {
        if (!functionEditorHasChanged || confirm("Exit without saving?"))
            document.getElementById("function-editor-overlay").style.display = "none";

        return;
    }
}

//ShowFunctionEditor(true);

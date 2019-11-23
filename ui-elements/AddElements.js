
const elementHandler = {};

(() =>
{
    const stringMap = new StringMap();
    const searchBox = document.getElementById("search-box");
    const searchKeywords = {
        "If statement": d => new IfStatement(d),
        "While statement": d => new WhileStatement(d),
        "Variable declaration": d => new VariableDeclaration(d),
        "Variable assignment": d => new VariableAssignment(d),
        "Numeric expression": d => new BinaryNumericExpression(d),
        "Unary numeric expression": d => new UnaryNumericExpression(d),
        "Binary boolean expression": d => new BinaryBooleanExpression(d),
        "Unary boolean expression": d => new UnaryBooleanExpression(d),
        "String expression": d => new BinaryStringExpression(d),
        "Number comparison": d => new NumberComparison(d),
        "String comparison": d => new StringComparison(d),
        "Number": d => new NumberLiteralExpression(d),
        "Boolean value": d => new BooleanLiteralExpression(d),
        "String": d => new StringLiteralExpression(d),
        "Variable": d => new VariableExpression(d),
        "Function call": d => new FunctionCall(d),
        "Return statement": d => new ReturnStatement(d)
    };

    for (let keyword in searchKeywords)
        stringMap.add(keyword, searchKeywords[keyword]);

    const searchResultsDiv = document.getElementById("search-results");
    const searchLimit = 10;
    const searchResultButtons = [];
    for (let i = 0; i < searchLimit; ++i)
    {
        let current = document.createElement("button");
        current.className = "search-result-element";

        const index = i;
        current.onmousedown = ev =>
        {
            if (ev.button === 0)
            {
                const parentNode = elementHandler.functionBodyDragContainers[elementHandler.activeFunctionGuid];
                const newElement = searchKeywords[searchResultButtons[index].innerHTML](parentNode);
                newElement.element.style.left = (parentNode.parentNode.scrollLeft + 20) + "px";
                newElement.element.style.top = (parentNode.parentNode.scrollTop + 20) + "px";
                searchBox.value = "";
            }
        };

        searchResultButtons.push(current);
        searchResultsDiv.appendChild(current);
    }

    function Search(str)
    {
        const results = stringMap.findSubstring(str, true, searchLimit);

        if (results.length === 0)
        {
            searchResultButtons[0].innerText = "No results";
            searchResultButtons[0].disabled = true;

            for (let i = 1; i < searchLimit; ++i)
                searchResultButtons[i].style.display = "none";
        }
        else
        {
            searchResultButtons[0].disabled = false;

            let i = 0;
            for (; i < results.length; ++i)
            {
                const button = searchResultButtons[i];
                button.style.display = "";
                button.innerText = results[i].str;
            }

            for (; i < searchLimit; ++i)
                searchResultButtons[i].style.display = "none";
        }

        searchResultsDiv.className = "search-results-visible";
    }

    searchBox.oninput = () =>
    {
        const searchValue = searchBox.value;
        if (searchValue === "")
            searchResultsDiv.className = "search-results-hidden";
        else
            Search(searchValue);
    };

    searchBox.onblur = () =>
    {
        searchResultsDiv.className = "search-results-hidden";   
    };

    searchBox.onfocus = searchBox.oninput;
    
    // delete drop area
    const deleteDropArea = document.getElementById("delete-item-drop-area");
    draggable.CreateDropArea(deleteDropArea, {
        check: elem => elem.uiElementData && !(elem.uiElementData instanceof FunctionBody),
        hoverenter: elem => deleteDropArea.classList.add("hovered"),
        hoverleave: elem => deleteDropArea.classList.remove("hovered"),
        drop: elem => elem.uiElementData.delete()
    });

    draggable.AddEventListener("dragStart", elem =>
    {
        if (elem.uiElementData && !(elem.uiElementData instanceof FunctionBody))
        {
            deleteDropArea.classList.remove("hidden");
            deleteDropArea.classList.add("visible");
        }
    });

    draggable.AddEventListener("dragEnd", elem =>
    {
        if (elem.uiElementData && !(elem.uiElementData instanceof FunctionBody))
        {
            deleteDropArea.classList.remove("visible");
            deleteDropArea.classList.add("hidden");
        }
    });
})();

elementHandler.activeFunctionGuid = undefined;
elementHandler.functionBodyDragContainers = {};
elementHandler.functionBodies = {};
elementHandler.functionCallElements = {};

elementHandler.CreateNewFunctionBody = function(functionName)
{
    const dragContainer = document.createElement("div");
    dragContainer.className = "function-body-drag-container";
    const functionUIElement = new FunctionBody(dragContainer, functionName);

    const functionGuid = functionUIElement.functionData.guid;
    elementHandler.functionBodyDragContainers[functionGuid] = dragContainer;
    functionUIElement.element.style.left = "100px";
    functionUIElement.element.style.top = "100px";

    elementHandler.functionBodies[functionGuid] = functionUIElement;
    return functionUIElement;
};

elementHandler.SwitchToFunction = function(functionGuid, hideFunctionSelector)
{
    const dragArea = document.getElementById("main-drag-area");
    let functionDragContainer = elementHandler.functionBodyDragContainers.getOwnProperty(functionGuid);
    let functionData = customFunctions.getOwnProperty(functionGuid);
    if (!functionData)
    {
        if (MainFunction.guid === functionGuid)
            functionData = MainFunction;
        else
        {
            // deleted function
            return;
        }
    }

    if (!elementHandler.functionBodyDragContainers.hasOwnProperty(functionGuid))
    {
        elementHandler.CreateNewFunctionBody(functionData.name);
        functionDragContainer = elementHandler.functionBodyDragContainers[functionGuid];
    }

    const currentFunctionDragContainer = elementHandler.activeFunctionGuid
        && elementHandler.functionBodyDragContainers.getOwnProperty(elementHandler.activeFunctionGuid);

    if (currentFunctionDragContainer && dragArea.contains(currentFunctionDragContainer))
        dragArea.removeChild(currentFunctionDragContainer);

    dragArea.appendChild(functionDragContainer);
    elementHandler.activeFunctionGuid = functionGuid;

    if (hideFunctionSelector)
        document.getElementById("function-selector-overlay").style.display = "none";
};

(() =>
{
    // create main function element here
    elementHandler.CreateNewFunctionBody("Main");

    elementHandler.activeFunctionGuid = MainFunction.guid;
    document.getElementById("main-drag-area").appendChild(elementHandler.functionBodyDragContainers[MainFunction.guid]);
})();

elementHandler.SwitchToMainFunction = function(hideFunctionSelector)
{
    elementHandler.SwitchToFunction(MainFunction.guid, hideFunctionSelector);
};

elementHandler.SwitchToMainFunction(false);

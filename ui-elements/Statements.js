
class IfStatement extends MultiBlockBase
{
    constructor(parentNode)
    {
        super(parentNode, "If", ["boolean"], "Else If", ["boolean"], "Else", []);
    }

    compile(errors)
    {
        const conditions = [];
        const blocks = [];

        let hasMainCondition = false;
        const mainConditionNodes = this.mainBlock.headerDropAreas[0].dropArea.children;
        for (let node of mainConditionNodes)
        {
            if (node.uiElementData && node.uiElementData instanceof ElementBase)
            {
                hasMainCondition = true;
                conditions.push(node.uiElementData.compile(errors));
                break;
            }
        }

        if (!hasMainCondition)
        {
            errors.push({
                message: "Condition missing from If statement",
                data: [mainConditionNodes]
            });
        }

        blocks.push(this.mainBlock.compile(errors));

        const secondaryBlockNodes = this.secondaryBlocksContainer.children;
        for (let node of secondaryBlockNodes)
        {
            if (node.uiElementData && node.uiElementData instanceof ElementBase)
            {
                const secondaryBlock = node.uiElementData;
                let secondaryBlockHasCondition = false;
                const secondaryConditionNodes = secondaryBlock.headerDropAreas[0].dropArea.children;
                for (let secondaryConditionNode of secondaryConditionNodes)
                {
                    if (secondaryConditionNode.uiElementData && secondaryConditionNode.uiElementData instanceof ElementBase)
                    {
                        secondaryBlockHasCondition = true;
                        conditions.push(secondaryConditionNode.uiElementData.compile(errors));
                        break;
                    }
                }

                if (!secondaryBlockHasCondition)
                {
                    errors.push({
                        message: "Condition missing from If statement",
                        data: [secondaryConditionNodes]
                    });
                }
        
                blocks.push(secondaryBlock.compile(errors));
            }
        }

        return {
            statementType: "ifStatement",
            conditions: conditions,
            blocks: blocks,
            elseBlock: this.finalBlock.compile(errors)
        };
    }
}

class WhileStatement extends BlockBase
{
    constructor(parentNode)
    {
        super(parentNode, "While", ["boolean"], true);
    }

    compile(errors)
    {
        let hasMainCondition = false;
        let mainCondition;
        const mainConditionNodes = this.headerDropAreas[0].dropArea.children;
        for (let node of mainConditionNodes)
        {
            if (node.uiElementData && node.uiElementData instanceof ElementBase)
            {
                hasMainCondition = true;
                mainCondition = node.uiElementData.compile(errors);
                break;
            }
        }

        if (!hasMainCondition)
        {
            errors.push({
                message: "Condition missing from While statement",
                data: [mainConditionNodes]
            });
        }

        return {
            statementType: "whileStatement",
            condition: mainCondition,
            block: super.compile(errors)
        };
    }
}

class VariableDeclaration extends StatementBase
{
    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "variable-assignment";

        // text
        const header = document.createElement("div");
        header.innerText = "Create new variable";
        header.className = "inline-text";

        // variable name input field
        this.variableNameInputField = document.createElement("input");
        this.variableNameInputField.type = "text";
        this.variableNameInputField.placeholder = "Variable name";
        this.variableNameInputField.className = "variable-name-input";
        this.variableNameInputField.style.width = "130px";
        this.variableNameInputField.onkeydown = ev =>
        {
            if (ev.keyCode === 13)
                this.variableNameInputField.blur();
        }
        this.variableNameInputField.oninput = () =>
        {
            this.variableNameInputField.style.width = (this.variableNameInputField.value === "" ? 130 : GetTextSize(this.variableNameInputField.value, this.variableNameInputField)) + "px";
        }

        // another text
        const typeText = document.createElement("div");
        typeText.innerText = "Type:";
        typeText.className = "inline-text";

        // type selector
        const types = ["Number", "Boolean", "String"];
        this.typeSelector = document.createElement("select");
        this.typeSelector.className = "type-selector";
        for (let i = 0; i < types.length; ++i)
        {
            const option = document.createElement("option");
            option.innerText = types[i];
            option.value = types[i];
            this.typeSelector.appendChild(option);
        }

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.variableNameInputField);
        this.element.appendChild(typeText);
        this.element.appendChild(this.typeSelector);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    compile(errors)
    {
        return {
            statementType: "variableDeclaration",
            variableName: this.variableNameInputField.value,
            variableType: this.typeSelector.value.toLowerCase()
        };
    }
}

class VariableAssignment extends StatementBase
{
    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "variable-assignment";

        // text
        const header = document.createElement("div");
        header.innerText = "Set the value of";
        header.className = "inline-text";

        // variable name input field
        this.variableNameInputField = document.createElement("input");
        this.variableNameInputField.type = "text";
        this.variableNameInputField.placeholder = "Variable name";
        this.variableNameInputField.className = "variable-name-input";
        this.variableNameInputField.style.width = "130px";
        this.variableNameInputField.onkeydown = ev =>
        {
            if (ev.keyCode === 13)
                this.variableNameInputField.blur();
        }
        this.variableNameInputField.oninput = () =>
        {
            this.variableNameInputField.style.width = (this.variableNameInputField.value === "" ? 130 : GetTextSize(this.variableNameInputField.value, this.variableNameInputField)) + "px";
        }

        // another text
        const toText = document.createElement("div");
        toText.innerText = "to";
        toText.className = "inline-text";

        // expression drop area
        const dropArea = document.createElement("div");
        this.expressionDropArea = dropArea;
        dropArea.className = "drop-area drop-normal";

        const headerDropAreaMinWidth = "150px";

        dropArea.style.minWidth = headerDropAreaMinWidth;

        // placeholder
        const dropAreaPlaceholder = document.createElement("div");
        dropAreaPlaceholder.className = "drop-placeholder";
        dropAreaPlaceholder.innerText = "+";
        dropArea.appendChild(dropAreaPlaceholder);

        let expressionIsEmpty = true;

        draggable.CreateDropArea(dropArea,
        {
            check: element => expressionIsEmpty && element.uiElementData.isExpression(),
            hoverenter: element =>
            {
                dropArea.classList.remove("drop-normal");
                dropArea.classList.add("drop-highlight");
            },
            hoverleave: element =>
            {
                dropArea.classList.add("drop-normal");
                dropArea.classList.remove("drop-highlight");
            },
            drop: element =>
            {
                expressionIsEmpty = false;
                dropAreaPlaceholder.style.display = "none";
                dropAreaPlaceholder.style.minWidth = "";
                dropArea.classList.add("not-empty");
                //console.log("drop");
                element.style.position = "static";
                dropArea.appendChild(element);
                element.classList.add("nested");
                element.classList.add("nested-as-expression");

                this.recalculateDraggableSizes();
            },
            detach: element =>
            {
                expressionIsEmpty = true;
                dropAreaPlaceholder.style.display = "";
                dropArea.style.minWidth = headerDropAreaMinWidth;
                dropArea.classList.remove("not-empty");
                //console.log("detach");
                this.parentNode.appendChild(element);
                element.classList.remove("nested");
                element.classList.remove("nested-as-expression");

                this.recalculateDraggableSizes();
            }
        });

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.variableNameInputField);
        this.element.appendChild(toText);
        this.element.appendChild(dropArea);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    compile(errors)
    {
        const expressionNodes = this.expressionDropArea.children;
        let expression = null;
        for (let node of expressionNodes)
        {
            if (node.uiElementData && node.uiElementData instanceof ElementBase)
            {
                expression = node.uiElementData;
                break;
            }
        }

        return {
            statementType: "variableAssignment",
            variableName: this.variableNameInputField.value,
            newVariableValue: expression ? expression.compile(errors) : null
        }
    }
}

class FunctionCall extends ElementBase
{
    isExpression() { return true; }
    isStatement() { return true; }
    getType() { return "any"; }

    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "function-call";

        // text
        const header = document.createElement("div");
        header.innerText = ""; // set from css, different text for statement and expression
        header.className = "inline-text function-call-inline-text";

        // parameters text
        const paramsText = document.createElement("div");
        paramsText.innerText = "Parameters:";
        paramsText.className = "inline-text";
        paramsText.style.display = "none";

        // function selector
        this.selectedFunction = null;
        
        this.functionSelector = document.createElement("div");
        this.functionSelector.className = "function-selector-button";
        this.functionSelector.innerText = "(none selected)";
        this.functionSelector.title = "Click to select a function";

        let waitingForFunctionSelection = false;
        this.functionSelector.onclick = async () =>
        {
            if (waitingForFunctionSelection)
                return;

            waitingForFunctionSelection = true;
            ShowAvailableFunctions(true);

            const selectedFunction = await new Promise(resolve => functionSelectedCallback = resolve);
            waitingForFunctionSelection = false;
            functionSelectedCallback = undefined;

            if (selectedFunction && selectedFunction != this.selectedFunction)
            {
                this.selectedFunction = selectedFunction;
                this.functionSelector.innerText = selectedFunction ? selectedFunction.name : "(none selected)";

                while (this.parameterDropAreasContainer.lastChild)
                    this.parameterDropAreasContainer.removeChild(this.parameterDropAreasContainer.lastChild);
        
                if (this.selectedFunction.parameters.length === 0)
                    paramsText.style.display = "none";
                else
                {
                    paramsText.style.display = "";
                    for (let param of this.selectedFunction.parameters)
                        this.createParameterDropArea(param.type);
                }
            }
        };

        // container for parameter drop areas
        this.parameterDropAreasContainer = document.createElement("div");
        this.parameterDropAreasContainer.className = "parameters-drop-area";

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.functionSelector);
        this.element.appendChild(paramsText);
        this.element.appendChild(this.parameterDropAreasContainer);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    createParameterDropArea(requiredType)
    {
        const dropArea = document.createElement("div");
        dropArea.className = "drop-area drop-normal";
        
        switch (requiredType)
        {
            case "number":
                dropArea.style.backgroundColor = "var(--number-color)";
                break;
            case "boolean":
                dropArea.style.backgroundColor = "var(--boolean-color)";
                break;
            case "string":
                dropArea.style.backgroundColor = "var(--string-color)";
                break;
        }

        const headerDropAreaMinWidth = "150px";
        dropArea.style.minWidth = headerDropAreaMinWidth;

        const dropAreaPlaceholder = document.createElement("div");
        dropAreaPlaceholder.className = "drop-placeholder";
        dropAreaPlaceholder.innerText = "+";
        dropArea.appendChild(dropAreaPlaceholder);

        let expressionIsEmpty = true;

        draggable.CreateDropArea(dropArea,
        {
            check: element => expressionIsEmpty && element.uiElementData.isExpression()
                && (element.uiElementData.getType() === requiredType || element.uiElementData.getType() === "any"),
            hoverenter: element =>
            {
                dropArea.classList.remove("drop-normal");
                dropArea.classList.add("drop-highlight");
            },
            hoverleave: element =>
            {
                dropArea.classList.add("drop-normal");
                dropArea.classList.remove("drop-highlight");
            },
            drop: element =>
            {
                expressionIsEmpty = false;
                dropAreaPlaceholder.style.display = "none";
                dropAreaPlaceholder.style.minWidth = "";
                dropArea.classList.add("not-empty");
                //console.log("drop");
                element.style.position = "static";
                dropArea.appendChild(element);
                element.classList.add("nested");
                element.classList.add("nested-as-expression");

                this.recalculateDraggableSizes();
            },
            detach: element =>
            {
                expressionIsEmpty = true;
                dropAreaPlaceholder.style.display = "";
                dropArea.style.minWidth = headerDropAreaMinWidth;
                dropArea.classList.remove("not-empty");
                //console.log("detach");
                this.parentNode.appendChild(element);
                element.classList.remove("nested");
                element.classList.remove("nested-as-expression");

                this.recalculateDraggableSizes();
            }
        });

        this.parameterDropAreasContainer.appendChild(dropArea);
    }

    compile(errors)
    {
        const dropAreaNodes = this.parameterDropAreasContainer.children;
        const compiledExpressions = [];
        for (let node of dropAreaNodes)
        {
            let found = false;
            for (let expression of node.children)
            {
                if (expression.uiElementData && expression.uiElementData instanceof ElementBase)
                {
                    compiledExpressions.push(expression.uiElementData.compile(errors));
                    found = true;
                    break;
                }
            }

            if (!found)
            {
                errors.push({
                    message: "Missing function parameter",
                    data: []
                });
            }
        }

        if (!this.selectedFunction)
        {
            errors.push({
                message: "No function selected",
                data: []
            });
        }

        return {
            statementType: "functionCall",
            expressionType: "functionCall",
            functionData: this.selectedFunction,
            parameters: compiledExpressions
        };
    }
}

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
                message: "{{Condition}} missing from {{If statement}}",
                data: [this.mainBlock.headerDropAreas[0].dropArea, this.element]
            });
            conditions.push(null);
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
                        message: "{{Condition}} missing from {{If statement}}",
                        data: [secondaryBlock.headerDropAreas[0].dropArea, this.element]
                    });
                    conditions.push(null);
                }
        
                blocks.push(secondaryBlock.compile(errors));
            }
        }

        return {
            statementType: "ifStatement",
            conditions: conditions,
            blocks: blocks,
            elseBlock: this.hasFinalBlock ? this.finalBlock.compile(errors) : null,
            srcElement: this
        };
    }

    load(data)
    {
        if (data.conditions[0])
        {
            // main condition
            compiler.LoadElement(this.parentNode, data.conditions[0], this.mainBlock.headerDropAreas[0].dropArea);
        }

        for (let statement of data.blocks[0].statements)
        {
            // main block
            compiler.LoadElement(this.parentNode, statement, this.mainBlock.mainBlock);
        }

        for (let i = 1; i < data.conditions.length; ++i)
        {
            const newSecondaryBlock = this.createSecondaryBlock();
            this.secondaryBlocksContainer.appendChild(newSecondaryBlock);
            
            if (data.conditions[i])
                compiler.LoadElement(this.parentNode, data.conditions[i], newSecondaryBlock.uiElementData.headerDropAreas[0].dropArea);

            for (let statement of data.blocks[i].statements)
                compiler.LoadElement(this.parentNode, statement, newSecondaryBlock.uiElementData.mainBlock);
        }

        if (data.elseBlock)
        {
            this.showFinalBlock();

            for (let statement of data.elseBlock.statements)
                compiler.LoadElement(this.parentNode, statement, this.finalBlock.mainBlock);
        }
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
                message: "{{Condition}} missing from {{While statement}}",
                data: [this.headerDropAreas[0].dropArea, this.element]
            });
            mainCondition = null;
        }

        return {
            statementType: "whileStatement",
            condition: mainCondition,
            block: super.compile(errors),
            srcElement: this
        };
    }

    load(data)
    {
        if (data.condition)
            compiler.LoadElement(this.parentNode, data.condition, this.headerDropAreas[0].dropArea);

        const block = data.block;
        for (let statement of block.statements)
            compiler.LoadElement(this.parentNode, statement, this.mainBlock);
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
            this.variableNameInputField.style.width = (this.variableNameInputField.value === "" ? 130 : helper.GetTextSize(this.variableNameInputField.value, this.variableNameInputField)) + "px";
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
            option.value = types[i].toLowerCase();
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
            variableType: this.typeSelector.value,
            srcElement: this
        };
    }

    load(data)
    {
        this.variableNameInputField.value = data.variableName;
        this.variableNameInputField.oninput(); // update length
        this.typeSelector.value = data.variableType;
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
            this.variableNameInputField.style.width = (this.variableNameInputField.value === "" ? 130 : helper.GetTextSize(this.variableNameInputField.value, this.variableNameInputField)) + "px";
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
        elementHandler.RegisterQuickAdd(this.parentNode, dropArea, dropAreaPlaceholder, "expression");

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
            newVariableValue: expression ? expression.compile(errors) : null,
            srcElement: this
        }
    }

    load(data)
    {
        this.variableNameInputField.value = data.variableName;
        this.variableNameInputField.oninput(); // update length
        
        if (data.newVariableValue)
            compiler.LoadElement(this.parentNode, data.newVariableValue, this.expressionDropArea);
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
        this.paramsText = document.createElement("div");
        this.paramsText.innerText = "Parameters:";
        this.paramsText.className = "inline-text";
        this.paramsText.style.display = "none";

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
            functionViewer.ShowAvailableFunctions(true);

            const selectedFunction = await new Promise(resolve => functionViewer.functionSelectedCallback = resolve);
            waitingForFunctionSelection = false;
            functionViewer.functionSelectedCallback = undefined;

            if (selectedFunction && selectedFunction !== this.selectedFunction)
                this.selectedFunctionChanged(selectedFunction);
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
        this.element.appendChild(this.paramsText);
        this.element.appendChild(this.parameterDropAreasContainer);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    selectedFunctionChanged(selectedFunction)
    {
        // we need to update the function name here, and update the parameter drop areas
        // for each element in the drop areas, we need to check if the type of the dropped element and the required type of the function parameter are the same
        // if they are not the same, we move it outside the function call, and put it next to the function call

        this.selectedFunction = selectedFunction;
        this.functionSelector.innerText = selectedFunction ? selectedFunction.name : "(none selected)";

        const droppedParameterElements = [];

        const dropAreas = this.parameterDropAreasContainer.children;
        for (let i = 0; i < dropAreas.length; ++i)
        {
            let hasDroppedElement = false;
            const dropAreaNodes = dropAreas[i].children;
            for (let j = 0; j < dropAreaNodes.length; ++j)
            {
                const elem = dropAreaNodes[j];
                if (elem.uiElementData && elem.uiElementData instanceof ElementBase)
                {
                    // we have something dropped here
                    hasDroppedElement = true;
                    droppedParameterElements.push(elem);
                    break;
                }
            }

            if (!hasDroppedElement)
                droppedParameterElements.push(null);
        }

        while (this.parameterDropAreasContainer.lastChild)
        {
            const dropArea = this.parameterDropAreasContainer.lastChild;
            for (let i = 0; i < dropArea.children.length; ++i)
            {
                const elem = dropArea.children[i];
                if (elem.uiElementData && elem.uiElementData instanceof ElementBase)
                {
                    dropArea.draggableData.onDetach(elem);
                    break;
                }
            }

            this.parameterDropAreasContainer.removeChild(dropArea);
        }

        if (!selectedFunction || selectedFunction.parameters.length === 0)
            this.paramsText.style.display = "none";
        else
        {
            this.paramsText.style.display = "";
            for (let param of selectedFunction.parameters)
                this.createParameterDropArea(param.type, param.name);
        }

        const functionParams = selectedFunction && selectedFunction.parameters; // can be undefined if deleting the function
        const mismatchedTypeElements = [];
        for (let i = 0; i < droppedParameterElements.length; ++i)
        {
            const droppedParam = droppedParameterElements[i];
            if (!droppedParam)
                continue;

            let typeMismatch = false;
            if (functionParams && functionParams.length > i)
            {
                const currentType = droppedParam.uiElementData.getType();
                const requiredType = functionParams[i].type;

                if (currentType === requiredType || currentType === "any")
                    draggable.ForceDrop(droppedParam, this.parameterDropAreasContainer.children[i]);
                else
                    typeMismatch = true;
            }
            else
            {
                // the function has less parameters than we already have
                typeMismatch = true;
            }

            if (typeMismatch)
                mismatchedTypeElements.push(droppedParam);
        }

        const rect = helper.GetCoords(this.element)
        const left = rect.x + rect.width;
        let top = rect.y - rect.height - 40;

        for (let i = 0; i < mismatchedTypeElements.length; ++i)
        {
            const elem = mismatchedTypeElements[i];
            elem.draggableData.attachedDropArea = undefined;
            elem.style.position = "absolute";
            elem.style.left = left + "px";
            elem.style.top = top + "px";
            this.parentNode.appendChild(elem);

            top += 40;
        }

        if (!selectedFunction)
        {
            // function was deleted, detach it from the drop area if attached
            if (this.element.draggableData.attachedDropArea)
                this.element.draggableData.attachedDropArea.draggableData.onDetach(this.element);

            this.delete();
        }
    }

    createParameterDropArea(requiredType, paramName)
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
        dropAreaPlaceholder.innerHTML = "+&nbsp;<span style=\"font-style: italic;\">" + paramName + "</span>";
        dropArea.appendChild(dropAreaPlaceholder);
        elementHandler.RegisterQuickAdd(this.parentNode, dropArea, dropAreaPlaceholder, requiredType);

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
                    message: "Missing {{function parameter}}",
                    data: [node]
                });

                compiledExpressions.push(null); // add empty data to match the count of required function parameters 
            }
        }

        if (!this.selectedFunction)
        {
            errors.push({
                message: "{{No function selected}}",
                data: [this.functionSelector]
            });
        }

        return {
            statementType: "functionCall",
            expressionType: "functionCall",
            functionName: this.selectedFunction ? this.selectedFunction.name : null,
            parameters: compiledExpressions,
            srcElement: this
        };
    }

    load(data)
    {
        if (data.functionName)
        {
            let func = builtInFunctions.getOwnProperty(data.functionName) || customFunctionsByName.getOwnProperty(data.functionName);
            if (func)
            {
                this.selectedFunctionChanged(func);

                for (let i = 0; i < func.parameters.length; ++i)
                {
                    const currentParam = data.parameters[i];
                    if (currentParam)
                        compiler.LoadElement(this.parentNode, currentParam, this.parameterDropAreasContainer.children[i]);
                }
            }
        }
    }
}

class ReturnStatement extends StatementBase
{
    isStatement() { return true; }

    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "return-statement";

        // text
        const header = document.createElement("div");
        header.innerText = "Return";
        header.className = "inline-text";

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        // expression drop area
        this.dropArea = document.createElement("div");
        this.dropArea.className = "drop-area drop-normal";

        const headerDropAreaMinWidth = "150px";
        this.dropArea.style.minWidth = headerDropAreaMinWidth;

        const dropAreaPlaceholder = document.createElement("div");
        dropAreaPlaceholder.className = "drop-placeholder";
        dropAreaPlaceholder.innerHTML = "+";
        this.dropArea.appendChild(dropAreaPlaceholder);
        elementHandler.RegisterQuickAdd(this.parentNode, this.dropArea, dropAreaPlaceholder, "expression");

        let expressionIsEmpty = true;

        draggable.CreateDropArea(this.dropArea,
        {
            check: element => expressionIsEmpty && element.uiElementData.isExpression(),
            hoverenter: element =>
            {
                this.dropArea.classList.remove("drop-normal");
                this.dropArea.classList.add("drop-highlight");
            },
            hoverleave: element =>
            {
                this.dropArea.classList.add("drop-normal");
                this.dropArea.classList.remove("drop-highlight");
            },
            drop: element =>
            {
                expressionIsEmpty = false;
                dropAreaPlaceholder.style.display = "none";
                dropAreaPlaceholder.style.minWidth = "";
                this.dropArea.classList.add("not-empty");
                //console.log("drop");
                element.style.position = "static";
                this.dropArea.appendChild(element);
                element.classList.add("nested");
                element.classList.add("nested-as-expression");

                this.recalculateDraggableSizes();
            },
            detach: element =>
            {
                expressionIsEmpty = true;
                dropAreaPlaceholder.style.display = "";
                this.dropArea.style.minWidth = headerDropAreaMinWidth;
                this.dropArea.classList.remove("not-empty");
                //console.log("detach");
                this.parentNode.appendChild(element);
                element.classList.remove("nested");
                element.classList.remove("nested-as-expression");

                this.recalculateDraggableSizes();
            }
        });

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.dropArea);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);

        // check if expression drop area should be visible
        this.parentFunction = MainFunction.guid === elementHandler.activeFunctionGuid ? MainFunction : customFunctions[elementHandler.activeFunctionGuid];
        if (this.parentFunction.returnType === "void")
            this.hideExpression();
    }

    parentFunctionWasEdited()
    {
        if (this.parentFunction.returnType === "void")
            this.hideExpression();
        else
            this.showExpression();
    }

    showExpression()
    {
        this.dropArea.style.display = "";
    }

    hideExpression()
    {
        this.dropArea.style.display = "none";

        for (let element of this.dropArea.children)
        {
            if (element.uiElementData && element.uiElementData instanceof ElementBase)
            {
                this.dropArea.draggableData.onDetach(element);

                const rect = helper.GetCoords(this.element)
                const left = rect.x + rect.width;
                let top = rect.y - rect.height - 40;

                element.draggableData.attachedDropArea = undefined;
                element.style.position = "absolute";
                element.style.left = left + "px";
                element.style.top = top + "px";

                break;
            }
        }
    }

    compile(errors)
    {
        if (this.parentFunction.returnType === "void")
        {
            return {
                statementType: "returnStatement",
            };
        }
        else
        {
            let found = false;
            let compiledExpression = null;

            for (let expression of this.dropArea.children)
            {
                if (expression.uiElementData && expression.uiElementData instanceof ElementBase)
                {
                    compiledExpression = expression.uiElementData.compile(errors);
                    found = true;
                    break;
                }
            }

            if (!found)
            {
                errors.push({
                    message: "{{Missing expression}} from {{return statement}}",
                    data: [this.dropArea, this.element]
                });
            }

            return {
                statementType: "returnStatement",
                returnValue: compiledExpression,
                srcElement: this
            };
        }
    }

    load(data)
    {
        if (data.hasOwnProperty("returnValue"))
        {
            this.showExpression();

            if (data.returnValue !== null)
                compiler.LoadElement(this.parentNode, data.returnValue, this.dropArea);
        }
        else
            this.hideExpression();
    }
}

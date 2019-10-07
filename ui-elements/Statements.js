
class IfStatement extends BlockBase
{
    constructor(parentNode)
    {
        super(parentNode, "If", ["boolean"]);
    }
}

class WhileStatement extends BlockBase
{
    constructor(parentNode)
    {
        super(parentNode, "While", ["boolean"]);
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
        this.inputField = document.createElement("input");
        this.inputField.type = "text";
        this.inputField.placeholder = "Variable name";
        this.inputField.className = "variable-name-input";
        this.inputField.style.width = "130px";
        this.inputField.onkeydown = ev =>
        {
            if (ev.keyCode === 13)
                this.inputField.blur();
        }
        this.inputField.oninput = () =>
        {
            this.inputField.style.width = (this.inputField.value === "" ? 130 : GetTextSize(this.inputField.value, this.inputField)) + "px";
        }

        // another text
        const typeText = document.createElement("div");
        typeText.innerText = "Type:";
        typeText.className = "inline-text";

        // type selector
        const types = ["Number", "Boolean", "String"];
        const typeSelector = document.createElement("select");
        typeSelector.className = "type-selector";
        for (let i = 0; i < types.length; ++i)
        {
            const option = document.createElement("option");
            option.innerText = types[i];
            option.value = types[i];
            typeSelector.appendChild(option);
        }

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.inputField);
        this.element.appendChild(typeText);
        this.element.appendChild(typeSelector);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
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
        this.inputField = document.createElement("input");
        this.inputField.type = "text";
        this.inputField.placeholder = "Variable name";
        this.inputField.className = "variable-name-input";
        this.inputField.style.width = "130px";
        this.inputField.onkeydown = ev =>
        {
            if (ev.keyCode === 13)
                this.inputField.blur();
        }
        this.inputField.oninput = () =>
        {
            this.inputField.style.width = (this.inputField.value === "" ? 130 : GetTextSize(this.inputField.value, this.inputField)) + "px";
        }

        // another text
        const toText = document.createElement("div");
        toText.innerText = "to";
        toText.className = "inline-text";

        // expression drop area
        const dropArea = document.createElement("div");
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
                console.log("drop");
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
                console.log("detach");
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
        this.element.appendChild(this.inputField);
        this.element.appendChild(toText);
        this.element.appendChild(dropArea);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
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

        // function name input field
        this.inputField = document.createElement("input");
        this.inputField.type = "text";
        this.inputField.placeholder = "Function name";
        this.inputField.className = "variable-name-input"; // reuse style
        this.inputField.style.width = "140px";
        this.inputField.onkeydown = ev =>
        {
            if (ev.keyCode === 13)
                this.inputField.blur();
        }
        this.inputField.oninput = () =>
        {
            this.inputField.style.width = (this.inputField.value === "" ? 140 : GetTextSize(this.inputField.value, this.inputField)) + "px";
        }

        // another text
        const paramsText = document.createElement("div");
        paramsText.innerText = "Parameters:";
        paramsText.className = "inline-text";

        // todo: multiple expressions depending on function signature
        // expression drop area
        const dropArea = document.createElement("div");
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
                console.log("drop");
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
                console.log("detach");
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
        this.element.appendChild(this.inputField);
        this.element.appendChild(paramsText);
        this.element.appendChild(dropArea);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }
}
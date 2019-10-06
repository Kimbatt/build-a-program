
class BinaryExpression extends ExpressionBase
{
    constructor(parentNode, texts, acceptsType, returnType)
    {
        super();
        this.parentNode = parentNode;
        this.returnType = returnType; // type of the expression, e.g. number + number -> number, number == number -> boolean
        this.acceptsType = acceptsType; // what type can be dropped into the expressions
    
        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "binary-expression";

        this.expressionMinWidth = "80px";
        
        // expression 1 drop area
        this.hasExpression1 = false;
        this.expression1 = document.createElement("div");
        this.expression1.className = "expression";
        this.expression1.style.minWidth = this.expressionMinWidth;
        draggable.CreateDropArea(this.expression1, {
            check: elem => elem.uiElementData && elem.uiElementData.isExpression()
                && (elem.uiElementData.getType() === this.acceptsType || elem.uiElementData.getType() === "any") && !this.hasExpression1,
            hoverenter: elem => this.onHoverEnterExpression(1, elem),
            hoverleave: elem => this.onHoverLeaveExpression(1, elem),
            drop: elem => this.onDropExpression(1, elem),
            detach: elem => this.onDetachExpression(1, elem)
        });

        // placeholder for expression 1 +
        this.expression1PlaceholderPlus = document.createElement("div");
        this.expression1PlaceholderPlus.className = "expression-placeholder";
        this.expression1PlaceholderPlus.innerText = "+";
        this.expression1.appendChild(this.expression1PlaceholderPlus);

        const operatorSelector = document.createElement("select");
        for (let i = 0; i < texts.length; ++i)
        {
            const text = texts[i];
            const option = document.createElement("option");
            option.text = text;
            option.value = text;
            operatorSelector.appendChild(option);
        }
        operatorSelector.className = "operator-selector";

        // expression 2 drop area
        this.hasExpression2 = false;
        this.expression2 = document.createElement("div");
        this.expression2.className = "expression";
        this.expression2.style.minWidth = this.expressionMinWidth;
        draggable.CreateDropArea(this.expression2, {
            check: elem => elem.uiElementData && elem.uiElementData.isExpression()
                && (elem.uiElementData.getType() === this.acceptsType || elem.uiElementData.getType() === "any") && !this.hasExpression2,
            hoverenter: elem => this.onHoverEnterExpression(2, elem),
            hoverleave: elem => this.onHoverLeaveExpression(2, elem),
            drop: elem => this.onDropExpression(2, elem),
            detach: elem => this.onDetachExpression(2, elem)
        });

        // placeholder for expression 1 +
        this.expression2PlaceholderPlus = document.createElement("div");
        this.expression2PlaceholderPlus.className = "expression-placeholder";
        this.expression2PlaceholderPlus.innerText = "+";
        this.expression2.appendChild(this.expression2PlaceholderPlus);

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        switch (acceptsType)
        {
            case "number":
                    this.expression1.style.backgroundColor = "var(--number-color)";
                    this.expression2.style.backgroundColor = "var(--number-color)";
                break;
            case "boolean":
                    this.expression1.style.backgroundColor = "var(--boolean-color)";
                    this.expression2.style.backgroundColor = "var(--boolean-color)";
                break;
            case "string":
                    this.expression1.style.backgroundColor = "var(--string-color)";
                    this.expression2.style.backgroundColor = "var(--string-color)";
                break;
        }

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(this.expression1);
        this.element.appendChild(operatorSelector);
        this.element.appendChild(this.expression2);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    recalculateDraggableSizes()
    {
        let node = this.element;
        while (node)
        {
            if (node.draggableData)
                draggable.RecalculateSize(node);

            node = node.parentNode;
        }
    }

    onHoverEnterExpression(index, element)
    {
        console.log("hover enter");
        this["expression" + index].classList.remove("drop-normal");
        this["expression" + index].classList.add("drop-highlight");
    }

    onHoverLeaveExpression(index, element)
    {
        console.log("hover leave");
        this["expression" + index].classList.add("drop-normal");
        this["expression" + index].classList.remove("drop-highlight");
    }

    onDropExpression(index, element)
    {
        this["hasExpression" + index] = true;
        this["expression" + index + "PlaceholderPlus"].style.display = "none";
        this["expression" + index].style.minWidth = "";
        this["expression" + index].classList.add("not-empty");
        console.log("drop");
        element.style.position = "static";
        this["expression" + index].appendChild(element);
        element.classList.add("nested");

        this.recalculateDraggableSizes();
    }

    onDetachExpression(index, element)
    {
        this["hasExpression" + index] = false;
        this["expression" + index + "PlaceholderPlus"].style.display = "";
        this["expression" + index].style.minWidth = this.expressionMinWidth;
        this["expression" + index].classList.remove("not-empty");
        console.log("detach");
        this.parentNode.appendChild(element);
        element.classList.remove("nested");

        this.recalculateDraggableSizes();
    }

    getType() { return this.returnType; }
}

class BinaryBooleanExpression extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["&&", "||", "^", "==", "!="], "boolean", "boolean");
    }
}

class BinaryNumericExpression extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["+", "-", "*", "/", "%", "**", "&", "|", "^", "<<", ">>"], "number", "number");
    }
}

class BinaryStringExpression extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["+"], "string", "string");
    }
}

class NumberComparison extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["<", ">", "<=", ">=", "==", "!="], "number", "boolean");
    }
}

class StringComparison extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["==", "!="], "string", "boolean");
    }
}

class LiteralExpression extends ExpressionBase
{
    constructor(parentNode, type)
    {
        super();
        this.parentNode = parentNode;
        this.type = type;
    
        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "literal-expression";

        // input field
        switch (type)
        {
            case "number":
                this.inputField = document.createElement("input");
                this.inputField.style.backgroundColor = "var(--number-color)";
                this.inputField.type = "text";
                this.inputField.value = "0";
                this.inputField.style.minWidth = "80px";
                this.inputField.onchange = () =>
                {
                    const num = Number(this.inputField.value);
                    this.inputField.value = isNaN(num) ? "0" : num.toString();
                    this.inputField.style.width = (GetTextSize(this.inputField.value, this.inputField) + 20) + "px";
                };
                this.inputField.onkeydown = ev =>
                {
                    if (ev.keyCode === 13)
                        this.inputField.blur();
                }
                this.inputField.oninput = () =>
                {
                    this.inputField.style.width = (GetTextSize(this.inputField.value, this.inputField) + 20) + "px";
                }
                break;
            case "boolean":
                this.inputField = document.createElement("select");
                this.inputField.style.backgroundColor = "var(--boolean-color)";

                const falseOption = document.createElement("option");
                falseOption.value = "false";
                falseOption.innerText = "False";
                
                const trueOption = document.createElement("option");
                trueOption.value = "true";
                trueOption.innerText = "True";

                this.inputField.appendChild(falseOption);
                this.inputField.appendChild(trueOption);
                break;
            case "string":
                this.inputField = document.createElement("input");
                this.inputField.style.backgroundColor = "var(--string-color)";
                this.inputField.type = "text";
                this.inputField.placeholder = "(empty)";
                this.inputField.style.minWidth = "120px";
                this.inputField.onkeydown = ev =>
                {
                    if (ev.keyCode === 13)
                        this.inputField.blur();
                }
                this.inputField.oninput = () =>
                {
                    this.inputField.style.width = (GetTextSize(this.inputField.value, this.inputField) + 20) + "px";
                }
                break;
            default:
                console.error("unknown literal expression type: " + type);
                break;
        }

        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(this.inputField);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    getType() { return this.type; }
}

class NumberLiteralExpression extends LiteralExpression
{
    constructor(parentNode)
    {
        super(parentNode, "number");
    }

    getType() { return "number"; }
}

class BooleanLiteralExpression extends LiteralExpression
{
    constructor(parentNode)
    {
        super(parentNode, "boolean");
    }

    getType() { return "boolean"; }
}

class StringLiteralExpression extends LiteralExpression
{
    constructor(parentNode)
    {
        super(parentNode, "string");
    }

    getType() { return "string"; }
}

class VariableExpression extends ExpressionBase
{
    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "unary-expression";

        // header text
        const header = document.createElement("div");
        header.innerText = "Value of";
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
            this.recalculateDraggableSizes();
        }

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.inputField);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }
}
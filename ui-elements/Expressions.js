
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
        elementHandler.RegisterQuickAdd(this.parentNode, this.expression1, this.expression1PlaceholderPlus, acceptsType);

        this.operatorSelector = document.createElement("select");
        for (let i = 0; i < texts.length; ++i)
        {
            const text = texts[i];
            const option = document.createElement("option");
            option.text = text;
            option.value = text;
            this.operatorSelector.appendChild(option);
        }
        this.operatorSelector.className = "operator-selector";

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

        // placeholder for expression 2 +
        this.expression2PlaceholderPlus = document.createElement("div");
        this.expression2PlaceholderPlus.className = "expression-placeholder";
        this.expression2PlaceholderPlus.innerText = "+";
        this.expression2.appendChild(this.expression2PlaceholderPlus);
        elementHandler.RegisterQuickAdd(this.parentNode, this.expression2, this.expression2PlaceholderPlus, acceptsType);

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
        this.element.appendChild(this.operatorSelector);
        this.element.appendChild(this.expression2);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    onHoverEnterExpression(index, element)
    {
        //console.log("hover enter");
        this["expression" + index].classList.remove("drop-normal");
        this["expression" + index].classList.add("drop-highlight");
    }

    onHoverLeaveExpression(index, element)
    {
        //console.log("hover leave");
        this["expression" + index].classList.add("drop-normal");
        this["expression" + index].classList.remove("drop-highlight");
    }

    onDropExpression(index, element)
    {
        this["hasExpression" + index] = true;
        this["expression" + index + "PlaceholderPlus"].style.display = "none";
        this["expression" + index].style.minWidth = "";
        this["expression" + index].classList.add("not-empty");
        //console.log("drop");
        element.style.position = "static";
        this["expression" + index].appendChild(element);
        element.classList.add("nested");
        element.classList.add("nested-as-expression");

        this.recalculateDraggableSizes();
    }

    onDetachExpression(index, element)
    {
        this["hasExpression" + index] = false;
        this["expression" + index + "PlaceholderPlus"].style.display = "";
        this["expression" + index].style.minWidth = this.expressionMinWidth;
        this["expression" + index].classList.remove("not-empty");
        //console.log("detach");
        this.parentNode.appendChild(element);
        element.classList.remove("nested");
        element.classList.remove("nested-as-expression");

        this.recalculateDraggableSizes();
    }

    getType() { return this.returnType; }

    getExpressionCompiled(exp, errors)
    {
        const expressionNodes = exp.children;
        for (let expression of expressionNodes)
        {
            if (expression.uiElementData && expression.uiElementData instanceof ElementBase)
                return expression.uiElementData.compile(errors);
        }

        return null;
    }

    getOperator()
    {
        return this.operatorSelector.value;
    }

    getFirstExpressionUIElementCompiled(errors)
    {
        return this.getExpressionCompiled(this.expression1, errors);
    }

    getSecondExpressionUIElementCompiled(errors)
    {
        return this.getExpressionCompiled(this.expression2, errors);
    }

    load(data)
    {
        if (data.first)
            compiler.LoadElement(this.parentNode, data.first, this.expression1);

        if (data.second)
            compiler.LoadElement(this.parentNode, data.second, this.expression2);

        this.operatorSelector.value = data.operator;
    }
}

class BinaryBooleanExpression extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["&&", "||", "^", "==", "!="], "boolean", "boolean");
    }

    compile(errors)
    {
        const compiled = {
            expressionType: "binaryBooleanExpression",
            first: this.getFirstExpressionUIElementCompiled(errors),
            second: this.getSecondExpressionUIElementCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.first)
        {
            errors.push({
                message: "Missing {{first expression}} from {{boolean expression}}",
                data: [this.expression1, this.element]
            });
        }

        if (!compiled.second)
        {
            errors.push({
                message: "Missing {{second expression}} from {{boolean expression}}",
                data: [this.expression2, this.element]
            });
        }

        return compiled;
    }
}

class BinaryNumericExpression extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["+", "-", "*", "/", "%", "**", "&", "|", "^", "<<", ">>"], "number", "number");
    }

    compile(errors)
    {
        const compiled =  {
            expressionType: "binaryNumericExpression",
            first: this.getFirstExpressionUIElementCompiled(errors),
            second: this.getSecondExpressionUIElementCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.first)
        {
            errors.push({
                message: "Missing {{first expression}} from {{numeric expression}}",
                data: [this.expression1, this.element]
            });
        }

        if (!compiled.second)
        {
            errors.push({
                message: "Missing {{second expression}} from {{numeric expression}}",
                data: [this.expression2, this.element]
            });
        }

        return compiled;
    }
}

class BinaryStringExpression extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["+"], "string", "string");
    }

    compile(errors)
    {
        const compiled = {
            expressionType: "binaryStringExpression",
            first: this.getFirstExpressionUIElementCompiled(errors),
            second: this.getSecondExpressionUIElementCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.first)
        {
            errors.push({
                message: "Missing {{first expression}} from {{string expression}}",
                data: [this.expression1, this.element]
            });
        }

        if (!compiled.second)
        {
            errors.push({
                message: "Missing {{second expression}} from {{string expression}}",
                data: [this.expression2, this.element]
            });
        }

        return compiled;
    }
}

class NumberComparison extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["<", ">", "<=", ">=", "==", "!="], "number", "boolean");
    }

    compile(errors)
    {
        const compiled = {
            expressionType: "numberComparison",
            first: this.getFirstExpressionUIElementCompiled(errors),
            second: this.getSecondExpressionUIElementCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.first)
        {
            errors.push({
                message: "Missing {{first expression}} from {{number comparison}}",
                data: [this.expression1, this.element]
            });
        }

        if (!compiled.second)
        {
            errors.push({
                message: "Missing {{second expression}} from {{number comparison}}",
                data: [this.expression2, this.element]
            });
        }

        return compiled;
    }
}

class StringComparison extends BinaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["==", "!="], "string", "boolean");
    }

    compile(errors)
    {
        const compiled = {
            expressionType: "stringComparison",
            first: this.getFirstExpressionUIElementCompiled(errors),
            second: this.getSecondExpressionUIElementCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.first)
        {
            errors.push({
                message: "Missing {{first expression}} from {{string comparison}}",
                data: [this.expression1, this.element]
            });
        }

        if (!compiled.second)
        {
            errors.push({
                message: "Missing {{second expression}} from {{string comparison}}",
                data: [this.expression2, this.element]
            });
        }

        return compiled;
    }
}

class UnaryExpression extends ExpressionBase
{
    constructor(parentNode, texts, acceptsType, returnType)
    {
        super();
        this.parentNode = parentNode;
        this.returnType = returnType; // type of the expression
        this.acceptsType = acceptsType; // what type can be dropped into the expressions
    
        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "binary-expression";

        this.expressionMinWidth = "80px";
        
        // expression drop area
        this.hasExpression = false;
        this.expression = document.createElement("div");
        this.expression.className = "expression";
        this.expression.style.minWidth = this.expressionMinWidth;
        draggable.CreateDropArea(this.expression, {
            check: elem => elem.uiElementData && elem.uiElementData.isExpression()
                && (elem.uiElementData.getType() === this.acceptsType || elem.uiElementData.getType() === "any") && !this.hasExpression,
            hoverenter: elem => this.onHoverEnterExpression(elem),
            hoverleave: elem => this.onHoverLeaveExpression(elem),
            drop: elem => this.onDropExpression(elem),
            detach: elem => this.onDetachExpression(elem)
        });

        // placeholder for expression +
        this.expressionPlaceholderPlus = document.createElement("div");
        this.expressionPlaceholderPlus.className = "expression-placeholder";
        this.expressionPlaceholderPlus.innerText = "+";
        this.expression.appendChild(this.expressionPlaceholderPlus);
        elementHandler.RegisterQuickAdd(this.parentNode, this.expression, this.expressionPlaceholderPlus, acceptsType);

        this.operatorSelector = document.createElement("select");
        for (let i = 0; i < texts.length; ++i)
        {
            const text = texts[i];
            const option = document.createElement("option");
            option.text = text;
            option.value = text;
            this.operatorSelector.appendChild(option);
        }
        this.operatorSelector.className = "operator-selector";

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        switch (acceptsType)
        {
            case "number":
                this.expression.style.backgroundColor = "var(--number-color)";
                break;
            case "boolean":
                this.expression.style.backgroundColor = "var(--boolean-color)";
                break;
            case "string":
                this.expression.style.backgroundColor = "var(--string-color)";
                break;
        }

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(this.operatorSelector);
        this.element.appendChild(this.expression);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    onHoverEnterExpression(element)
    {
        //console.log("hover enter");
        this.expression.classList.remove("drop-normal");
        this.expression.classList.add("drop-highlight");
    }

    onHoverLeaveExpression(element)
    {
        //console.log("hover leave");
        this.expression.classList.add("drop-normal");
        this.expression.classList.remove("drop-highlight");
    }

    onDropExpression(element)
    {
        this.hasExpression = true;
        this.expressionPlaceholderPlus.style.display = "none";
        this.expression.style.minWidth = "";
        this.expression.classList.add("not-empty");
        //console.log("drop");
        element.style.position = "static";
        this.expression.appendChild(element);
        element.classList.add("nested");
        element.classList.add("nested-as-expression");

        this.recalculateDraggableSizes();
    }

    onDetachExpression(element)
    {
        this.hasExpression = false;
        this.expressionPlaceholderPlus.style.display = "";
        this.expression.style.minWidth = this.expressionMinWidth;
        this.expression.classList.remove("not-empty");
        //console.log("detach");
        this.parentNode.appendChild(element);
        element.classList.remove("nested");
        element.classList.remove("nested-as-expression");

        this.recalculateDraggableSizes();
    }

    getType() { return this.returnType; }

    getOperator()
    {
        return this.operatorSelector.value;
    }

    getExpressionCompiled(errors)
    {
        const expressionNodes = this.expression.children;
        for (let expression of expressionNodes)
        {
            if (expression.uiElementData && expression.uiElementData instanceof ElementBase)
                return expression.uiElementData.compile(errors);
        }

        return null;
    }

    load(data)
    {
        this.operatorSelector.value = data.operator;

        if (data.value)
            compiler.LoadElement(this.parentNode, data.value, this.expression);
    }
}

class UnaryBooleanExpression extends UnaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["!"], "boolean", "boolean");
    }

    compile(errors)
    {
        const compiled = {
            expressionType: "unaryBooleanExpression",
            value: this.getExpressionCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.value)
        {
            errors.push({
                message: "Missing {{expression}} from {{unary boolean expression}}",
                data: [this.expression, this.element]
            });
        }

        return compiled;
    }
}

class UnaryNumericExpression extends UnaryExpression
{
    constructor(parentNode)
    {
        super(parentNode, ["-", "+", "~"], "number", "number");
    }

    compile(errors)
    {
        const compiled = {
            expressionType: "unaryNumericExpression",
            value: this.getExpressionCompiled(errors),
            operator: this.getOperator(),
            srcElement: this
        };

        if (!compiled.value)
        {
            errors.push({
                message: "Missing {{expression}} from {{unary numeric expression}}",
                data: [this.expression, this.element]
            });
        }

        return compiled;
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
                this.inputField.style.minWidth = "100px";
                this.inputField.onchange = () =>
                {
                    const inputStr = this.inputField.value.toLowerCase();
                    let num;
                    if (inputStr === "infinity")
                        num = Infinity;
                    else if (inputStr === "nan")
                        num = NaN;
                    else
                    {
                        num = Number(this.inputField.value);
                        if (isNaN(num))
                            num = 0;
                    }

                    this.inputField.value = String(num);
                    this.inputField.style.width = (helper.GetTextSize(this.inputField.value, this.inputField) + 20) + "px";
                };
                this.inputField.onkeydown = ev =>
                {
                    if (ev.keyCode === 13)
                        this.inputField.blur();
                }
                this.inputField.oninput = () =>
                {
                    this.inputField.style.width = (helper.GetTextSize(this.inputField.value, this.inputField) + 20) + "px";
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
                    this.inputField.style.width = (helper.GetTextSize(this.inputField.value, this.inputField) + 20) + "px";
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

    load(data)
    {
        this.inputField.value = String(data.value);
        this.inputField.oninput && this.inputField.oninput();
    }
}

class NumberLiteralExpression extends LiteralExpression
{
    constructor(parentNode)
    {
        super(parentNode, "number");
    }

    getType() { return "number"; }

    compile(errors)
    {
        return {
            expressionType: "numberLiteralExpression",
            value: Number(this.inputField.value),
            type: "number",
            srcElement: this
        };
    }
}

class BooleanLiteralExpression extends LiteralExpression
{
    constructor(parentNode)
    {
        super(parentNode, "boolean");
    }

    getType() { return "boolean"; }

    compile(errors)
    {
        return {
            expressionType: "booleanLiteralExpression",
            value: this.inputField.value === "true",
            type: "boolean",
            srcElement: this
        };
    }
}

class StringLiteralExpression extends LiteralExpression
{
    constructor(parentNode)
    {
        super(parentNode, "string");
    }

    getType() { return "string"; }

    compile(errors)
    {
        return {
            expressionType: "stringLiteralExpression",
            value: this.inputField.value,
            type: "string",
            srcElement: this
        };
    }
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
            this.recalculateDraggableSizes();
        }

        // drag handle
        this.dragHandle = document.createElement("div");
        this.dragHandle.className = "drag-handle";

        this.element.appendChild(this.dragHandle);
        this.element.appendChild(header);
        this.element.appendChild(this.variableNameInputField);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, this.dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }

    compile(errors)
    {
        return {
            expressionType: "variableExpression",
            variableName: this.variableNameInputField.value,
            srcElement: this
        }
    }

    load(data)
    {
        this.variableNameInputField.value = data.variableName;
        this.variableNameInputField.oninput();
    }
}

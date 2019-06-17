
class BinaryBooleanExpression extends ExpressionBase
{
    constructor(parentNode, text)
    {
        super();
        this.parentNode = parentNode;
    
        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "boolean-expression";

        this.expressionMinWidth = "80px";
        // expression 1 drop area
        this.hasExpression1 = false;
        this.expression1 = document.createElement("div");
        this.expression1.className = "expression";
        this.expression1.style.minWidth = this.expressionMinWidth;
        draggable.CreateDropArea(this.expression1, {
            check: elem => elem.uiElementData && elem.uiElementData.isExpression(),
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

        const andText = document.createElement("div");
        andText.innerText = text;
        andText.className = "main-text";

        // expression 2 drop area
        this.hasExpression2 = false;
        this.expression2 = document.createElement("div");
        this.expression2.className = "expression";
        this.expression2.style.minWidth = this.expressionMinWidth;
        draggable.CreateDropArea(this.expression2, {
            check: elem => elem.uiElementData && elem.uiElementData.isExpression(),
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

        this.element.appendChild(this.expression1);
        this.element.appendChild(andText);
        this.element.appendChild(this.expression2);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, andText);
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

    getType() { return "boolean"; }
}
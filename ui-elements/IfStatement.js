
class IfStatement extends StatementBase
{
    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.style = "display: flex; flex-direction: column; position: absolute; background: black; border: 2px solid red; font-size: 20px;";

        // header: if (condition)
        this.header = document.createElement("div");
        this.header.style = "display: flex; justify-content: flex-start;";

        const dragHandle = document.createElement("div");
        dragHandle.style = "display: inline-block; align-self: stretch; flex-shrink: 0; width: 10px; top: 0px; cursor: grab; background: cyan;";
        this.header.appendChild(dragHandle);

        const ifText = document.createElement("div");
        ifText.innerText = "if";
        ifText.style = "padding: 5px 10px;";

        // condition drop area
        this.hasCondition = false;
        this.mainCondition = document.createElement("div");
        this.mainCondition.style = "border: 2px solid black; background: #404040; display: inline-block; width: 100%;";
        draggable.CreateDropArea(this.mainCondition, {
            check: elem => !this.hasCondition,
            hoverenter: this.onHoverEnterCondition.bind(this),
            hoverleave: this.onHoverLeaveCondition.bind(this),
            drop: this.onDropCondition.bind(this),
            detach: this.onDetachCondition.bind(this)
        });

        // placeholder for the main condition +
        this.mainConditionPlaceholder = document.createElement("div");
        this.mainConditionPlaceholder.style = "width: 100%; text-align: center;";
        this.mainConditionPlaceholder.innerText = "+";
        this.mainCondition.appendChild(this.mainConditionPlaceholder);

        this.header.appendChild(ifText);
        this.header.appendChild(this.mainCondition);

        this.element.appendChild(this.header);

        this.mainBlockContainer = document.createElement("div");
        this.mainBlockContainer.style = "display: flex; justify-content: flex-start; width: 100%;";
        // the statements of the main block
        this.mainBlock = document.createElement("div");
        this.mainBlock.style = "background: #404040; border: 2px solid black; width: 100%; text-align: center;";

        this.mainBlockPlaceholder = document.createElement("div");
        this.mainBlockPlaceholder.style = "align-self: stretch;";
        this.mainBlockPlaceholder.innerText = "+";

        this.mainBlock.appendChild(this.mainBlockPlaceholder);

        const mainBlockBorderLeft = document.createElement("div");
        mainBlockBorderLeft.style = "flex-shrink: 0; align-self: stretch; background: #ff8000; width: 30px;";
        this.mainBlockContainer.appendChild(mainBlockBorderLeft);
        draggable.CreateDropArea(this.mainBlock, {
            hoverenter: this.onHoverEnterBlock.bind(this),
            hoverleave: this.onHoverLeaveBlock.bind(this),
            drop: this.onDropBlock.bind(this),
            detach: this.onDetachBlock.bind(this)
        });

        this.mainBlockContainer.appendChild(this.mainBlock);

        this.element.appendChild(this.mainBlockContainer);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, dragHandle);
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

    onHoverEnterCondition(element)
    {
        console.log("hover enter");
        this.mainCondition.style.border = "2px dashed black";
        this.mainCondition.style.background = "#a0a0a0";
    }

    onHoverLeaveCondition(element)
    {
        console.log("hover leave");
        this.mainCondition.style.border = "2px solid black";
        this.mainCondition.style.background = "#404040";
    }

    onDropCondition(element)
    {
        this.hasCondition = true;
        this.mainConditionPlaceholder.style.display = "none";
        console.log("drop");
        element.style.position = "";
        this.mainCondition.appendChild(element);

        this.recalculateDraggableSizes();
    }

    onDetachCondition(element)
    {
        this.hasCondition = false;
        this.mainConditionPlaceholder.style.display = "";
        console.log("detach");
        //this.mainCondition.removeChild(elem);
        this.parentNode.appendChild(element);

        this.recalculateDraggableSizes();
    }
    
    onHoverEnterBlock(element)
    {
        console.log("hover enter");
        this.mainBlock.style.border = "2px dashed black";
        this.mainBlock.style.background = "#a0a0a0";
    }

    onHoverLeaveBlock(element)
    {
        console.log("hover leave");
        this.mainBlock.style.border = "2px solid black";
        this.mainBlock.style.background = "#404040";
    }

    onDropBlock(element)
    {
        console.log("drop");
        element.style.position = "";
        this.mainBlock.appendChild(element);

        this.recalculateDraggableSizes();
    }

    onDetachBlock(element)
    {
        console.log("detach");
        //this.mainCondition.removeChild(elem);
        this.parentNode.appendChild(element);

        this.recalculateDraggableSizes();
    }
}


class IfStatement extends StatementBase
{
    constructor(parentNode)
    {
        super();
        this.parentNode = parentNode;
        this.childCount = 0;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "if-statement";

        // header: if (condition)
        this.header = document.createElement("div");
        this.header.className = "header";

        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        this.element.appendChild(dragHandle);

        const container = document.createElement("div");
        container.className = "container";
        this.element.appendChild(container);

        const ifText = document.createElement("div");
        ifText.innerText = "if";
        ifText.className = "iftext";

        // condition drop area
        this.mainConditionMinWidth = "150px";
        this.hasCondition = false;
        this.mainCondition = document.createElement("div");
        this.mainCondition.className = "maincondition drop-normal";
        this.mainCondition.style.minWidth = this.mainConditionMinWidth;
        draggable.CreateDropArea(this.mainCondition, {
            check: elem => !this.hasCondition && elem.uiElementData && elem.uiElementData.isExpression(),
            hoverenter: this.onHoverEnterCondition.bind(this),
            hoverleave: this.onHoverLeaveCondition.bind(this),
            drop: this.onDropCondition.bind(this),
            detach: this.onDetachCondition.bind(this)
        });

        // placeholder for the main condition +
        this.mainConditionPlaceholder = document.createElement("div");
        this.mainConditionPlaceholder.className = "maincondition-placeholder";
        this.mainConditionPlaceholder.innerText = "+";
        this.mainCondition.appendChild(this.mainConditionPlaceholder);

        this.header.appendChild(ifText);
        this.header.appendChild(this.mainCondition);

        container.appendChild(this.header);

        this.mainBlockContainer = document.createElement("div");
        this.mainBlockContainer.className = "mainblock-container";
        // the statements of the main block
        this.mainBlockMinWidth = "200px";
        this.mainBlock = document.createElement("div");
        this.mainBlock.className = "mainblock";
        this.mainBlock.style.minWidth = this.mainBlockMinWidth;

        this.mainBlockPlaceholder = document.createElement("div");
        this.mainBlockPlaceholder.className = "mainblock-placeholder";
        this.mainBlockPlaceholder.innerText = "+";

        this.mainBlock.appendChild(this.mainBlockPlaceholder);
        this.mainBlockPlaceholderActive = true;

        const mainBlockBorderLeft = document.createElement("div");
        mainBlockBorderLeft.className = "mainblock-borderleft";
        this.mainBlockContainer.appendChild(mainBlockBorderLeft);
        draggable.CreateDropArea(this.mainBlock, {
            check: elem => elem.uiElementData && elem.uiElementData.isStatement(),
            hoverenter: this.onHoverEnterBlock.bind(this),
            hoverleave: this.onHoverLeaveBlock.bind(this),
            hovermove: this.onHoverMoveBlock.bind(this),
            drop: this.onDropBlock.bind(this),
            detach: this.onDetachBlock.bind(this)
        });

        this.mainBlockContainer.appendChild(this.mainBlock);

        container.appendChild(this.mainBlockContainer);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, dragHandle);
        const style = getComputedStyle(this.element);
        draggable.ConstrainToElement(this.element, parentNode, 2 + Number(style.margin.match(/(\d+)/)[1]) + Number(style.border.match(/(\d+)/)[1]));
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
        this.mainConditionPlaceholder.classList.remove("drop-normal");
        this.mainConditionPlaceholder.classList.add("drop-highlight");
    }

    onHoverLeaveCondition(element)
    {
        console.log("hover leave");
        this.mainConditionPlaceholder.classList.add("drop-normal");
        this.mainConditionPlaceholder.classList.remove("drop-highlight");
    }

    onDropCondition(element)
    {
        this.hasCondition = true;
        this.mainConditionPlaceholder.style.display = "none";
        this.mainCondition.style.minWidth = "";
        this.mainCondition.classList.add("not-empty");
        console.log("drop");
        element.style.position = "static";
        this.mainCondition.appendChild(element);
        element.classList.add("nested");

        this.recalculateDraggableSizes();
    }

    onDetachCondition(element)
    {
        this.hasCondition = false;
        this.mainConditionPlaceholder.style.display = "";
        this.mainCondition.style.minWidth = this.mainConditionMinWidth;
        this.mainCondition.classList.remove("not-empty");
        console.log("detach");
        this.parentNode.appendChild(element);
        element.classList.remove("nested");

        this.recalculateDraggableSizes();
    }
    
    onHoverEnterBlock(element)
    {
        console.log("hover enter");
        this.mainBlockPlaceholder.classList.remove("drop-normal");
        this.mainBlockPlaceholder.classList.add("drop-highlight");

        this.mainBlockPlaceholderActive = true;
        this.mainBlock.appendChild(this.mainBlockPlaceholder);
    }

    onHoverMoveBlock(element, mouseX, mouseY)
    {
        let foundElem = undefined;

        for (let child of this.mainBlock.children)
        {
            const { y, height } = GetCoords(child);
            if (y + height / 2 > mouseY)
            {
                foundElem = child;
                break;
            }
        }

        if (foundElem !== undefined)
        {
            if (foundElem !== this.mainBlockPlaceholder)
                this.mainBlock.insertBefore(this.mainBlockPlaceholder, foundElem);
        }
        else
        {
            this.mainBlock.appendChild(this.mainBlockPlaceholder);
        }
    }

    onHoverLeaveBlock(element, isDrop)
    {
        if (!isDrop && this.childCount !== 0 && this.mainBlockPlaceholderActive)
        {
            this.mainBlock.removeChild(this.mainBlockPlaceholder);
            this.mainBlockPlaceholderActive = false;
        }

        console.log("hover leave");
        this.mainBlockPlaceholder.classList.add("drop-normal");
        this.mainBlockPlaceholder.classList.remove("drop-highlight");
    }

    onDropBlock(element)
    {
        ++this.childCount;
        if (this.mainBlockPlaceholderActive)
        {
            this.mainBlock.replaceChild(element, this.mainBlockPlaceholder);
            this.mainBlockPlaceholderActive = false;
        }
        else
            throw "ehh";

        console.log("drop");
        element.style.position = "static";
        this.mainBlock.style.minWidth = "";

        this.recalculateDraggableSizes();
    }

    onDetachBlock(element)
    {
        --this.childCount;
        if (this.childCount === 0)
            this.mainBlock.appendChild(this.mainBlockPlaceholder);

        console.log("detach");
        this.mainBlock.style.minWidth = this.mainBlockMinWidth;
        this.parentNode.appendChild(element);

        this.recalculateDraggableSizes();
    }
}

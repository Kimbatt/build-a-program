
class BlockBase extends ElementBase
{
    isStatement() { return true; }
    isExpression() { return false; }

    constructor(parentNode, headerText, headerElements)
    {
        super();
        this.parentNode = parentNode;
        this.childCount = 0;

        // main element
        this.element = document.createElement("div");
        this.element.uiElementData = this;
        this.element.className = "block";

        // header: text + expressions/statements
        this.header = document.createElement("div");
        this.header.className = "header";

        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        this.element.appendChild(dragHandle);

        const container = document.createElement("div");
        container.className = "container";
        this.element.appendChild(container);

        const headerTextDiv = document.createElement("div");
        headerTextDiv.innerText = headerText;
        headerTextDiv.className = "header-text";
        this.header.appendChild(headerTextDiv);

        // header drop areas
        this.headerDropAreas = new Array(headerElements.length);
        this.headerDropAreaMinWidth = "150px";
        for (let i = 0; i < headerElements.length; ++i)
        {
            const expressionType = headerElements[i];
            const headerElement = {};
            headerElement.isEmpty = true;
            
            const dropArea = document.createElement("div");
            dropArea.className = "header-drop-area drop-normal";
            dropArea.style.minWidth = this.headerDropAreaMinWidth;
            
            switch (expressionType)
            {
                case "number":
                    dropArea.style.background = "var(--number-color)";
                    break;
                case "boolean":
                    dropArea.style.background = "var(--boolean-color)";
                    break;
                case "string":
                    dropArea.style.background = "var(--string-color)";
                    break;
            }

            headerElement.dropArea = dropArea;

            // placeholder while empty +
            const dropAreaPlaceholder = document.createElement("div");
            dropAreaPlaceholder.className = "header-drop-area-placeholder";
            dropAreaPlaceholder.innerText = "+";
            dropArea.appendChild(dropAreaPlaceholder);
            headerElement.dropAreaPlaceholder = dropAreaPlaceholder;

            draggable.CreateDropArea(dropArea,
            {
                check: elem => headerElement.isEmpty && elem.uiElementData && elem.uiElementData.getType() === expressionType,
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
                    dropArea.isEmpty = false;
                    dropAreaPlaceholder.style.display = "none";
                    dropAreaPlaceholder.style.minWidth = "";
                    dropArea.classList.add("not-empty");
                    console.log("drop");
                    element.style.position = "static";
                    dropArea.appendChild(element);
                    element.classList.add("nested");

                    this.recalculateDraggableSizes();
                },
                detach: element =>
                {
                    dropArea.isEmpty = true;
                    dropAreaPlaceholder.style.display = "";
                    dropArea.style.minWidth = this.headerDropAreaMinWidth;
                    dropArea.classList.remove("not-empty");
                    console.log("detach");
                    this.parentNode.appendChild(element);
                    element.classList.remove("nested");

                    this.recalculateDraggableSizes();
                }
            });

            this.header.appendChild(dropArea);
            this.headerDropAreas[i] = headerElement;
        }

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
        draggable.ConstrainToElement(this.element, parentNode,
            2 + Number(style.margin ? style.margin.match(/(\d+)/)[1] : 0) + Number(style.border ? style.border.match(/(\d+)/)[1] : 0));
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


class IfStatement extends StatementBase
{
    constructor(parentNode)
    {
        super();
        this.element = document.createElement("div");
        this.element.style = "display: table; position: absolute; border: 2px solid red;";

        this.header = document.createElement("div");
        this.header.style.display = "table";

        const dragHandle = document.createElement("div");
        dragHandle.style = "display: table-cell; height: 100%; width: 10px; top: 0px; cursor: grab; background: cyan;";
        this.header.appendChild(dragHandle);

        const ifText = document.createElement("div");
        ifText.innerText = "if";
        ifText.style.display = "inline-block";

        this.mainCondition = document.createElement("div");
        this.mainCondition.style.border = "2px solid black";
        this.mainCondition.style.background = "#404040";
        this.mainCondition.style.display = "inline-block";
        draggable.CreateDropArea(this.mainCondition, {
            hoverenter: elem =>
            {
                console.log("hover enter");
                this.mainCondition.style.border = "2px dashed black";
                this.mainCondition.style.background = "#a0a0a0";
            },
            hoverleave: elem =>
            {
                console.log("hover leave");
                this.mainCondition.style.border = "2px solid black";
                this.mainCondition.style.background = "#404040";
            },
            drop: elem =>
            {
                console.log("drop");
                elem.style.position = "";
                this.mainCondition.appendChild(elem);
            },
            detach: elem =>
            {
                console.log("detach");
                //this.mainCondition.removeChild(elem);
                parentNode.appendChild(elem);
            }
        });

        this.mainCondition.innerText = "+";

        this.header.appendChild(ifText);
        this.header.appendChild(this.mainCondition);

        this.element.appendChild(this.header);

        parentNode.appendChild(this.element);
        draggable.AddElement(this.element, dragHandle);
        draggable.ConstrainToElement(this.element, parentNode, 2);
    }
}

const allUIElementsByType = {};

class ElementBase
{
    constructor()
    {
        this.elementGuid = helper.GetGuid("element");
        
        const currentType = this.constructor.name;
        let elementsOfCurrentType = allUIElementsByType.getOwnProperty(currentType);
        if (!elementsOfCurrentType)
        {
            elementsOfCurrentType = {};
            allUIElementsByType[currentType] = elementsOfCurrentType;
        }

        elementsOfCurrentType[this.elementGuid] = this;
    }

    isExpression() {}
    isStatement() {}

    getType() { return "void"; }

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

    compile(errors) {}

    delete()
    {
        if (this.constructor.name === "FunctionBody")
        {
            // FunctionBody instances are not deletable
            return;
        }

        const elementsOfCurrentType = allUIElementsByType.getOwnProperty(this.constructor.name);
        if (elementsOfCurrentType)
        {
            delete elementsOfCurrentType[this.elementGuid];

            const parentNode = this.element.parentNode;
            if (parentNode)
                parentNode.removeChild(this.element);
        }
    }
}

class StatementBase extends ElementBase
{
    isStatement() { return true; }
    isExpression() { return false; }
}

class ExpressionBase extends ElementBase
{
    isStatement() { return false; }
    isExpression() { return true; }

    getType() { return "any"; }
}

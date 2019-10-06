
class ElementBase
{
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


class StatementBase extends ElementBase
{
    isStatement() { return true; }
    isExpression() { return false; }
}

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

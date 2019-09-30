
class FunctionBody extends BlockBase
{
    constructor(parentNode)
    {
        super(parentNode, "Function", []);
    }

    isExpression() { return false; }
    isStatement() { return false; }
}

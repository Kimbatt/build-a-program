
class FunctionBody extends BlockBase
{
    constructor(parentNode, functionName)
    {
        super(parentNode, functionName + " (function)", []);
    }

    isExpression() { return false; }
    isStatement() { return false; }
}

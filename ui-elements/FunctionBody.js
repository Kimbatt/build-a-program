
class FunctionBody extends BlockBase
{
    constructor(parentNode, functionName)
    {
        super(parentNode, functionName + " (function)", []);
        this.functionName = functionName;
    }

    isExpression() { return false; }
    isStatement() { return false; }

    compile()
    {
        return {
            parameters: [],
            block: super.compile()
        };
    }
}

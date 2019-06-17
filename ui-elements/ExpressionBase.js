
class ExpressionBase extends ElementBase
{
    isStatement() { return false; }
    isExpression() { return true; }

    getType() {}
}

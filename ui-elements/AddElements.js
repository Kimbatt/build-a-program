
const searchKeywords = {
    "If": () => new IfStatement(),
    "While": () => new WhileStatement(),
    "Numeric expression": () => new BinaryNumericExpression(),
    "Boolean expression": () => new BinaryBooleanExpression(),
    "String expression": () => new BinaryStringExpression(),
    "Number comparison": () => new NumberComparison(),
    "String comparison": () => new StringComparison()
};
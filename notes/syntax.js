
abstract class statement;
abstract class expression;

class literal extends expression
{
    type: string;
    value: any;
}

class variable extends expression
{
    variableName: string;
}

class unaryBooleanExpression extends expression
{
    value: expression;
    operator: string; // negate only
}

class binaryBooleanExpression extends expression
{
    first: expression;
    second: expression;
    operator: string; // possible operators: && || ^ == !=
}

class unaryNumericExpression extends expression
{
    value: expression;
    operator: string; // possible operators: + - ~
}

class binaryNumericExpression extends expression
{
    first: expression;
    second: expression;
    operator: string; // possible operators: + - * / % & | ^ << >>
}

class numberComparison extends expression
{
    first: expression;
    second: expression;
    operator: string; // possible operators: < > <= >= == !=
}

///////////////

class block extends statement
{
    statements: statement[];
}

class variableDeclaration extends statement
{
    variableName: string;
    variableValue: literal;
}

class variableAssignment extends statement
{
    variableName: string;
    newVariableValue: expression;
}

class functionCall extends statement
{
    functionName: string;
    parameters: expression[];
}

class ifStatement extends statement
{
    // conditions.length must be equal to blocks.length
    conditions: expression[];
    blocks: block[];
    elseBlock: block?;
}

class whileStatement extends statement
{
    condition: expression;
    block: block;
}


















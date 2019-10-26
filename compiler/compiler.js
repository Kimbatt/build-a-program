
/**
 * @param {string} variableName 
 */
function CheckVariableName(variableName)
{
    if (variableName === "")
        return "Variable name is empty";

    if (/^[0-9]/.test(variableName))
        return "Variable name must not start with a number";

    if (variableName.includes(" "))
        return "Variable name must not contain spaces";

    return "OK";
}

async function CompileAndRun()
{
    if (document.getElementById("clear-console-on-run-checkbox").checked)
        ConsoleClear();

    if (!consoleIsVisible)
    {
        ConsoleShow();
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    const errors = [];
    const compiled = GenerateProgramJSON(errors);
    CheckVariables(compiled, errors);

    if (errors.length !== 0)
    {
        for (let error of errors)
            ConsoleError("Compile error: " + error.message);

        return;
    }

    RunProgram({
        mainFunction: compiled
    });
}

/**
 * @param {any[]} errors 
 */

function CheckVariables(functionBlock, errors)
{
    // todo: function parameters
    const mainBlock = functionBlock.block;

    const stack = [];

    function GetVariableType(variableName)
    {
        for (let block of stack)
        {
            if (block.hasOwnProperty(variableName))
                return block[variableName];
        }

        return "unknown";
    }

    function AnOrA(str)
    {
        return /^[aeiou]/i.test(str) ? "an" : "a";
    }

    function CheckSingleExpression(expressionText, expression, requiredType, ordinal)
    {
        if (CheckExpression(expression))
        {
            const expressionType = GetExpressionType(expression);
            if (expressionType !== requiredType)
            {
                if (expressionType !== "unknown")
                {
                    errors.push({
                        message: "The " + ordinal + "expression of " + expressionText + " must be " + AnOrA(requiredType) + " " + requiredType + " (currently: " + expressionType + ")",
                        data: []
                    });
                }
                return false;
            }
        }
        else
            return false;

        return true;
    }

    function CheckUnaryExpression(expressionText, expression, requiredType)
    {
        return CheckSingleExpression(expressionText, expression.first, requiredType, "");
    }

    function CheckBinaryExpression(expressionText, expression, requiredType)
    {
        const firstResult = CheckSingleExpression(expressionText, expression.first, requiredType, "first ");
        const secondResult = CheckSingleExpression(expressionText, expression.second, requiredType, "second ");
        return firstResult && secondResult;
    }

    function CheckExpression(expression)
    {
        if (!expression)
            return false;

        switch (expression.expressionType)
        {
            case "literal":
                return true;
            case "variable":
            {
                const checkResult = CheckVariableName(expression.variableName);
                if (checkResult !== "OK")
                {
                    errors.push({
                        message: checkResult,
                        data: []
                    });
                    return false;
                }

                if (GetVariableType(expression.variableName) === "unknown")
                {
                    errors.push({
                        message: "Variable " + expression.variableName + " must be declared before using it",
                        data: []
                    });
                    return false;
                }

                return true;
            }
            case "unaryBooleanExpression":
                return CheckUnaryExpression("a unary boolean expression", expression, "boolean");
            case "binaryBooleanExpression":
                return CheckBinaryExpression("a binary boolean expression", expression, "boolean");
            case "unaryNumericExpression":
                return CheckUnaryExpression("a unary numeric expression", expression, "number");
            case "binaryNumericExpression":
                return CheckBinaryExpression("a binary numeric expression", expression, "number");
            case "numberComparison":
                return CheckBinaryExpression("a number comparison", expression, "number");
            case "stringComparison":
                return CheckBinaryExpression("a string comparison", expression, "string");
            case "binaryStringExpression":
                return CheckBinaryExpression("a binary string expression", expression, "string");
        }

        return false;
    }

    function GetExpressionType(expression)
    {
        if (!expression)
            return "unknown";

        switch (expression.expressionType)
        {
            case "literal":
                return expression.type;
            case "variable":
                return GetVariableType(expression.variableName);
            case "unaryBooleanExpression":
            case "binaryBooleanExpression":
            case "numberComparison":
            case "stringComparison":
                return "boolean";
            case "unaryNumericExpression":
            case "binaryNumericExpression":
                return "number";
            case "binaryStringExpression":
                return "string";
        }

        return "unknown";
    }

    function CheckInternal(currentBlock)
    {
        const current = {};
        stack.push(current);

        for (let statement of currentBlock.statements)
        {
            switch (statement.statementType)
            {
                case "block":
                    CheckInternal(statement);
                    break;
                case "variableDeclaration":
                {
                    let ok = true;
                    const variableNameCheckResult = CheckVariableName(statement.variableName);
                    if (variableNameCheckResult !== "OK")
                    {
                        errors.push({
                            message: variableNameCheckResult,
                            data: []
                        });
                        ok = false;
                    }

                    if (ok && GetVariableType(statement.variableName) !== "unknown")
                    {
                        errors.push({
                            message: "Variable " + statement.variableName + " was already declared before",
                            data: []
                        });
                        ok = false;
                    }

                    if (ok)
                        current[statement.variableName] = statement.variableType;

                    break;
                }
                case "variableAssignment":
                {
                    let variableNameIsOk = true;
                    const variableNameCheckResult = CheckVariableName(statement.variableName);
                    if (variableNameCheckResult !== "OK")
                    {
                        errors.push({
                            message: variableNameCheckResult,
                            data: []
                        });
                        variableNameIsOk = false;
                    }

                    const requiredVariableType = GetVariableType(statement.variableName);
                    if (variableNameIsOk && requiredVariableType === "unknown")
                    {
                        errors.push({
                            message: "Variable " + statement.variableName + " must be declared before using it",
                            data: []
                        });
                        variableNameIsOk = false;
                    }

                    let expressionIsOk = true;
                    if (!statement.newVariableValue)
                    {
                        errors.push({
                            message: "Missing expression from variable assignment",
                            data: []
                        });
                        expressionIsOk = false;
                    }

                    if (CheckExpression(statement.newVariableValue))
                    {
                        const currentExpressionType = GetExpressionType(statement.newVariableValue);
                        if (expressionIsOk && requiredVariableType !== currentExpressionType
                            && requiredVariableType !== "unknown" && currentExpressionType !== "unknown")
                        {
                            errors.push({
                                message: "Variable " + statement.variableName + " is " + AnOrA(requiredVariableType) + " " + requiredVariableType
                                    + ", cannot assign " + AnOrA(currentExpressionType) + " " + currentExpressionType + " to it",
                                data: []
                            });
                        }
                    }

                    break;
                }
                case "whileStatement":
                {
                    if (CheckExpression(statement.condition))
                    {
                        const conditionExpressionType = GetExpressionType(statement.condition);
                        if (conditionExpressionType !== "boolean")
                        {
                            errors.push({
                                message: "Condition of a While statement must be a boolean expression (currently: " + conditionExpressionType + ")",
                                data: []
                            });
                        }
                    }

                    CheckInternal(statement.block);
                    break;
                }
                case "ifStatement":
                {
                    for (let condition of statement.conditions)
                    {
                        if (CheckExpression(condition))
                        {
                            const conditionExpressionType = GetExpressionType(condition);
                            if (conditionExpressionType !== "boolean")
                            {
                                errors.push({
                                    message: "All conditions of an If statement must be boolean expressions (currently: " + conditionExpressionType + ")",
                                    data: []
                                });
                            }
                        }
                    }

                    for (let block of statement.blocks)
                        CheckInternal(block);

                    if (statement.elseBlock)
                        CheckInternal(statement.elseBlock);

                    break;
                }
                case "functionCall":
                {
                    // todo
                    if (statement.functionName === "")
                    {
                        errors.push({
                            message: "Missing function name",
                            data: []
                        });
                    }

                    for (let parameter of statement.parameters)
                    {
                        if (parameter)
                            CheckExpression(parameter);
                        else
                        {
                            errors.push({
                                message: "Missing function parameter",
                                data: []
                            });
                        }
                    }

                    break;
                }
            }
        }

        stack.pop();
    }

    CheckInternal(mainBlock);
}

function GenerateProgramJSON(errors)
{
    const mainDragArea = document.getElementById("main-drag-area");

    const nodes = mainDragArea.childNodes;
    for (let elem of nodes)
    {
        if (elem.uiElementData instanceof FunctionBody && elem.uiElementData.functionName === "Main")
        {
            return elem.uiElementData.compile(errors);
        }
    }
}

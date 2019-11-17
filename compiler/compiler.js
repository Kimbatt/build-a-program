
const compiler = {};

/**
 * @param {string} variableName 
 */
compiler.CheckVariableName = function(variableName)
{
    if (variableName === "")
        return "Variable name is empty";

    if (/^[0-9]/.test(variableName))
        return "Variable name must not start with a number";

    if (variableName.includes(" "))
        return "Variable name must not contain spaces";

    if (/[!"#%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/.test(variableName))
        return "Variable name cannot contain any of the following characters: ! \" # % & ' ( ) * + , . / : ; < = > ? @ [ \\ ] ^ ` { | } ~";

    return "OK";
};

compiler.CompileAndRun = async function()
{
    if (document.getElementById("clear-console-on-run-checkbox").checked)
        Console.Clear();

    if (!Console.consoleIsVisible)
    {
        Console.Show();
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    const errors = [];
    const compiled = compiler.GenerateProgramJSON(errors);

    for (let func in compiled)
        compiler.CheckVariables(compiled[func], errors);

    if (errors.length !== 0)
    {
        for (let error of errors)
            Console.Error("Compile error: " + error.message);

        return;
    }

    await runner.RunProgram(compiled);

    Console.consoleLinesDiv.scrollTo(0, Console.consoleLinesDiv.scrollHeight);
};

/**
 * @param {any[]} errors 
 */
compiler.CheckVariables = function(compiledFunction, errors)
{
    const mainBlock = compiledFunction.block;
    const parameters = compiledFunction.parameters;

    const parametersByName = {};
    for (let param of parameters)
        parametersByName[param.name] = param;

    const stack = [];

    function GetVariableType(variableName)
    {
        for (let block of stack)
        {
            if (block.hasOwnProperty(variableName))
                return block[variableName];
        }

        if (parametersByName.hasOwnProperty(variableName))
            return parametersByName[variableName].type;

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
                const checkResult = compiler.CheckVariableName(expression.variableName);
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
            case "functionCall":
            {
                if (!expression.functionName)
                    return false; // if no function selected

                const functionData = builtInFunctions.getOwnProperty(expression.functionName) || customFunctionsByName.getOwnProperty(expression.functionName);
                let allParamsOk = true;
                for (let i = 0; i < functionData.parameters.length; ++i)
                {
                    const requiredParameter = functionData.parameters[i];
                    const currentParameter = expression.parameters[i];
                    if (CheckExpression(currentParameter))
                    {
                        const currentParameterType = GetExpressionType(currentParameter);
                        if (currentParameterType !== requiredParameter.type)
                        {
                            errors.push({
                                message: "Function parameter type is wrong, it should be " + AnOrA(requiredParameter.type) + " " + requiredParameter.type
                                    + " (currently: " + currentParameterType + ")",
                                data: []
                            });
                            allParamsOk = false;
                        }
                    }
                }

                return allParamsOk;
            }
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
            case "functionCall":
            {
                const functionData = builtInFunctions.getOwnProperty(expression.functionName) || customFunctionsByName.getOwnProperty(expression.functionName);
                if (functionData)
                    return functionData.returnType;

                break;
            }
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
                    const variableNameCheckResult = compiler.CheckVariableName(statement.variableName);
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
                    const variableNameCheckResult = compiler.CheckVariableName(statement.variableName);
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
                                    message: "The condition of an If statement must be boolean expressions (currently: " + conditionExpressionType + ")",
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
                    CheckExpression(statement);
                    break;
                }
            }
        }

        stack.pop();
    }

    CheckInternal(mainBlock);
};

compiler.GenerateProgramJSON = function(errors)
{
    const program = {};
    
    function CompileFunction(functionData)
    {
        const functionName = functionData.name;
        const functionBodyContainer = elementHandler.functionBodyDragContainers.getOwnProperty(functionData.guid);
        const functionBody = functionBodyContainer && functionBodyContainer.children[0];
        if (functionBody)
        {
            program[functionName] = functionBody.uiElementData.compile(errors);
        }
        else
        {
            // empty function
            program[functionName] = {
                name: functionData.name,
                parameters: functionData.parameters.map(param => ({
                    name: param.name,
                    type: param.type,
                    description: param.description
                })),
                returnType: functionData.returnType,
                description: functionData.description || "",
                block: {
                    statementType: "block",
                    statements: []
                }
            };
        }
    }
    
    CompileFunction(MainFunction);
    
    for (let guid in customFunctions)
        CompileFunction(customFunctions[guid]);
        
    return program;
};

compiler.LoadProgram = function(jsonString)
{
    let jsonObj;
    try
    {
        jsonObj = JSON.parse(jsonString);
    }
    catch (e)
    {
        return;
    }

    helper.ClearGuids("customFunction");

    for (let guid in customFunctions)
        delete customFunctions[guid];

    for (let functionName in customFunctionsByName)
        delete customFunctionsByName[functionName];

    for (let elem in allUIElementsByType)
        delete allUIElementsByType[elem];

    elementHandler.functionBodyDragContainers = {};
    elementHandler.functionBodies = {};
    elementHandler.functionCallElements = {};

    const mainDragArea = document.getElementById("main-drag-area");
    while (mainDragArea.lastChild)
        mainDragArea.removeChild(mainDragArea.lastChild);

    for (let functionName in jsonObj)
    {
        const functionData = jsonObj[functionName];
        if (functionName !== "Main")
        {
            const guid = helper.GetGuid("customFunction");
            const functionObj = {
                name: functionData.name,
                guid: guid,
                parameters: functionData.parameters.map(param => ({
                    name: param.name,
                    type: param.type,
                    description: param.description
                })),
                returnType: functionData.returnType
            };

            customFunctions[guid] = functionObj;
            customFunctionsByName[functionObj.name] = functionObj;
        }

        const functionBody = elementHandler.CreateNewFunctionBody(functionName);
        const block = functionData.block;
        for (let statement of block.statements)
        {
            const newElement = compiler.CreateNewElement(statement.statementType, functionBody.parentNode);
            newElement.load(statement);
            draggable.ForceDrop(newElement.element, functionBody.mainBlock);
        }
    }

    elementHandler.SwitchToMainFunction(false);
};

compiler.CreateNewElement = function(type, parentNode)
{
    return new compiler.elementTypesToClasses[type](parentNode);
};

compiler.elementTypesToClasses = {
    binaryBooleanExpression: BinaryBooleanExpression,
    binaryNumericExpression: BinaryNumericExpression,
    binaryStringExpression: BinaryStringExpression,
    numberComparison: NumberComparison,
    stringComparison: StringComparison,
    numberLiteralExpression: NumberLiteralExpression,
    booleanLiteralExpression: BooleanLiteralExpression,
    stringLiteralExpression: StringLiteralExpression,
    variableExpression: VariableExpression,
    ifStatement: IfStatement,
    whileStatement: WhileStatement,
    variableDeclaration: VariableDeclaration,
    variableAssignment: VariableAssignment,
    functionCall: FunctionCall,
};

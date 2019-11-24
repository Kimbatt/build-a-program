
const compiler = {};

/**
 * @param {string} variableName 
 */
compiler.CheckVariableName = function(variableName)
{
    if (variableName === "")
        return "{{Variable name}} must not be empty";

    if (/^[0-9]/.test(variableName))
        return "{{Variable name}} must not start with a number";

    if (variableName.includes(" "))
        return "{{Variable name}} must not contain spaces";

    if (/[!"#%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/.test(variableName))
        return "{{Variable name}} cannot contain any of the following characters: ! \" # % & ' ( ) * + , . / : ; < = > ? @ [ \\ ] ^ ` { | } ~";

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

    const errorsByFunctions = {};
    const compiled = compiler.GenerateProgramJSON(errorsByFunctions);

    for (let func in compiled)
    {
        const errors = errorsByFunctions.getOwnProperty(func) || [];
        compiler.CheckVariables(compiled[func], errors);

        if (errors.length !== 0)
            errorsByFunctions[func] = errors;
    }

    let anyErrors = false;
    for (let functionName in errorsByFunctions)
    {
        anyErrors = true;
        const errors = errorsByFunctions[functionName];
        for (let error of errors)
        {
            const consoleLineDiv = Console.GetConsoleLineDiv("", "console-line console-line-error");
            consoleLineDiv.appendChild(document.createTextNode("Compile error in function \"" + functionName + "\": "));

            const segments = error.message.split(/\{\{(.+?)\}\}/g); // we need to create a link for every 2n+1 -th element
            for (let i = 0; i < segments.length; ++i)
            {
                if ((i & 1) == 0)
                {
                    // normal text
                    consoleLineDiv.appendChild(document.createTextNode(segments[i]));
                }
                else
                {
                    // link
                    const dataElement = error.data[i >>> 1];
                    const span = document.createElement("span");
                    span.className = "console-error-link";
                    span.innerText = segments[i];

                    let parentNode; // calculate later if needed

                    const functionGuid = functionName === "Main" ? MainFunction.guid : customFunctionsByName[functionName].guid;
                    span.onclick = () =>
                    {
                        if (functionGuid !== elementHandler.activeFunctionGuid)
                            elementHandler.SwitchToFunction(functionGuid, false);

                        if (!parentNode)
                        {
                            parentNode = dataElement;
                            while (parentNode && !parentNode.uiElementData)
                                parentNode = parentNode.parentNode;

                            parentNode = parentNode.uiElementData.parentNode.parentNode;

                            if (!parentNode)
                                return;
                        }

                        const rect = dataElement.getBoundingClientRect();
                        const parentRect = parentNode.getBoundingClientRect();
                        const elementLeft = rect.left + parentNode.scrollLeft - parentRect.left;
                        const elementTop = rect.top + parentNode.scrollTop - parentRect.top;
                        const elementRight = elementLeft + rect.width;
                        const elementBottom = elementTop + rect.height;
                        const parentNodeWidth = parentRect.width;
                        const parentNodeHeight = parentRect.height;

                        const margin = 40;

                        const overflowLeft = margin + parentNode.scrollLeft - elementLeft;
                        const overflowRight = elementRight + margin - (parentNodeWidth + parentNode.scrollLeft);
                        if (overflowLeft > 0 || overflowRight > 0)
                        {
                            if (overflowLeft > 0 || rect.width + margin * 2 > parentNodeWidth)
                                parentNode.scrollLeft = elementLeft - margin;
                            else
                                parentNode.scrollLeft = elementRight + margin - parentNodeWidth;
                        }

                        const overflowTop = margin + parentNode.scrollTop - elementTop;
                        const overflowBottom = elementBottom + margin - (parentNodeHeight + parentNode.scrollTop);
                        if (overflowTop > 0 || overflowBottom > 0)
                        {
                            if (overflowTop > 0 || rect.height + margin * 2 > parentNodeHeight)
                                parentNode.scrollTop = elementTop - margin;
                            else
                                parentNode.scrollTop = elementBottom + margin - parentNodeHeight;
                        }

                        helper.Flash(dataElement);
                    }

                    consoleLineDiv.appendChild(span);
                }
            }

            Console.consoleLinesDiv.appendChild(consoleLineDiv);
            Console.CheckConsoleMaxSize();
        }
    }
    
    if (anyErrors)
        return;

    compiler.RemoveSrcElementsFromJSON(compiled);
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

    function CheckSingleExpression(expressionText, expression, requiredType, ordinal, parentElement)
    {
        if (CheckExpression(expression))
        {
            const expressionType = GetExpressionType(expression);
            if (expressionType !== requiredType)
            {
                if (expressionType !== "unknown")
                {
                    errors.push({
                        message: "The {{" + ordinal + "expression}} of " + expressionText + " must be " + AnOrA(requiredType) + " " + requiredType + " (currently: " + expressionType + ")",
                        data: [expression.srcElement.element, parentElement.element]
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
        return CheckSingleExpression(expressionText, expression.value, requiredType, "", expression.srcElement);
    }

    function CheckBinaryExpression(expressionText, expression, requiredType)
    {
        const firstResult = CheckSingleExpression(expressionText, expression.first, requiredType, "first ", expression.srcElement);
        const secondResult = CheckSingleExpression(expressionText, expression.second, requiredType, "second ", expression.srcElement);
        return firstResult && secondResult;
    }

    function CheckExpression(expression)
    {
        if (!expression)
            return false;

        switch (expression.expressionType)
        {
            case "numberLiteralExpression":
            case "booleanLiteralExpression":
            case "stringLiteralExpression":
                return true;
            case "variableExpression":
            {
                const checkResult = compiler.CheckVariableName(expression.variableName);
                if (checkResult !== "OK")
                {
                    errors.push({
                        message: checkResult,
                        data: [expression.srcElement.variableNameInputField]
                    });
                    return false;
                }

                if (GetVariableType(expression.variableName) === "unknown")
                {
                    errors.push({
                        message: "{{Variable \"" + expression.variableName + "\"}} must be declared before using it",
                        data: [expression.srcElement.variableNameInputField]
                    });
                    return false;
                }

                return true;
            }
            case "unaryBooleanExpression":
                return CheckUnaryExpression("a {{unary boolean expression}}", expression, "boolean");
            case "binaryBooleanExpression":
                return CheckBinaryExpression("a {{binary boolean expression}}", expression, "boolean");
            case "unaryNumericExpression":
                return CheckUnaryExpression("a {{unary numeric expression}}", expression, "number");
            case "binaryNumericExpression":
                return CheckBinaryExpression("a {{binary numeric expression}}", expression, "number");
            case "numberComparison":
                return CheckBinaryExpression("a {{number comparison}}", expression, "number");
            case "stringComparison":
                return CheckBinaryExpression("a {{string comparison}}", expression, "string");
            case "binaryStringExpression":
                return CheckBinaryExpression("a {{binary string expression}}", expression, "string");
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
                                message: "{{Function parameter}} type is wrong, it should be " + AnOrA(requiredParameter.type) + " " + requiredParameter.type
                                    + " (currently: " + currentParameterType + ")",
                                data: [currentParameter.srcElement.element]
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
            case "numberLiteralExpression":
            case "booleanLiteralExpression":
            case "stringLiteralExpression":
                return expression.type;
            case "variableExpression":
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
                            data: [statement.srcElement.variableNameInputField]
                        });
                        ok = false;
                    }

                    if (ok && GetVariableType(statement.variableName) !== "unknown")
                    {
                        errors.push({
                            message: "{{Variable \"" + statement.variableName + "\"}} was already declared before",
                            data: [statement.srcElement.variableNameInputField]
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
                            data: [statement.srcElement.variableNameInputField]
                        });
                        variableNameIsOk = false;
                    }

                    const requiredVariableType = GetVariableType(statement.variableName);
                    if (variableNameIsOk && requiredVariableType === "unknown")
                    {
                        errors.push({
                            message: "{{Variable \"" + statement.variableName + "\"}} must be declared before using it",
                            data: [statement.srcElement.variableNameInputField]
                        });
                        variableNameIsOk = false;
                    }

                    let expressionIsOk = true;
                    if (!statement.newVariableValue)
                    {
                        errors.push({
                            message: "{{Missing expression}} from {{variable assignment}}",
                            data: [statement.srcElement.expressionDropArea, statement.srcElement.element]
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
                                message: "{{Variable \"" + statement.variableName + "\"}} is " + AnOrA(requiredVariableType) + " " + requiredVariableType
                                    + ", cannot assign {{" + AnOrA(currentExpressionType) + " " + currentExpressionType + "}} to it",
                                data: [statement.srcElement.variableNameInputField, statement.srcElement.expressionDropArea]
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
                                message: "{{The condition}} of a {{While statement}} must be a boolean expression (currently: " + conditionExpressionType + ")",
                                data: [statement.srcElement.headerDropAreas[0].dropArea, statement.srcElement.element]
                            });
                        }
                    }

                    CheckInternal(statement.block);
                    break;
                }
                case "ifStatement":
                {
                    for (let i = 0; i < statement.conditions.length; ++i)
                    {
                        const condition = statement.conditions[i];
                        if (CheckExpression(condition))
                        {
                            const conditionExpressionType = GetExpressionType(condition);
                            if (conditionExpressionType !== "boolean")
                            {
                                const headerDropArea = (i === 0)
                                    ? statement.srcElement.mainBlock.headerDropAreas[0].dropArea
                                    : statement.srcElement.secondaryBlocksContainer.children[i - 1].uiElementData.headerDropAreas[0].dropArea;

                                errors.push({
                                    message: "{{The condition}} of an {{If statement}} must be boolean expressions (currently: " + conditionExpressionType + ")",
                                    data: [headerDropArea, statement.srcElement.element]
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
                case "returnStatement":
                {
                    if (statement.hasOwnProperty("returnValue"))
                    {
                        if (CheckExpression(statement.returnValue))
                        {
                            const expressionType = GetExpressionType(statement.returnValue);
                            if (compiledFunction.returnType !== expressionType)
                            {
                                errors.push({
                                    message: "{{Value returned}} must be " + AnOrA(compiledFunction.returnType) + " "
                                        + compiledFunction.returnType + " (currently: " + expressionType + ")",
                                    data: [statement.srcElement.dropArea]
                                });
                            }
                        }
                    }

                    break;
                }
            }
        }

        stack.pop();
    }

    CheckInternal(mainBlock);
};

compiler.GenerateProgramJSON = function(errorsByFunctions)
{
    const program = {};
    
    function CompileFunction(functionData)
    {
        const errors = [];
        const functionName = functionData.name;
        const functionBodyContainer = elementHandler.functionBodyDragContainers.getOwnProperty(functionData.guid);
        const functionBody = functionBodyContainer && functionBodyContainer.children[0];

        if (functionBody)
            program[functionName] = functionBody.uiElementData.compile(errors);
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

        if (errors.length !== 0)
            errorsByFunctions[functionName] = errors;
    }

    CompileFunction(MainFunction);

    for (let guid in customFunctions)
        CompileFunction(customFunctions[guid]);

    return program;
};

compiler.RemoveSrcElementsFromJSON = function(jsonObj)
{
    // remove srcElement references from compiled program
    const stack = [];
    for (let functionName in jsonObj)
        stack.push(jsonObj[functionName]);

    while (stack.length !== 0)
    {
        const current = stack.pop();
        
        const keys = Object.keys(current);
        for (let key of keys)
        {
            if (key === "srcElement")
            {
                delete current[key];
                continue;
            }

            const obj = current[key];
            if (typeof obj === "object" && obj !== null)
                stack.push(obj);
        }
    }

    return jsonObj
};

compiler.LoadProgram = function(jsonString)
{
    const jsonObj = JSON.parse(jsonString);

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

    // load funciton definitions first
    for (let functionName in jsonObj)
    {
        const functionData = jsonObj[functionName];
        if (functionName !== "Main")
        {
            const guid = helper.GetGuid("customFunction");
            const functionObj = {
                name: functionData.name,
                guid: guid,
                description: functionData.description,
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
    }

    for (let functionName in jsonObj)
    {
        const functionBody = elementHandler.CreateNewFunctionBody(functionName);

        // temporarily set currently active function so parent functions are correctly set for the UI elements
        elementHandler.activeFunctionGuid = functionName === "Main" ? MainFunction.guid : customFunctionsByName[functionName].guid;

        const functionData = jsonObj[functionName];
        const block = functionData.block;
        for (let statement of block.statements)
            compiler.LoadElement(functionBody.parentNode, statement, functionBody.mainBlock);
    }

    elementHandler.SwitchToMainFunction(false);
};

compiler.CreateNewElement = function(type, parentNode)
{
    return new compiler.elementTypesToClasses[type](parentNode);
};

compiler.LoadElement = function(parentNode, data, targetDropArea)
{
    const newElement = compiler.CreateNewElement(data.statementType || data.expressionType, parentNode);
    newElement.load(data);
    draggable.ForceDrop(newElement.element, targetDropArea);
};

compiler.elementTypesToClasses = {
    binaryBooleanExpression: BinaryBooleanExpression,
    binaryNumericExpression: BinaryNumericExpression,
    binaryStringExpression: BinaryStringExpression,
    unaryBooleanExpression: UnaryBooleanExpression,
    unaryNumericExpression: UnaryNumericExpression,
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
    returnStatement: ReturnStatement
};

compiler.lastProgram = undefined;
compiler.DebugReloadProgram = function()
{
    const program = compiler.lastProgram || JSON.stringify(compiler.RemoveSrcElementsFromJSON(compiler.GenerateProgramJSON([])));
    let error;
    try
    {
        this.LoadProgram(program);
    }
    catch (e)
    {
        error = e;
    }

    if (error)
    {
        compiler.lastProgram = program;
        throw error;
    }

    compiler.lastProgram = undefined;
};

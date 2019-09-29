
function GetVariable(variableName, parentBlock)
{
    let currentBlock = parentBlock;
    while (currentBlock)
    {
        variable = currentBlock.variables[variableName];
        if (variable)
            return variable;

        currentBlock = currentBlock.parentBlock;
    }

    // should not happen, variables should be checked before running
    console.error("cannot find variable, should not happen: " + variableName);
    return null;
}

function RunProgram(mainFunction)
{
    HandleBlockStatement(mainFunction.block, null);
}

function CreateTestProgram()
{
    const mainFunction = {
        parameters: [],
        block: {
            statementType: "block",
            statements: [
                {
                    statementType: "variableDeclaration", // only literals at declaration
                    variableName: "asd",
                    variableValue: {
                        expressionType: "literal",
                        type: "number",
                        value: 123
                    }
                }, {
                    statementType: "ifStatement",
                    conditions: [
                        {
                            expressionType: "numberComparison",
                            first: {
                                expressionType: "variable",
                                variableName: "asd"
                            },
                            second: {
                                expressionType: "literal",
                                value: 100
                            },
                            operator: "<"
                        }
                    ],
                    blocks: [
                        {
                            statementType: "block",
                            statements: [
                            {
                                statementType: "variableAssignment",
                                variableName: "asd",
                                newVariableValue: {
                                    expressionType: "binaryNumericExpression",
                                    first: {
                                        expressionType: "variable",
                                        variableName: "asd"
                                    },
                                    second: {
                                        expressionType: "literal",
                                        value: 99
                                    },
                                    operator: "*"
                                }
                            }]
                        }
                    ],
                    elseBlock: {
                        statementType: "block",
                        statements: [
                            {
                                statementType: "whileStatement",
                                condition: {
                                    expressionType: "numberComparison",
                                    first: {
                                        expressionType: "variable",
                                        variableName: "asd"
                                    },
                                    second: {
                                        expressionType: "literal",
                                        value: 100
                                    },
                                    operator: ">"
                                },
                                block: {
                                    statementType: "block",
                                    statements: [
                                    {
                                        statementType: "variableAssignment",
                                        variableName: "asd",
                                        newVariableValue: {
                                            expressionType: "binaryNumericExpression",
                                            first: {
                                                expressionType: "variable",
                                                variableName: "asd"
                                            },
                                            second: {
                                                expressionType: "literal",
                                                value: 1.25
                                            },
                                            operator: "-"
                                        }
                                    }, {
                                        statementType: "functionCall",
                                        functionName: "write",
                                        parameters: [
                                            {
                                                expressionType: "variable",
                                                variableName: "asd"
                                            }
                                        ]
                                    }]
                                }
                            }
                        ]
                    }
                }, {
                    statementType: "functionCall",
                    functionName: "write",
                    parameters: [
                        {
                            expressionType: "variable",
                            variableName: "asd"
                        }
                    ]
                }
            ]
        }
    };

    RunProgram(mainFunction);
}

//CreateTestProgram();
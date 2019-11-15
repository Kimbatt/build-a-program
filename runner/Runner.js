
function GetVariable(variableName, parentBlock)
{
    let currentBlock = parentBlock;
    while (currentBlock)
    {
        variable = currentBlock.variables.getOwnProperty(variableName);
        if (variable)
            return variable;

        currentBlock = currentBlock.parentBlock;
    }

    // should not happen, variables should be checked before running
    console.error("cannot find variable, should not happen: " + variableName);
    return null;
}

async function RunFunction(func, parameterValues)
{
    const functionBlock = {
        parentBlock: null,
        variables: {}
    };

    for (let i = 0; i < parameterValues.length; ++i)
    {
        const parameterDefinition = func.parameters[i];
        const parameterValue = parameterValues[i];
        const parameterName = parameterDefinition.name;
        
        functionBlock.variables[parameterName] = {
            variableValue: {
                type: parameterValue.type,
                value: parameterValue.value
            },
            variableName: parameterName
        };
    }

    await HandleBlockStatement(func.block, functionBlock);
}

let currentlyRunningProgram;
async function RunProgram(program)
{
    currentlyRunningProgram = program;
    ProgramStartedRunning();

    await RunFunction(program["Main"], []);

    currentlyRunningProgram = undefined;
    ProgramFinishedRunning();
}

function CreateTestProgram()
{
    const fizzBuzzTest = {
        "parameters": [],
        "block": {
            "statementType": "block",
            "statements": [
                {
                    "statementType": "variableDeclaration",
                    "variableName": "asd",
                    "variableType": "number"
                },
                {
                    "statementType": "variableAssignment",
                    "variableName": "asd",
                    "newVariableValue": {
                        "expressionType": "literal",
                        "value": 1,
                        "type": "number"
                    }
                },
                {
                    "statementType": "whileStatement",
                    "condition": {
                        "expressionType": "numberComparison",
                        "first": {
                            "expressionType": "variable",
                            "variableName": "asd"
                        },
                        "second": {
                            "expressionType": "literal",
                            "value": 100,
                            "type": "number"
                        },
                        "operator": "<="
                    },
                    "block": {
                        "statementType": "block",
                        "statements": [
                            {
                                "statementType": "variableDeclaration",
                                "variableName": "isFizz",
                                "variableType": "boolean"
                            },
                            {
                                "statementType": "variableAssignment",
                                "variableName": "isFizz",
                                "newVariableValue": {
                                    "expressionType": "numberComparison",
                                    "first": {
                                        "expressionType": "binaryNumericExpression",
                                        "first": {
                                            "expressionType": "variable",
                                            "variableName": "asd"
                                        },
                                        "second": {
                                            "expressionType": "literal",
                                            "value": 3,
                                            "type": "number"
                                        },
                                        "operator": "%"
                                    },
                                    "second": {
                                        "expressionType": "literal",
                                        "value": 0,
                                        "type": "number"
                                    },
                                    "operator": "=="
                                }
                            },
                            {
                                "statementType": "variableDeclaration",
                                "variableName": "isBuzz",
                                "variableType": "number"
                            },
                            {
                                "statementType": "variableAssignment",
                                "variableName": "isBuzz",
                                "newVariableValue": {
                                    "expressionType": "numberComparison",
                                    "first": {
                                        "expressionType": "binaryNumericExpression",
                                        "first": {
                                            "expressionType": "variable",
                                            "variableName": "asd"
                                        },
                                        "second": {
                                            "expressionType": "literal",
                                            "value": 5,
                                            "type": "number"
                                        },
                                        "operator": "%"
                                    },
                                    "second": {
                                        "expressionType": "literal",
                                        "value": 0,
                                        "type": "number"
                                    },
                                    "operator": "=="
                                }
                            },
                            {
                                "statementType": "ifStatement",
                                "conditions": [
                                    {
                                        "expressionType": "binaryBooleanExpression",
                                        "first": {
                                            "expressionType": "variable",
                                            "variableName": "isFizz"
                                        },
                                        "second": {
                                            "expressionType": "variable",
                                            "variableName": "isBuzz"
                                        },
                                        "operator": "&&"
                                    },
                                    {
                                        "expressionType": "variable",
                                        "variableName": "isFizz"
                                    },
                                    {
                                        "expressionType": "variable",
                                        "variableName": "isBuzz"
                                    }
                                ],
                                "blocks": [
                                    {
                                        "statementType": "block",
                                        "statements": [
                                            {
                                                "statementType": "functionCall",
                                                "functionName": "write",
                                                "parameters": [
                                                    {
                                                        "expressionType": "literal",
                                                        "value": "FizzBuzz",
                                                        "type": "string"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "statementType": "block",
                                        "statements": [
                                            {
                                                "statementType": "functionCall",
                                                "functionName": "write",
                                                "parameters": [
                                                    {
                                                        "expressionType": "literal",
                                                        "value": "Fizz",
                                                        "type": "string"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "statementType": "block",
                                        "statements": [
                                            {
                                                "statementType": "functionCall",
                                                "functionName": "write",
                                                "parameters": [
                                                    {
                                                        "expressionType": "literal",
                                                        "value": "Buzz",
                                                        "type": "string"
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ],
                                "elseBlock": {
                                    "statementType": "block",
                                    "statements": [
                                        {
                                            "statementType": "functionCall",
                                            "functionName": "write",
                                            "parameters": [
                                                {
                                                    "expressionType": "variable",
                                                    "variableName": "asd"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            },
                            {
                                "statementType": "variableAssignment",
                                "variableName": "asd",
                                "newVariableValue": {
                                    "expressionType": "binaryNumericExpression",
                                    "first": {
                                        "expressionType": "variable",
                                        "variableName": "asd"
                                    },
                                    "second": {
                                        "expressionType": "literal",
                                        "value": 1,
                                        "type": "number"
                                    },
                                    "operator": "+"
                                }
                            }
                        ]
                    }
                }
            ]
        }
    };

    const mainFunction = {
        parameters: [],
        block: {
            statementType: "block",
            statements: [
                {
                    statementType: "variableDeclaration", // only literals at declaration
                    variableName: "asd",
                    variableType: "number"
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
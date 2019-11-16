
const builtInFunctions = {
    // IO
    Write: {
        name: "Write",
        description: "Writes a string to the console.",
        returnType: "void",
        parameters: [
            {
                name: "text",
                type: "string",
                description: "Text to write to the console"
            }
        ],
        func: params => Console.Write(params[0].value)
    },
    Read: {
        name: "Read",
        description: "Reads a string from the console, and returns it.",
        returnType: "string",
        parameters: [],
        func: () => {
            return {
                type: "string",
                value: prompt() // todo: use the console for input
            };
        }
    },

    // conversions
    NumberToString: {
        name: "NumberToString",
        description: "Converts a number to a string.",
        returnType: "string",
        parameters: [
            {
                name: "num",
                type: "number",
                description: "Number to convert"
            }
        ],
        func: params =>
        {
            return {
                type: "string",
                value: String(params[0].value)
            };
        }
    },
    StringToNumber: {
        name: "StringToNumber",
        description: "Converts a string to a number. Returns NaN if it cannot be converted.",
        returnType: "number",
        parameters: [
            {
                name: "str",
                type: "string",
                description: "String to convert"
            }
        ],
        func: params =>
        {
            return {
                type: "number",
                value: Number(params[0].value)
            };
        }
    },
    IsNaN: {
        name: "IsNaN",
        description: "Decides if the given number is NaN (not a number).",
        returnType: "boolean",
        parameters: [
            {
                name: "num",
                type: "number",
                description: "Number to check"
            }
        ],
        func: params =>
        {
            return {
                type: "boolean",
                value: isNaN(params[0].value)
            };
        }
    },
    BooleanToString: {
        name: "BooleanToString",
        description: "Converts a boolean to its string representation (True/False).",
        returnType: "string",
        parameters: [
            {
                name: "value",
                type: "boolean",
                description: "Value to convert"
            }
        ],
        func: params =>
        {
            return {
                type: "String",
                value: params[0].value ? "True" : "False"
            };
        }
    },

    // string functions
    CharAt: {
        name: "CharAt",
        description: "Returns the character at the given index from the given string.",
        returnType: "string",
        parameters: [
            {
                name: "str",
                type: "string",
                description: "Source string"
            },
            {
                name: "index",
                type: "number",
                description: "Character index"
            },
        ],
        func: params =>
        {
            return {
                type: "string",
                value: params[0].value.charAt(params[1].value)
            };
        }
    },
    CharFromCode: {
        name: "CharFromCode",
        description: "Returns the character corresponding to the given character code.",
        returnType: "string",
        parameters: [
            {
                name: "charCode",
                type: "number",
                description: "Character code"
            },
        ],
        func: params =>
        {
            return {
                type: "string",
                value: String.fromCharCode(params[0].value)
            };
        }
    },
    Substring: {
        name: "Substring",
        description: "Returns the part of the given string between startIndex and endIndex.",
        returnType: "string",
        parameters: [
            {
                name: "str",
                type: "string",
                description: "Source string"
            },
            {
                name: "startIndex",
                type: "number",
                description: "Start index"
            },
            {
                name: "endIndex",
                type: "number",
                description: "End index"
            },
        ],
        func: params =>
        {
            return {
                type: "string",
                value: params[0].value.substring(params[1].value, params[2].value)
            };
        }
    },

    // math functions
    SQRT: {
        name: "SQRT",
        description: "Returns the square root of the given number.",
        returnType: "number",
        parameters: [
            {
                name: "num",
                type: "number",
                description: "Source number"
            }
        ],
        func: params =>
        {
            return {
                type: "number",
                value: Math.sqrt(params[0].value)
            };
        }
    },
    Round: {
        name: "Round",
        description: "Rounds the given number to the nearest integer.",
        returnType: "number",
        parameters: [
            {
                name: "num",
                type: "number",
                description: "Source number"
            }
        ],
        func: params =>
        {
            return {
                type: "number",
                value: Math.round(params[0].value)
            };
        }
    },
    Floor: {
        name: "Floor",
        description: "Rounds the given number down to the nearest integer.",
        returnType: "number",
        parameters: [
            {
                name: "num",
                type: "number",
                description: "Source number"
            }
        ],
        func: params =>
        {
            return {
                type: "number",
                value: Math.floor(params[0].value)
            };
        }
    },
    Ceil: {
        name: "Ceil",
        description: "Rounds the given number up to the nearest integer.",
        returnType: "number",
        parameters: [
            {
                name: "num",
                type: "number",
                description: "Source number"
            }
        ],
        func: params =>
        {
            return {
                type: "number",
                value: Math.ceil(params[0].value)
            };
        }
    },
    Random: {
        name: "Random",
        description: "Returns a random number between min and max (min: inclusive, max: exclusive).",
        returnType: "number",
        parameters: [
            {
                name: "min",
                type: "number",
                description: "Minimum value"
            },
            {
                name: "max",
                type: "number",
                description: "Maximum value"
            }
        ],
        func: params =>
        {
            const min = params[0].value;
            const max = params[1].value;
            return {
                type: "number",
                value: min + Math.random() * (max - min)
            };
        }
    }
};


const builtInFunctions = {
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
        func: text => ConsoleWrite(text.value)
    },
    Read: {
        name: "Read",
        description: "Reads a string from the console, and returns it.",
        returnType: "string",
        parameters: [],
        func: () => {
            return {
                "type": "string",
                "value": prompt()
            };
        }
    }
};


class FunctionBody extends BlockBase
{
    constructor(parentNode, functionName)
    {
        super(parentNode, "", [], true);
        this.functionName = functionName;
        this.updateHeaderText();
    }

    updateHeaderText()
    {
        this.headerTextDiv.innerText = this.getHeaderText();
    }

    getHeaderText()
    {
        let headerText = "Function " + this.functionName;
        if (this.functionName !== "Main")
        {
            const functionData = customFunctions.getOwnProperty(this.functionName);
            if (!functionData)
                throw new Error("Function " + this.functionName + " does not exist");

            const params = functionData.parameters;
            if (params.length !== 0)
                headerText += " (" + params.map(param => param.name + ": " + param.type).join(", ") + ")";
        }

        return headerText;
    }

    isExpression() { return false; }
    isStatement() { return false; }

    compile(errors)
    {
        const functionData = customFunctions.getOwnProperty(this.functionName) || {
            // if not a custom function then it is the main function
            name: "Main",
            description: "Main function",
            returnType: "void",
            parameters: []
        };

        return {
            name: functionData.name,
            parameters: functionData.parameters.map(param => ({
                name: param.name,
                type: param.type
            })),
            returnType: functionData.returnType,
            description: functionData.description || "",
            block: super.compile(errors)
        };
    }
}

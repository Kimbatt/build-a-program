
class FunctionBody extends BlockBase
{
    constructor(parentNode, functionName)
    {
        super(parentNode, "", [], true);

        if (functionName === "Main")
        {
            this.functionData = {
                name: "Main",
                guid: helper.GetGuid("customFunction"),
                description: "Main function",
                returnType: "void",
                parameters: []
            };

            window.MainFunction = this.functionData;
        }
        else
        {
            this.functionData = customFunctionsByName.getOwnProperty(functionName);
    
            if (!this.functionData)
                throw new Error("Function " + functionName + " does not exist");
        }

        this.updateHeaderText();
    }

    updateHeaderText()
    {
        this.headerTextDiv.innerText = this.getHeaderText();
    }

    getHeaderText()
    {
        let headerText = "Function " + this.functionData.name;

        const params = this.functionData.parameters;
        if (params.length !== 0)
            headerText += " (" + params.map(param => param.name + ": " + param.type).join(", ") + ")";

        if (this.functionData.returnType !== "void")
            headerText += " → " + this.functionData.returnType;

        return headerText;
    }

    isExpression() { return false; }
    isStatement() { return false; }

    compile(errors)
    {
        return {
            name: this.functionData.name,
            parameters: this.functionData.parameters.map(param => ({
                name: param.name,
                type: param.type,
                description: param.description
            })),
            returnType: this.functionData.returnType,
            description: this.functionData.description || "",
            block: super.compile(errors),
            srcElement: this
        };
    }
}

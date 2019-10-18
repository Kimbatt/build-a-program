
function CompileAndRun()
{
    const compiled = GenerateProgramJSON();
    const checkResult = CheckProgram();
    if (typeof checkResult === "string")
    {
        alert(checkResult);
        return;
    }

    RunProgram({
        mainFunction: compiled
    });
}

function CheckProgram(programJSON)
{

}

function GenerateProgramJSON()
{
    const mainDragArea = document.getElementById("main-drag-area");

    const nodes = mainDragArea.childNodes;
    for (let elem of nodes)
    {
        if (elem.uiElementData instanceof FunctionBody && elem.uiElementData.functionName === "Main")
        {
            return elem.uiElementData.compile();
        }
    }
}

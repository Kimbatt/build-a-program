
function CompileAndRun()
{
    const result = CheckProgram();
    if (typeof result === "string")
    {
        alert(result);
        return;
    }

    RunProgram(GenerateProgramJSON());
}

function CheckProgram()
{

}

const elementDataCollector = {
    "FunctionBody": () => {}
};

function GenerateProgramJSON()
{
    const mainDragArea = document.getElementById("main-drag-area");

    mainDragArea.childNodes.forEach(elem =>
    {
        if (elem.uiElementData)
        {
            elementDataCollector[elem.uiElementData.constructor.name](elem);
        }
    });
}

async function CompileAndRun()
{
    if (document.getElementById("clear-console-on-run-checkbox").checked)
        ConsoleClear();

    if (!consoleIsVisible)
    {
        ConsoleShow();
        await new Promise(resolve => setTimeout(resolve, 350));
    }

    let compiled;
    try
    {
        compiled = GenerateProgramJSON();
    }
    catch (errorData)
    {
        ConsoleError("Compile error: " + errorData.message);
        return;
    }

    RunProgram({
        mainFunction: compiled
    });
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

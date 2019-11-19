
const menu = {};

menu.ShowEditor = function()
{
    // load empty program
    compiler.LoadProgram(`{"Main":{"name":"Main","parameters":[],"returnType":"void","description":"Main function","block":{"statementType":"block","statements":[]}}}`);
    document.getElementById("page-menu").style.display = "none";
    document.getElementById("page-editor").style.display = "";
};

menu.QuitToMenu = async function()
{
    if (!await Confirm("Do you want to return to the main menu?\n\nAny elements that are not part of the program will not be saved.", "Yes", "Cancel"))
        return;

    document.getElementById("page-editor").style.display = "none";
    document.getElementById("page-menu").style.display = "flex";
};

menu.ShowLoadProgramOverlay = function(show)
{
    document.getElementById("program-loader-overlay").style.display = show ? "flex" : "none";
};

menu.LoadProgramFromFile = async function(file)
{
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";

    const fr = new FileReader();
    let resultText;
    try
    {
        resultText = await new Promise((resolve, reject) =>
        {
            fr.onload = ev => resolve(ev.target.result);
            fr.onerror = reject;
            fr.readAsText(file);
        });
    }
    catch (e)
    {
        Alert("Cannot open the selected file");
        return;
    }
    finally
    {
        loadingOverlay.style.display = "none";
    }

    try
    {
        compiler.LoadProgram(resultText);
    }
    catch (e)
    {
        Alert("Cannot load program:\n\nThe selected file is not a valid program");
    }
};

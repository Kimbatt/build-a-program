
const menu = {};
menu.programPrefix = "program__";
menu.currentProgramName = "";

menu.PromptProgramName = async function()
{
    while (true)
    {
        let programName = await Prompt("Enter a name for the program:", "OK", "Cancel");
        if (programName === null) // clicked on cancel
            return null;

        programName = programName.trim();
        if (programName === "")
        {
            await Alert("Program name cannot be empty");
            continue;
        }

        if (localStorage.getItem(menu.programPrefix + programName) !== null)
        {
            await Alert("A program with this name already exists.\nPlease choose a different name.");
            continue;
        }

        return programName;
    }
};

menu.CreateNewProgram = async function()
{
    const programName = await menu.PromptProgramName();
    if (!programName)
        return;

    // create empty program
    const emptyProgram = `{"Main":{"name":"Main","parameters":[],"returnType":"void","description":"Main function","block":{"statementType":"block","statements":[]}}}`;
    await menu.SaveProgram(programName, emptyProgram);
    menu.currentProgramName = programName;

    compiler.LoadProgram(emptyProgram);

    document.getElementById("page-menu").style.display = "none";
    document.getElementById("page-editor").style.display = "";
};

menu.QuitToMenu = async function()
{
    const dialogResult = await ShowPopupAlert("Do you want to save the program before you quit?\n\nAny elements that are not part of the program will not be saved.",
        "Save and quit", "Don't save", "Cancel", false);
        
    if (dialogResult === "cancel")
        return;

    if (dialogResult === "yes")
        await menu.SaveCurrentProgram();

    Console.Clear();
    Console.Hide();

    document.getElementById("page-editor").style.display = "none";
    document.getElementById("page-menu").style.display = "flex";
};

menu.SaveCurrentProgram = async function()
{
    if (await menu.SaveProgram(menu.currentProgramName, JSON.stringify(compiler.GenerateProgramJSON({}))))
        await Alert("Program saved successfully.");
}

menu.ShowLoadProgramOverlay = function(show)
{
    document.getElementById("program-loader-overlay").style.display = show ? "flex" : "none";
    if (!show)
        return;

    const lines = document.getElementById("program-loader-available-programs");
    while (lines.lastChild)
        lines.removeChild(lines.lastChild);

    for (let i = 0; i < localStorage.length; ++i)
    {
        const key = localStorage.key(i);
        if (!key.startsWith(menu.programPrefix))
            continue;

        const programName = key.substr(menu.programPrefix.length);
        lines.appendChild(menu.CreateLoadProgramLine(programName));
    }
};

menu.CreateLoadProgramLine = function(programName)
{
    const container = document.createElement("div");
    container.style.position = "relative";

    const line = document.createElement("div");
    line.className = "program-loader-line";
    line.onclick = async () =>
    {
        if (await menu.LoadProgramFromText(programName, localStorage.getItem(menu.programPrefix + programName)))
            menu.ShowLoadProgramOverlay(false);
    };

    const programInfoDiv = document.createElement("div");
    programInfoDiv.className = "program-info";

    const programNameDiv = document.createElement("div");
    programNameDiv.className = "program-name";
    programNameDiv.innerText = programName;

    programInfoDiv.appendChild(programNameDiv);

    const deleteButton = document.createElement("button");
    deleteButton.className = "buttonbutton program-loader-line-button";
    deleteButton.innerText = "Delete";
    deleteButton.style.width = "120px";
    deleteButton.style.margin = "auto 10px";
    deleteButton.onclick = async () =>
    {
        if (await Confirm("Do you really want to delete the program \"" + programName + "\"?"))
        {
            localStorage.removeItem(menu.programPrefix + programName);
            container.parentNode.removeChild(container);
        }
    };

    const exportButton = document.createElement("button");
    exportButton.className = "buttonbutton program-loader-line-button";
    exportButton.innerText = "Export";
    exportButton.style.width = "120px";
    exportButton.style.margin = "auto 140px";
    exportButton.onclick = async () =>
    {
        const programData = localStorage.getItem(menu.programPrefix + programName);
        if (!programData)
            return;

        const downloadBlob = new Blob([programData], { type: "application/octet-stream" });
        const url = URL.createObjectURL(downloadBlob);
        const link = document.getElementById("program-exporter-link");
        link.href = url;
        link.download = programName + ".program";
        link.click();
        URL.revokeObjectURL(url);
    };

    line.appendChild(programInfoDiv);

    container.appendChild(line);
    container.appendChild(deleteButton);
    container.appendChild(exportButton);

    return container;
};

menu.LoadProgramFromFile = async function(file)
{
    menu.ShowLoading();

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
        menu.HideLoading();
    }

    const index = file.name.lastIndexOf(".");
    let programName = menu.programPrefix + (index === -1 ? file.name : file.name.substring(0, index));
    if (localStorage.getItem(programName) !== null)
    {
        programName = await menu.PromptProgramName();
        if (!programName)
            return;
    }

    localStorage.setItem(programName, resultText);

    // refresh lines
    menu.ShowLoadProgramOverlay(true);
};

menu.LoadProgramFromText = async function(programName, text)
{
    menu.ShowLoading();

    try
    {
        const decompressed = await LZMA.decompress_async(text, true);
        compiler.LoadProgram(decompressed);
    }
    catch (e)
    {
        Alert("Cannot load program:\n\nThe selected program is not in the correct format");
        return false;
    }
    finally
    {
        menu.HideLoading();
    }

    menu.currentProgramName = programName;
    document.getElementById("page-menu").style.display = "none";
    document.getElementById("page-editor").style.display = "";
    return true;
};

menu.SaveProgram = async function(programName, programDataJSON)
{
    if (menu.currentProgramName === "")
        return false;

    menu.ShowLoading();
    try
    {
        const compressed = await LZMA.compress_async(programDataJSON, 9, true);
        localStorage.setItem(menu.programPrefix + programName, compressed);
    }
    catch (e)
    {
        await Alert("Error saving program");
        return false;
    }
    finally
    {
        menu.HideLoading();
    }

    return true;
};

menu.ShowLoading = function()
{
    document.getElementById("loading-overlay").style.display = "flex";
};

menu.HideLoading = function()
{
    document.getElementById("loading-overlay").style.display = "none";
};

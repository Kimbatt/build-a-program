
const menu = {};
menu.programPrefix = "program__";

menu.CreateNewProgram = async function()
{
    while (true)
    {
        const programName = await Prompt("Enter a name for the program:", "OK", "Cancel");
        if (programName === null) // clicked on cancel
            return;

        if (localStorage.getItem(menu.programPrefix + programName) !== null)
            await Alert("A program with this name already exists.\nPlease choose a different name.");
        else
            break;
    }

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
    line.onclick = () => menu.LoadProgramFromText(localStorage.getItem(menu.programPrefix + programName));

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

    const index = file.name.lastIndexOf(".");
    let programName = menu.programPrefix + (index === -1 ? file.name : file.name.substring(0, index));
    while (localStorage.getItem(programName) !== null)
    {
        let newName = await Prompt("A program with this name already exists.\nPlease choose a different name:", "OK", "Cancel");
        if (newName === null) // clicked on cancel
            return;

        newName = newName.trim();
        if (newName === "")
        {
            await Alert("Name must not be empty");
            continue;
        }

        programName = menu.programPrefix + newName;
    }

    localStorage.setItem(programName, resultText);

    // refresh lines
    menu.ShowLoadProgramOverlay(true);
};

menu.LoadProgramFromText = async function(text)
{
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.style.display = "flex";

    try
    {
        const decompressed = await LZMA.decompress_async(text, true);
        await compiler.LoadProgram(decompressed);
    }
    catch (e)
    {
        Alert("Cannot load program:\n\nThe selected program is not in the correct format");
        return;
    }
    finally
    {
        loadingOverlay.style.display = "none";
    }

    document.getElementById("page-menu").style.display = "none";
    document.getElementById("page-editor").style.display = "";
};

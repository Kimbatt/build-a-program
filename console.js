
const Console = {};
Console.consoleIsVisible = false;
Console.Show = function()
{
    Console.consoleIsVisible = true;

    const consoleHidden = document.getElementById("console-hidden");
    consoleHidden.classList.remove("console-hidden-visible");
    consoleHidden.classList.add("console-hidden-hidden");

    Console.consoleDiv.classList.remove("console-hidden");
    Console.consoleDiv.classList.add("console-visible");
};

Console.Hide = function()
{
    Console.consoleIsVisible = false;

    const consoleHidden = document.getElementById("console-hidden");
    consoleHidden.classList.remove("console-hidden-hidden");
    consoleHidden.classList.add("console-hidden-visible");

    Console.consoleDiv.classList.remove("console-visible");
    Console.consoleDiv.classList.add("console-hidden");
};

Console.consoleLinesPool = []; // reuse console lines for better performance
Console.GetConsoleLineDiv = function(text, className)
{
    let div;
    if (Console.consoleLinesPool.length === 0)
        div = document.createElement("div");
    else
        div = Console.consoleLinesPool.pop();

    div.innerText = text;
    div.className = className;
    return div;
};

Console.consoleLinesDiv = document.getElementById("console-lines-div");
Console.consoleDiv = document.getElementById("console");
Console.CheckConsoleMaxSize = function()
{
    while (Console.consoleLinesDiv.children.length >= 1000)
    {
        const line = Console.consoleLinesDiv.firstChild;
        Console.consoleLinesPool.push(line);
        Console.consoleLinesDiv.removeChild(line);
    }
};

Console.pendingConsoleLines = [];
Console.Write = function(arg)
{
    const line = Console.GetConsoleLineDiv(arg, "console-line");
    if (/[^\s|\s$|\s+]/m.test(arg)) // check for leading & trailing & multiple spaces
        line.innerHTML = arg.replace(/\s/g, "&nbsp;");
    else if (arg === "") // special case for empty string
        line.innerHTML = "&nbsp;";

    Console.pendingConsoleLines.push(line);
};

Console.FinalizeWrite = function()
{
    Console.consoleLinesDiv.style.display = "none";
    while (Console.pendingConsoleLines.length !== 0)
    {
        const line = Console.pendingConsoleLines.shift();
        Console.consoleLinesDiv.appendChild(line);
    }

    Console.CheckConsoleMaxSize();
    Console.consoleLinesDiv.style.display = "";
    Console.consoleLinesDiv.scrollTo(0, Console.consoleLinesDiv.scrollHeight);
};

Console.Error = function(arg)
{
    Console.pendingConsoleLines.push(Console.GetConsoleLineDiv(arg, "console-line console-line-error"));
};

Console.Notification = function(arg)
{
    Console.pendingConsoleLines.push(Console.GetConsoleLineDiv(arg, "console-line console-line-notification"));
};

Console.Clear = function()
{
    Console.pendingConsoleLines.length = 0;

    Console.consoleLinesDiv.style.display = "none";
    while (Console.consoleLinesDiv.lastChild)
    {
        const line = Console.consoleLinesDiv.lastChild;
        Console.consoleLinesPool.push(line);
        Console.consoleLinesDiv.removeChild(line);
    }
    Console.consoleLinesDiv.style.display = "";
};

Console.enterPressedCallback = undefined;
Console.MaybeEnterPressed = function(event)
{
    if (event.key === "Enter")
    {
        if (Console.enterPressedCallback)
        {
            Console.enterPressedCallback();
            Console.enterPressedCallback = undefined;
        }
    }
};

Console.Read = async function()
{
    if (!Console.consoleIsVisible)
    {
        Console.Show();
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    const inputContainerDiv = document.getElementById("console-input-div");
    const inputElement = inputContainerDiv.querySelector("#console-input");
    inputElement.value = "";
    inputContainerDiv.style.display = "";
    Console.FinalizeWrite();
    inputElement.focus();

    await new Promise(resolve => Console.enterPressedCallback = resolve);
    const inputText = inputElement.value;

    inputContainerDiv.style.display = "none";

    return inputText;
};

Console.CancelRead = function()
{
    const inputContainerDiv = document.getElementById("console-input-div");
    inputContainerDiv.style.display = "none";
    inputContainerDiv.querySelector("#console-input").blur();
    Console.enterPressedCallback = undefined;
};

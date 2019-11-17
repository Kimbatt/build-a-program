
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

Console.Write = function(arg)
{
    Console.consoleLinesDiv.appendChild(Console.GetConsoleLineDiv(arg, "console-line"));
    Console.CheckConsoleMaxSize();
};

Console.Error = function(arg)
{
    Console.consoleLinesDiv.appendChild(Console.GetConsoleLineDiv(arg, "console-line console-line-error"));
    Console.CheckConsoleMaxSize();
};

Console.Notification = function(arg)
{
    Console.consoleLinesDiv.appendChild(Console.GetConsoleLineDiv(arg, "console-line console-line-notification"));
    Console.CheckConsoleMaxSize();
};

Console.Clear = function()
{
    while (Console.consoleLinesDiv.lastChild)
    {
        const line = Console.consoleLinesDiv.lastChild;
        Console.consoleLinesPool.push(line);
        Console.consoleLinesDiv.removeChild(line);
    }
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

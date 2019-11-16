
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

Console.Write = function(...args)
{
    Console.consoleLinesDiv.appendChild(Console.GetConsoleLineDiv(args.join(" "), "console-line"));
    Console.CheckConsoleMaxSize();
};

Console.Error = function(...args)
{
    Console.consoleLinesDiv.appendChild(Console.GetConsoleLineDiv(args.join(" "), "console-line console-line-error"));
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

async function ShowPopupAlert(text, yesText, noText, cancelText)
{
    const alertOverlay = document.getElementById("alert-overlay");
    alertOverlay.style.display = "";

    const alertBox = document.getElementById("alert-box");
    alertBox.querySelector("#alert-text").innerText = text;

    const yesButton = alertBox.querySelector("#alert-button-yes");
    const noButton = alertBox.querySelector("#alert-button-no");
    const cancelButton = alertBox.querySelector("#alert-button-cancel");

    yesButton.style.display = yesText ? "" : "none";
    yesButton.innerText = yesText || "";
    
    noButton.style.display = noText ? "" : "none";
    noButton.innerText = noText || "";
    
    cancelButton.style.display = cancelText ? "" : "none";
    cancelButton.innerText = cancelText || "";

    return await new Promise(resolve =>
    {
        function ButtonClicked(result)
        {
            alertOverlay.style.display = "none";
            resolve(result);
        }

        yesButton.onclick = () => ButtonClicked("yes");
        noButton.onclick = () => ButtonClicked("no");
        cancelButton.onclick = () => ButtonClicked("cancel");
    });
}

async function Alert(text, okText)
{
    await ShowPopupAlert(text, okText || "OK");
}

async function Confirm(text, yesText, noText)
{
    return (await ShowPopupAlert(text, yesText || "Yes", noText || "No")) === "yes";
}

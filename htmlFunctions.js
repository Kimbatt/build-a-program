
async function ShowPopupAlert(text, yesText, noText, cancelText, showInputBox)
{
    const alertOverlay = document.getElementById("alert-overlay");
    alertOverlay.style.display = "";

    const inputBox = document.getElementById("alert-input");
    if (showInputBox)
    {
        inputBox.value = "";
        inputBox.style.display = "";
        inputBox.focus();
    }
    else
        inputBox.style.display = "none";

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

        if (showInputBox)
        {
            inputBox.onkeydown = ev =>
            {
                if (ev.key === "Enter")
                    ButtonClicked("yes");
            }
        }
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

async function Prompt(text, yesText, cancelText)
{
    if (await ShowPopupAlert(text, yesText || "OK", undefined, cancelText || "Cancel", true) === "cancel")
        return null;

    return document.getElementById("alert-input").value;
}

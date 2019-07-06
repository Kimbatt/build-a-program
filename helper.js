
function GetCoords(elem) // https://stackoverflow.com/a/26230989
{
    const rect = elem.getBoundingClientRect();

    const body = document.body;
    const docEl = document.documentElement;

    const scrollTop = window.pageYOffset; // || docEl.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset; // || docEl.scrollLeft || body.scrollLeft;

    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;

    return {
        y: Math.round(rect.top + scrollTop - clientTop),
        x: Math.round(rect.left + scrollLeft - clientLeft),
        width: rect.width,
        height: rect.height
    };
}

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

let GetTextSize;
(() =>
{
    const div = document.createElement("div");
    div.style = "display: table; visibility: hidden;";
    GetTextSize = function(text, element)
    {
        div.innerText = text;
        div.style.font = getComputedStyle(element).font;
        document.body.appendChild(div);
        const rect = div.getBoundingClientRect();
        document.body.removeChild(div);
        return rect.width;
    }
})();

class StringMap
{
    constructor()
    {
        this.root = {};
    }

    add(str, value)
    {
        const data = {
            str: str,
            value: value
        };

        for (let start = 0; start < str.length; ++start)
        {
            let node = this.root;
            for (let i = start; i < str.length; ++i)
            {
                const char = str[i];
                let ptr = node[char];
                if (ptr)
                    node = ptr;
                else
                {
                    ptr = {};
                    node[char] = ptr;
                    node = ptr;
                }
            }

            if (start === 0)
                node["final"] = data;
            else
            {
                let substrList = node["substr"];
                if (!substrList)
                {
                    substrList = {};
                    node["substr"] = substrList;
                }

                substrList[str] = data;
            }
        }
    }

    /**
     * Finds the exact string
     * @param {string} str String to find
     * @returns {any} the value associated with str if found, null otherwise
     */
    findExact(str)
    {
        if (str === "")
            return null;

        let node = this.root;
        for (let i = 0; i < str.length; ++i)
        {
            const ptr = node[str[i]];
            if (!ptr)
                return null;

            node = ptr;
        }

        const final = node["final"];
        if (final && str === final.str)
            return final;

        return null;
    }

    /**
     * Finds all strings containing [[str]]
     * @param {string} str String to find
     * @param {boolean} ignoreCase Ignore case
     * @param {number} limit Max number of matches to return, leave empty to return all results
     * @returns {any[]} all strings that contain [[str]] and their associated values
     */
    findSubstring(str, ignoreCase, limit)
    {
        if (str === "")
            return [];

        if (limit === undefined)
            limit = Infinity;

        let stack;

        if (ignoreCase)
        {
            let searchNodes = [this.root];
            let tempNodes = [];
            
            for (let i = 0; i < str.length; ++i)
            {
                const char = str[i];
                let foundAny = false;
                while (searchNodes.length !== 0)
                {
                    const node = searchNodes.pop();

                    const nodeLowerCase = node[char.toLowerCase()];
                    const nodeUpperCase = node[char.toUpperCase()];

                    const isSame = nodeLowerCase === nodeUpperCase;

                    if (nodeLowerCase)
                        tempNodes.push(nodeLowerCase);

                    if (!isSame && nodeUpperCase)
                        tempNodes.push(nodeUpperCase);

                    if (nodeLowerCase || nodeUpperCase)
                        foundAny = true;
                }

                if (!foundAny)
                    return [];

                let temp = searchNodes;
                searchNodes = tempNodes;
                tempNodes = temp;
            }

            stack = searchNodes;
        }
        else
        {
            let node = this.root;
            for (let i = 0; i < str.length; ++i)
            {
                const ptr = node[str[i]];
                if (!ptr)
                    return [];

                node = ptr;
            }

            stack = [node];
        }

        const ret = [];

        while (stack.length !== 0 && ret.length < limit)
        {
            const current = stack.pop();

            for (let char in current)
            {
                if (char === "substr")
                {
                    const substrs = current["substr"];
                    for (let substr in substrs)
                        ret.push(substrs[substr]);
                }
                else if (char === "final")
                    ret.push(current["final"]);
                else
                    stack.push(current[char]);
            }
        }

        return ret.slice(0, limit);
    }
}

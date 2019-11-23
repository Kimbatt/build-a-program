
const helper = {};

helper.GetCoords = function(elem) // https://stackoverflow.com/a/26230989
{
    const rect = elem.getBoundingClientRect();

    const body = document.body;
    const docEl = document.documentElement;

    let scrollTop = 0;
    let scrollLeft = 0;

    let node = elem.parentNode;
    while (node)
    {
        scrollTop += node.scrollTop || 0;
        scrollLeft += node.scrollLeft || 0;
        node = node.parentNode;
    }

    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;

    return {
        y: Math.round(rect.top + scrollTop - clientTop),
        x: Math.round(rect.left + scrollLeft - clientLeft),
        width: rect.width,
        height: rect.height
    };
};

helper.Flash = function(elem)
{
    function AnimationFinished()
    {
        elem.classList.remove("flashing");
        elem.removeEventListener("animationend", AnimationFinished);
    }

    elem.addEventListener("animationend", AnimationFinished);
    elem.classList.add("flashing");
};

(() =>
{
    const div = document.createElement("div");
    div.style = "display: table; visibility: hidden;";
    helper.GetTextSize = function(text, element)
    {
        const isInDOM = Boolean(document.body.contains(element));
        const parentNode = element.parentNode;
        const nextSibling = element.nextSibling;
        if (!isInDOM)
        {
            div.appendChild(element);
            document.body.appendChild(div);
        }

        const elementStyle = getComputedStyle(element);
        const fontFamily = elementStyle.fontFamily;
        const fontSize = elementStyle.fontSize;
        const fontWeight = elementStyle.fontWeight;
        const fontStyle = elementStyle.fontStyle;

        if (!isInDOM)
            parentNode.insertBefore(element, nextSibling);

        div.innerText = text;
        if (text.includes(" "))
            div.innerHTML = div.innerHTML.replace(/ /g, "&nbsp;");

        div.style.fontFamily = fontFamily;
        div.style.fontSize = fontSize;
        div.style.fontWeight = fontWeight;
        div.style.fontStyle = fontStyle;

        if (isInDOM)
            document.body.appendChild(div);

        const width = div.clientWidth;
        document.body.removeChild(div);
        return width;
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
        const unique = new Set();

        function Add(obj)
        {
            if (!unique.has(obj.str))
            {
                unique.add(obj.str);
                ret.push(obj);
            }
        }

        while (stack.length !== 0 && ret.length < limit)
        {
            const current = stack.pop();

            for (let char in current)
            {
                if (char === "substr")
                {
                    const substrs = current["substr"];
                    for (let substr in substrs)
                        Add(substrs[substr]);
                }
                else if (char === "final")
                    Add(current["final"]);
                else
                    stack.push(current[char]);
            }
        }

        return ret.slice(0, limit);
    }
}

// polyfills for edge (y tho)
if (!document.elementsFromPoint)
    document.elementsFromPoint = document.msElementsFromPoint;

if (!window.HTMLDivElement.prototype.scrollTo)
{
    window.HTMLDivElement.prototype.scrollTo = function(x, y)
    {
        this.scrollLeft = x;
        this.scrollTop = y;
    };
}

// setImmediate.js from https://github.com/YuzuJS/setImmediate
// used for not freezing the browser if the user program runs for a long time
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
        // Callback can either be a function or a string
        if (typeof callback !== "function") {
            callback = new Function("" + callback);
        }
        // Copy function arguments
        var args = new Array(arguments.length - 1);
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i + 1];
        }
        // Store and register the task
        var task = { callback: callback, args: args };
        tasksByHandle[nextHandle] = task;
        registerImmediate(nextHandle);
        return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

async function WaitImmediate()
{
    return new Promise(resolve => setImmediate(resolve));
}

Object.defineProperty(Object.prototype, "getOwnProperty", {
    value: function(propertyName)
    {
        if (this.hasOwnProperty(propertyName)) return this[propertyName];
        return undefined;
    }
});

(() =>
{
    const guids = {};
    const byteCount = 24;

    function GenerateGuid()
    {
        let guid = "";
        for (let i = 0; i < byteCount; ++i)
            guid += String.fromCharCode(Math.random() * 256 | 0);

        return btoa(guid);
    }

    helper.GetGuid = function(type)
    {
        /** @type {Set} */
        const guidsByType = guids.getOwnProperty(type) || new Set();

        while (true)
        {
            const guid = GenerateGuid();
            if (!guidsByType.has(guid))
            {
                guidsByType.add(guid);
                return guid;
            }
        }
    };

    helper.DeleteGuid = function(type, guid)
    {
        const guidsByType = guids.getOwnProperty(type);

        if (guidsByType)
            guidsByType.delete(guid);
    };

    helper.ClearGuids = function(type)
    {
        delete guids[type];
    };
})();

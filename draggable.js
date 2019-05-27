const draggable = {};

(function()
{
    let elementStyle, handleStyle;
    const prevStyle = {};
    const appliedStyles =
    {
        "user-select": "none",
        "-webkit-user-select": "none",
        "-moz-user-select": "none",
        "-ms-user-select": "none",
        "z-index": "1000",
        "opacity": 0.5
    };

    const isTouchDevice = window.ontouchstart !== undefined;

    let dragging = false;
    let dragStartX, dragStartY, dragStartScrollX, dragStartScrollY;
    let startPosLeft, startPosTop;
    
    let element;
    let hoveredElement;
    
    draggable.MouseMoved = function(ev)
    {
        if (!dragging)
            return;

        if (element.draggableData.attachedDropArea)
        {
            element.draggableData.attachedDropArea.draggableData.onDetach(element);
            element.draggableData.attachedDropArea = undefined;
        }

        elementStyle.position = "absolute";

        if (isTouchDevice)
            ev = ev.touches[0];
        
        const elem = element.draggableData.draggedElement;

        let mouseX = ev.clientX, mouseY = ev.clientY;
        //const scrollX = ev.pageX - mouseX, scrollY = ev.pageY - mouseY;

        const diffX = mouseX - dragStartX + window.pageXOffset - dragStartScrollX;
        const diffY = mouseY - dragStartY + window.pageYOffset - dragStartScrollY;

        let left = diffX + startPosLeft;
        let top = diffY + startPosTop;

        const constraintData = elem.draggableData.constraintData;
        if (constraintData)
        {
            if (left < constraintData.minX)
                left = constraintData.minX;
            else if (left > constraintData.maxX)
                left = constraintData.maxX;
            
            if (top < constraintData.minY)
                top = constraintData.minY;
            else if (top > constraintData.maxY)
                top = constraintData.maxY;

            // if (mouseX < constraintData.left - scrollX)
            //     mouseX = constraintData.left - scrollX;
            // else if (mouseX > constraintData.right - scrollX)
            //     mouseX = constraintData.right - scrollX;

            // if (mouseY < constraintData.top - scrollY)
            //     mouseY = constraintData.top - scrollY;
            // else if (mouseY > constraintData.bottom - scrollY)
            //     mouseY = constraintData.bottom - scrollY;
        }

        const elementsUnderMouse = document.elementsFromPoint(mouseX, mouseY);
        const previousHoveredElement = hoveredElement;
        let isHoveringOverAnyDropArea = false;
        for (let elem of elementsUnderMouse)
        {
            if (elem.draggableData && elem.draggableData.isDropArea) // search for drop area
            {
                // skip if the drop area is the child of the dragged element
                let parentNode = elem.parentNode;
                let skip = false;
                while (parentNode)
                {
                    if (parentNode === element)
                    {
                        skip = true;
                        break;
                    }
                    parentNode = parentNode.parentNode;
                }

                if (skip)
                    continue;

                isHoveringOverAnyDropArea = true;
                if (previousHoveredElement !== elem)
                {
                    hoveredElement = elem;
                    if (elem.draggableData.onDropCheck(element))
                        elem.draggableData.onDropHoverEnter(element);
                }

                break;
            }
        }

        if (!isHoveringOverAnyDropArea)
            hoveredElement = undefined;

        if (previousHoveredElement && previousHoveredElement !== hoveredElement)
            previousHoveredElement.draggableData.onDropHoverLeave(element);

        elementStyle.left = left + "px";
        elementStyle.top = top + "px";
    };
    document.addEventListener(isTouchDevice ? "touchmove" : "mousemove", draggable.MouseMoved);

    draggable.MouseUp = function()
    {
        if (!dragging)
            return;

        dragging = false;
        
        for (let s in appliedStyles)
            elementStyle[s] = prevStyle[s];

        if (hoveredElement)
        {
            if (hoveredElement.draggableData.onDropCheck(element))
            {
                element.draggableData.attachedDropArea = hoveredElement;
                hoveredElement.draggableData.onDropHoverLeave(element);
                hoveredElement.draggableData.onDrop(element);
            }
            else
                hoveredElement.draggableData.onDropHoverLeave(element);

            hoveredElement = undefined;
        }
    };
    document.addEventListener(isTouchDevice ? "touchend" : "mouseup", draggable.MouseUp);

    draggable.SetElementDraggable = function(elem, isOn, handle)
    {
        elem.draggableData = {};

        if (!handle)
            handle = elem;

        if (!handle.draggableData)
            handle.draggableData = {};

        if (isOn)
        {
            elem.style.position = "absolute";
            handle.addEventListener(isTouchDevice ? "touchstart" : "mousedown", elementMouseDown);
        }
        else
            handle.removeEventListener(isTouchDevice ? "touchstart" : "mousedown", elementMouseDown);
        
        elem.draggableData.handle = handle;
        handle.draggableData.draggedElement = elem;

        if (elem !== handle)
        {
            elem.draggableData.draggedElement = elem;
            handle.draggableData.handle = handle;
        }
    };

    const getCoords = function(elem) // https://stackoverflow.com/a/26230989
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

    draggable.ConstrainToElement = function(thisElement, toElement, borderSize)
    {
        borderSize = borderSize || 0;

        const constraintData = {};
        thisElement.draggableData.constraintData = constraintData;
        constraintData.constraintElement = toElement;
        constraintData.borderSize = borderSize;

        const thisRect = getCoords(thisElement);
        const otherRect = getCoords(toElement);

        constraintData.minX = 0; //otherRect.x - thisRect.x + borderSize;
        constraintData.minY = 0; //otherRect.y - thisRect.y + borderSize;
        constraintData.maxX = otherRect.width - thisRect.width - borderSize * 2;//otherRect.x + otherRect.width - (thisRect.x + thisRect.width + borderSize);
        constraintData.maxY = otherRect.height - thisRect.height - borderSize * 2;//otherRect.y + otherRect.height - (thisRect.y + thisRect.height + borderSize);

        // constraintData.left = otherRect.x + borderSize;
        // constraintData.top = otherRect.y + borderSize;
        // constraintData.right = constraintData.left + otherRect.width - borderSize * 2;
        // constraintData.bottom = constraintData.top + otherRect.height - borderSize * 2;
    };

    let elementMouseDown = function(ev)
    {
        if (dragging)
            return;

        if (isTouchDevice)
            ev = ev.touches[0];

        let node;
        let isValidElement = false;
        for (let i = 0; i < ev.path.length; ++i)
        {
            node = ev.path[i];
            if (node.draggableData && !node.draggableData.isDropArea)
            {
                isValidElement = true;
                break;
            }   
        }

        if (!isValidElement)
            return;

        const draggableData = node.draggableData;
        element = draggableData.draggedElement;
        elementStyle = element.style;
        handleStyle = draggableData.handle.style;
        dragging = true;

        const borderSize = draggableData.constraintData && draggableData.constraintData.borderSize || 0;
        dragStartX = ev.clientX + borderSize;
        dragStartY = ev.clientY + borderSize;
        dragStartScrollX = window.pageXOffset;
        dragStartScrollY = window.pageYOffset;

        let parentNode = element.parentNode;
        let parentCoords;
        while (parentNode)
        {
            parentCoords = getCoords(parentNode);
            if (getComputedStyle(parentNode).position === "relative")
                break;

            parentNode = parentNode.parentNode;
        }

        const startCoords = getCoords(element);
        startPosLeft = startCoords.x - parentCoords.x;
        startPosTop = startCoords.y - parentCoords.y;
        
        for (let s in appliedStyles)
            prevStyle[s] = elementStyle[s];

        for (let s in appliedStyles)
            elementStyle[s] = appliedStyles[s];
    };

    draggable.AddElement = function(elem, handle)
    {
        draggable.SetElementDraggable(elem, true, handle);
    };

    draggable.RecalculateSize = function(elem)
    {
        const constraintData = elem.draggableData.constraintData;
        if (constraintData)
            draggable.ConstrainToElement(elem, constraintData.constraintElement, constraintData.borderSize);
    };

    draggable.CreateDropArea = function(element, functions)
    {
        if (!element.draggableData)
            element.draggableData = {};

        functions = functions || {};
        element.draggableData.isDropArea = true;
        element.draggableData.onDropCheck = functions.check || (() => true); // function to check if a drop area accepts the element
        element.draggableData.onDropHoverEnter = functions.hoverenter || (() => {}); // element is dragged over the drop area
        element.draggableData.onDropHoverLeave = functions.hoverleave || (() => {}); // element is dragged out of the drop area
        element.draggableData.onDrop = functions.drop || (() => {}); // element is dropped onto the drop area
        element.draggableData.onDetach = functions.detach || (() => {}); // an element that was dropped inside the drop area is detached
    };
})();

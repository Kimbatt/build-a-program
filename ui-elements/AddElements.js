
(() =>
{
    const stringMap = new StringMap();
    const searchBox = document.getElementById("search-box");
    const searchKeywords = {
        "If statement": d => new IfStatement(d),
        "While statement": d => new WhileStatement(d),
        "Variable declaration": d => new VariableDeclaration(d),
        "Variable assignment": d => new VariableAssignment(d),
        "Numeric expression": d=> new BinaryNumericExpression(d),
        "Boolean expression": d => new BinaryBooleanExpression(d),
        "String expression": d => new BinaryStringExpression(d),
        "Number comparison": d => new NumberComparison(d),
        "String comparison": d => new StringComparison(d),
        "Number": d => new NumberLiteralExpression(d),
        "Boolean value": d => new BooleanLiteralExpression(d),
        "String": d => new StringLiteralExpression(d),
        "Variable": d => new VariableExpression(d)
    };

    for (let keyword in searchKeywords)
        stringMap.add(keyword, searchKeywords[keyword]);

    const mainDragArea = document.getElementById("main-drag-area");
    const searchResultsDiv = document.getElementById("search-results");
    const searchLimit = 10;
    const searchResultButtons = [];
    for (let i = 0; i < searchLimit; ++i)
    {
        let current = document.createElement("button");
        current.className = "search-result-element";

        const index = i;
        current.onmousedown = ev =>
        {
            if (ev.button === 0)
            {
                searchKeywords[searchResultButtons[index].innerHTML](mainDragArea);
                searchBox.value = "";
            }
        };

        searchResultButtons.push(current);
        searchResultsDiv.appendChild(current);
    }

    function Search(str)
    {
        const results = stringMap.findSubstring(str, true, searchLimit);

        if (results.length === 0)
        {
            searchResultButtons[0].innerText = "No results";
            searchResultButtons[0].disabled = true;

            for (let i = 1; i < searchLimit; ++i)
                searchResultButtons[i].style.display = "none";
        }
        else
        {
            searchResultButtons[0].disabled = false;

            let i = 0;
            for (; i < results.length; ++i)
            {
                const button = searchResultButtons[i];
                button.style.display = "";
                button.innerText = results[i].str;
            }

            for (; i < searchLimit; ++i)
                searchResultButtons[i].style.display = "none";
        }

        searchResultsDiv.className = "search-results-visible";
    }

    searchBox.oninput = () =>
    {
        const searchValue = searchBox.value;
        if (searchValue === "")
            searchResultsDiv.className = "search-results-hidden";
        else
            Search(searchValue);
    };

    searchBox.onblur = () =>
    {
        searchResultsDiv.className = "search-results-hidden";   
    };

    searchBox.onfocus = searchBox.oninput;
    
})();

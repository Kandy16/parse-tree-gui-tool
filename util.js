// utility functions

function removeAllChildren(elem) {
    while (elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
}

function isEmpty(str) {
    return (!str || 0 === str.length);
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

function getUrlVars() {
    let vars = {};
    const hashes = window.location.search.substring(1).split('&');
    for (let i in hashes) {
        let hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function setInputFields(vars) {
    if (!vars) {
        return;
    }
    const elems = document.querySelectorAll("input[type=number],input[type=text]");
    for (let i in elems) {
        let elem = elems[i];
        if (vars[elem.name]) {
            elem.value = decodeURIComponent(vars[elem.name].replace(/\+/g, " "));
        }
    }
}

function first_digit(n) {
    while (n > 9) {
        n /= 10;
    }
    return n;
}

// window.onload = function () {
//     setInputFields(getUrlVars());
//     parse();
// };

function catch_enter(event, function_on_event) {
    if (event.which == 13 || event.keyCode == 13) {
        function_on_event();
        return false;
    }
    return true;
}
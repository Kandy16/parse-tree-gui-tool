//creates a new div for a new parse
function create_graph_div(tree) {
    let div = document.createElement("DIV");
    let pre = document.createElement("PRE");
    pre.innerHTML = parse2str(tree);
    div.appendChild(pre);
    return div;
}

// // form request to cgi and parse response
// function parse() {
//     const parentDiv = document.querySelector("#parses");
//     //clean previous parses
//     removeAllChildren(parentDiv);
//
//     const request = new XMLHttpRequest();
//     request.open('GET', build_cgi_query(), true);
//
//     request.onload = function () {
//         let msg = '';
//         if (request.status >= 200 && request.status < 400) {
//             if (isBlank(request.responseText)) {
//                 msg = 'No parses were found';
//             } else {
//                 let lines = request.responseText.trim().split('\n');
//                 for (let i in lines) {
//                     const parse_str = lines[i].trim();
//                     if (parse_str.startsWith('(') && parse_str.endsWith(')')) {
//                         const tree = parseBrackets(parse_str);
//                         if (tree) {
//                             const div = parentDiv.appendChild(create_graph_div(tree));
//                             const svg = div.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
//                             drawTree(tree, svg);
//                         }
//
//                     }
//                 }
//             }
//         } else {
//             // We reached our target server, but it returned an error
//             if (request.status === 0) {
//                 msg = 'Not connect. Verify Network.';
//             } else if (request.status === 404) {
//                 msg = 'Requested page not found. [404]';
//             } else if (request.status === 500) {
//                 msg = 'Internal Server Error [500].';
//             } else {
//                 msg = 'Uncaught Error.' + request.responseText;
//             }
//
//         }
//         document.querySelector("#parseStatus strong").innerHTML = msg;
//     };
//
//     request.onerror = function () {
//         // There was a connection error of some sort
//         console.log("An error occurred during the requerst:", request);
//     };
//     request.send();
// }

// visualize parse tree using dagre-d3
function build_graph(graph, tree, startindex = 1) {
    let label = tree.label;
    if (tree.morph) {
        label += '-' + tree.morph
    }
    const graph_node = {label: label,};
    if (tree.class) {
        graph_node.class = tree.class
    }
    graph.setNode(startindex, graph_node);
    let child_index = startindex * 10;
    let children = tree.children;
    if (children) {
        for (let i in children) {
            let child = children[i];
            build_graph(graph, child, child_index);
            const child_edge = {};
            if (child.gf) {
                child_edge.label = child.gf;
            }
            graph.setEdge(startindex, child_index, child_edge);
            child_index += 1;
        }
    }
}

// use dagre and d3 to draw a tree on the svg_elem
function drawTree(tree, svg_elem) {
    // Create the input graph
    // Available options: https://github.com/dagrejs/dagre/wiki
    const g = new dagreD3.graphlib.Graph()
        .setGraph({nodesep: 30, ranksep: 30})
        //      .setGraph({})
        .setDefaultEdgeLabel(function () {
            return {};
        });

    build_graph(g, tree);

    g.nodes().forEach(function (v) {
        let node = g.node(v);
        // Round the corners of the nodes
        node.rx = node.ry = 5;
    });

    // Create the renderer
    const render = new dagreD3.render();

    // Set up an SVG group so that we can translate the final graph.
    const svg = d3.select(svg_elem),
        svgGroup = svg.append("g");

    // Run the renderer. This is what draws the final graph.
    render(d3.select(svg_elem.firstChild), g);

    svg.attr("width", g.graph().width + 40);
    // Center the graph
    const xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
}

/*
    Takes a nonterminal in form 'PH-GF-MORPH' and returns an object
    {
        label: PH,
        gf: GF,
        morph: MORPH,
    }
 */
function parseNonterminal(ntstr) {
    const ntarray = ntstr.trim().split('-');
    if (ntarray.length === 0) {
        console.log("Unable to parse node:", ntstr);
        return null;
    }
    const node = {label: ntarray[0]};

    if (ntarray.length >= 2) {
        const gf = ntarray[1].trim();
        if (gf !== 'NONE' && gf !== 'NONE/nohead') {
            node.gf = gf;
        }
    }

    if (ntarray.length >= 3) {
        const morph = ntarray[2].trim();
        if (morph !== 'NONE') {
            node.morph = morph;
        }
    }
    return node;
}

/*
    Create an object from a preterminal in form 'VMFIN-3pis'
    {
        label: VMFIN,
        morph: 3pis,
    }
 */
function parsePreterminal(ntstr) {
    const ntarray = ntstr.trim().split('-');
    if (ntarray.length === 0) {
        console.log("Unable to parse node:", ntstr);
        return null;
    }
    const node = {label: ntarray[0]};
    if (ntarray.length == 2) {
        const morph = ntarray[1].trim();
        if (morph !== 'NONE') {
            node.morph = morph;
        }
    }

    if (ntarray.length > 2) {
        console.warn("Unknown preterminal format: ", ntstr)
    }

    return node;
}



// append a new child to the parent and set backreference child.parent
function add_node(parent, child) {
    if (parent) {
        if (!parent.hasOwnProperty('children')) {
            parent.children = []
        }
        parent.children.push(child);
        child.parent = parent;
    }
}

// returns string representaiton of a node
function node2str(node) {
    let result = node.label;
    if (node.gf) {
        result += '-' + node.gf;
    }
    if (node.morph) {
        result += '-' + node.morph;
    }
    return result;
}

// returns neat formatted string representation of a parse
function parse2str(tree, level = 0) {
    if (!tree) {
        return;
    }
    const children = tree.children;
    // check if the tree is a terminal
    if (!children) {
        return node2str(tree);
    }
    // tree is a nonterminal
    let result = '(' + node2str(tree);
    const spacing = '\t'.repeat(level + 1);
    if (children.length > 1) {
        for (let i in children) {
            result += '\n' + spacing + parse2str(children[i], level + 1);
        }
    } else {
        result += ' ' + parse2str(children[0], level);
    }
    return result + ')';
}

/*
    (TOP (SIMPX-NONE/nohead (VF-NONE/nohead (NX-ON (PPER-HD Es)))(LK-NONE (VXFIN-HD (VAFIN-HD ist)))(MF-NONE/nohead (NX-OA (ART-NONE eine)(ADJX-NONE (ADJA-HD schöne))(NN-HD Frau)))))
    transforms parse string in bracketing format (as above) to an object
 */
function parseBrackets(brackets) {
    let unmatched_brackets = 0;
    let parentobj = null;
    let node = '';
    for (let i in brackets) {
        let ch = brackets.charAt(i);

        switch (ch) {
            case '(':
                unmatched_brackets += 1;
                node = node.trim();
                if (!isEmpty(node)) {
                    let nonterminal = parseNonterminal(node);
                    add_node(parentobj, nonterminal);
                    parentobj = nonterminal;
                    node = '';
                }
                break;
            case ')':
                unmatched_brackets -= 1;
                node = node.trim();
                if (!isEmpty(node)) {
                    let termArray = node.split(/\s+/);
                    if (termArray.length > 1) {
                        const preterm = parsePreterminal(termArray[0]);
                        const term = termArray.slice(1).join(' ').trim();
                        add_node(preterm, {label: term, class: "type-TK"});
                        add_node(parentobj, preterm);
                    }
                    node = '';
                } else {
                    if (unmatched_brackets) { // top element has no parent
                        parentobj = parentobj.parent;
                    }
                }
                break;
            default:
                node += ch;
        }
    }
    console.assert(unmatched_brackets === 0);
    // console.log(parentobj);
    return parentobj;
}

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
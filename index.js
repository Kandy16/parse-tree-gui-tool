var bodyElem = d3.select('body'),
    jsElem = d3.select('#js'),
    jsPanel = bodyElem.append('div').attr('id', 'jsPanel');
cssElem = d3.select('#css'),
    cssPanel = bodyElem.append('div').attr('id', 'cssPanel');

function setupPanel(panel, elem, title) {
    panel.append('h2').text(title);
    return panel.append('pre').append('code').text(elem.html().trim());
}

function renderGraphics() {
    render(d3.select("svg g"), g);
}

var graph = undefined;

var g = undefined;
var render = undefined;
var selectedNodeIdentifier = undefined;
var selectedItem = undefined;


var selectNodeFunc = function (itemIndex, parentIndex, others) {
    
    if (selectedItem != undefined) {
        selectedItem.classed('selecting', false);
        console.log('Previous node:', selectedItem);
        selectedDOMElement = selectedItem['_groups'][0][0];
        console.log(selectedDOMElement.lastChild);
        console.log(selectedDOMElement.removeChild);
        selectedDOMElement.removeChild(selectedDOMElement.lastChild);
    }

    console.log('Selected Node index:', itemIndex);
    //console.log('Parent Node Index:',parentIndex);
    //console.log('Others:',others);

    selectedNodeIdentifier = itemIndex;
    selectedItem = d3.select(this);
    console.log(selectedItem)
    console.log(selectedItem['_groups'][0][0].parentElement)
    selectedItem = d3.select(selectedItem['_groups'][0][0].parentElement);
    console.log(selectedItem)
    selectedItem.classed('selecting', true);
    settingsGroupButtonsAddFunc()
};


var deselectNodeFunc = function (itemIndex) {
    /*console.log('De-Selected Item index:', itemIndex);
    selectedIdentifier = undefined;
    selectedItem = undefined;
    d3.select(this).classed('showing', false);*/
};


var doubleClickNodeFunc = function (itemIndex) {
    console.log('Double clicked Node index:', itemIndex);
    console.log(g.node(itemIndex))
};

var addNodeClickFunc = function(){
    console.log('Add node clicked');
    if (selectedNodeIdentifier != undefined) {
        nodesCount = g.nodeCount()
        nodesCount += 1;
        nodeString = nodesCount.toString();
        g.setNode(nodesCount, {
            label: 'node' + nodeString,
            class: 'type-' + nodeString
        });
        edgesCount = g.edgeCount()
        edgesCount += 1;
        g.setEdge(selectedNodeIdentifier, nodesCount, {
            label: edgesCount.toString(),
            class: 'type-' + selectedNodeIdentifier + '_' + nodeString
        });
        //g.setEdge(2, 3, {label:'hi', class:'type-2_3'});

        renderGraphics();
        updateGraphSize();
        
        var svg = d3.select('svg')
        var gNode = svg.select('g')

        var newCreatedItem = gNode.select('.type-' + nodeString);
        newCreatedItem.on('click', selectNodeFunc);
        newCreatedItem.on('blur', deselectNodeFunc);
        newCreatedItem.on('dblclick', doubleClickNodeFunc);

        var newCreatedEdge = gNode.select('.type-' + selectedNodeIdentifier + '_' + nodeString);
        newCreatedEdge.on('focus', selectEdgeFunc);

        //console.log(newCreatedItem);
        //console.log(newCreatedItem.node());
        //newCreatedItem.node().focus();

        //console.log(newCreatedEdge);
        //console.log(newCreatedEdge.node())

    }
}
$("input[name='addnode']").click(addNodeClickFunc);

var removeNodeClickFunc = function () {
    console.log('Remove node clicked');
    if (selectedNodeIdentifier != undefined) {
        successorsList = g.successors(selectedNodeIdentifier);
        predecessorsList = g.predecessors(selectedNodeIdentifier);

        console.log(predecessorsList);
        console.log(successorsList);

        i = 0;
        while (i < successorsList.length) {
            tempList = g.successors(successorsList[i]);
            i = i + 1;

            length = successorsList.length;
            for (j in tempList) {
                successorsList[length] = tempList[j];
                length = length + 1
            }
        }
        successorsList[length] = selectedNodeIdentifier;
        console.log(successorsList);

        for (i in successorsList) {
            g.removeNode(successorsList[i])
        }

        renderGraphics();
        updateGraphSize();

        selectedNodeIdentifier = undefined;
        selectedItem = undefined
        
        var svg = d3.select('svg')
        var gNode = svg.select('g')

        if (predecessorsList.length > 0) {
            temp = predecessorsList[0];
            tempItem = gNode.select('.type-' + temp)
        }
        if (tempItem != undefined) {
            console.log(tempItem);
            //console.log(tempItem.node());
            //tempItem.node().focus()
        }
    }
}

$("input[name='removenode']").click(removeNodeClickFunc);

var editNodeClickFunc = function(){
    console.log('Edit button clicked!!')
}

var moveLeftClickFunc = function() {
    console.log('move left clicked');
    if (selectedNodeIdentifier != undefined) {
        console.log('There are nodes');
        predecessors = g.predecessors(selectedNodeIdentifier);
        if (predecessors.length > 0) {
            console.log('there are predecessors');
            parent = predecessors[0];
            siblings = g.successors(parent);
            if (siblings.length > 0) {
                console.log('there are siblings');
                if (selectedNodeIdentifier != siblings[0]) {
                    console.log(selectedNodeIdentifier, siblings[0]);

                    neighborList = [];
                    neighborLabelList = [];
                    selectedIndex = siblings.indexOf(selectedNodeIdentifier);
                    console.log('Index of selected item:', selectedIndex);

                    console.log(siblings);
                    //swap current and previous
                    temp = siblings[selectedIndex];
                    siblings[selectedIndex] = siblings[selectedIndex - 1];
                    siblings[selectedIndex - 1] = temp;

                    console.log(parent);
                    console.log(siblings);

                    siblingLabels = [];
                    for (i = 0; i < siblings.length; i++) {
                        sibling = siblings[i];

                        tmpLabel = g.edge(parent, sibling)['label'];
                        siblingLabels[i] = tmpLabel;

                        console.log(sibling, tmpLabel);
                        g.removeEdge(parent, sibling)

                    }

                    setTimeout(renderGraphics, 1);
                    setTimeout(updateGraphSize, 1);

                    var updateFunction = function (i) {

                        return function () {
                            console.log('Update function executing after few ms');
                            console.log(siblings);
                            //for (i=0;i<siblings.length;i++){
                            sibling = siblings[i];
                            siblingLabel = siblingLabels[i];
                            console.log(sibling, siblingLabel);
                            g.setEdge(parent, sibling, {
                                'label': i.toString(),
                                'class': 'type-' + parent + '_' + sibling + ' extra'
                            });
                            //break;
                            //}

                            renderGraphics();
                            updateGraphSize();
                        }
                    };
                    setTimeout(updateFunction(0), 1000 + i * 2000);
                    setTimeout(updateFunction(2), 1000 + i * 2000);
                    setTimeout(updateFunction(1), 1000 + i * 2000);
                    for (i = 0; i < siblings.length; i++) {
                        //setTimeout(updateFunction(i), 1000+i*1000)
                    }

                } else {
                    console.log('It is at left extreme!!!')
                }
            } else {
                console.log('No siblings!!!')
            }
        } else {
            console.log('No parents!!!')
        }
    } else {
        console.log('No nodes selected !!!')
    }
}

$("input[name='left']").click(moveLeftClickFunc);

var moveRightClickFunc = moveLeftClickFunc
$("input[name='right']").click(moveRightClickFunc);

var selectedEdgeIdentifier = undefined;
var selectedEdge = undefined;
var recipientNodeIdentifier = undefined;
var selectEdgeFunc = function (edgeIndex) {
    console.log('Selected edge index:', edgeIndex);
    selectedEdgeIdentifier = edgeIndex;
    selectedEdge = d3.select(this);
    selectedEdge.classed('showing', true);
};

$("input[name='selectrecipientnode']").click(function () {
    console.log('select recipient node clicked');
    if (selectedNodeIdentifier != undefined) {

        recipientNodeIdentifier = selectedNodeIdentifier

    }
});

$("input[name='addedge']").click(function () {
    console.log('Add edge clicked');
    if (recipientNodeIdentifier != undefined & selectedNodeIdentifier != undefined) {
        edgesCount += 1;
        g.setEdge(selectedNodeIdentifier, recipientNodeIdentifier, {
            label: edgesCount.toString(),
            class: 'type-' + selectedNodeIdentifier + '_' + recipientNodeIdentifier
        });

        renderGraphics();
        updateGraphSize();

        var newCreatedEdge = gNode.select('.type-' + selectedNodeIdentifier + '_' + recipientNodeIdentifier);
        newCreatedEdge.on('focus', selectEdgeFunc);

        recipientNodeIdentifier = undefined


    }
});

$("input[name='removeedge']").click(function () {
    console.log('Remove edge clicked');
    if (selectedEdgeIdentifier != undefined) {

        g.removeEdge(selectedEdgeIdentifier['v'], selectedEdgeIdentifier['w']);

        renderGraphics();
        updateGraphSize();

        selectedEdgeIdentifier = undefined
        //selectedEdge = undefined

    }
});

var loadTreeFunc = function () {
    const parse_str = document.querySelector("#input").value.trim().replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ');
    if (parse_str.startsWith('(') && parse_str.endsWith(')')) {
        const tree = parseBrackets(parse_str);

        if (tree) {
            graph = new Graph(tree);
            graph.addNode('111211', 'first_added_node');
            graph.undo();


            var parentDiv = document.querySelector("#parses");
            removeAllChildren(parentDiv);
            const div = parentDiv.appendChild(create_graph_div(tree));
            // const svg = div.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
            const svg = d3.select("svg");
            svg.selectAll("*").remove();
            drawTree(tree, svg);

            var allNodes = svg.selectAll('g.node>rect');
            console.log('All Nodes:',allNodes)
            var result = allNodes.on('click', selectNodeFunc);
            console.log(result)
            
            var allNodeLabels = svg.selectAll('g.node>g');
            console.log('All Node Labels:',allNodeLabels)
            var result = allNodeLabels.on('click', selectNodeFunc);
            console.log(result)
            
            //allNodes.on('blur', deselectNodeFunc);
            //allNodes.on('dblclick', doubleClickNodeFunc);
            //var allEdges = svg.selectAll('g.edgePath');
            //allEdges.on('focus', selectEdgeFunc);
        }
    }
};

$("input[name='loadtree']").click(loadTreeFunc);

// $("input[name='savetree']").click(function () {
//     console.log('Save tree clicked');
//     console.log(dagreD3.graphlib.json.write(g));
//     console.log(g.toJson())
//
// });

var settingsGroupButtonsAddFunc = function(args){
    var addNode = "<g class='addGroup'><g><image xlink:href='lib/open-iconic-master/png/plus-4x.png' x='0' y='20' height='20' width='20'></image> <rect class='btn' onclick='addNodeClickFunc()' x='0' y='20' width='20' height='20'/></g></g>";
    
    var deleteNode = "<g><image xlink:href='lib/open-iconic-master/png/delete-4x.png' x='30' y='20' height='20' width='20'></image> <rect class='btn' onclick='removeNodeClickFunc()' x='30' y='20' width='20' height='20'/></g>";

    var editNode = "<g><image xlink:href='lib/open-iconic-master/png/wrench-4x.png' x='60' y='20' height='20' width='20'></image> <rect class='btn' onclick='editNodeClickFunc()' x='60' y='20' width='20' height='20'/></g>";
    
    var moveLeftNode = "<g><image xlink:href='lib/open-iconic-master/png/caret-left-4x.png' x='90' y='20' height='20' width='20'></image> <rect class='btn' onclick='moveLeftClickFunc()' x='90' y='20' width='20' height='20'/></g>";
    
    var moveRightNode = "<g><image xlink:href='lib/open-iconic-master/png/caret-right-4x.png' x='120' y='20' height='20' width='20'></image> <rect class='btn' onclick='moveRightClickFunc()' x='120' y='20' width='20' height='20'/></g>" ;
    
    //console.log(args);
    if(selectedItem != undefined){
        console.log(selectedItem);
        console.log(selectedItem['_groups'][0][0].innerHTML);
        
        var selectGNode = selectedItem['_groups'][0][0];
        var parentGNode = selectGNode.parentElement;
        console.log(parentGNode)
        elements = "<g class='settingsGroup'>" + addNode + deleteNode + editNode + 
                   moveLeftNode + moveRightNode + "</g>";
        selectGNode.innerHTML = selectGNode.innerHTML + elements;
    }
}

$("input[name='experiment']").click(settingsGroupButtonsAddFunc);


function updateGraphSize() {
    const svg = d3.select("svg");
    var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
}

//creates a new div for a new parse
function create_graph_div(tree) {
    let div = document.createElement("DIV");
    let pre = document.createElement("PRE");
    pre.innerHTML = parse2str(tree);
    div.appendChild(pre);
    return div;
}

// visualize parse tree using dagre-d3
function build_graph(graph, tree, startindex = 1) {
    let label = tree.label;
    if (tree.morph) {
        label += '-' + tree.morph
    }
    const graph_node = {label: label,};
    if (tree.class) {
        graph_node.class = tree.class.join(' ');
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
function drawTree(tree, svg) {
    // Create the input graph
    // Available options: https://github.com/dagrejs/dagre/wiki
    g = new dagreD3.graphlib.Graph()
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
    render = new dagreD3.render();

    // Set up an SVG group so that we can translate the final graph.
    // const svg = d3.select(svg_elem),
    svgGroup = svg.append("g");

    // Run the renderer. This is what draws the final graph.
    render(d3.select("svg g"), g);

    svg.attr("width", g.graph().width + 40);
    // Center the graph
    const xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
}

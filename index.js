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


var g = undefined;
var render = undefined;
var selectedNodeIdentifier = undefined;
var selectedItem = undefined;


var selectNodeFunc = function (itemIndex) {

    if (selectedItem != undefined) {
        selectedItem.classed('showing', false);
        console.log('Previous node:', selectedItem);
    }

    console.log('Selected Node index:', itemIndex);
    selectedNodeIdentifier = itemIndex;
    selectedItem = d3.select(this);
    selectedItem.classed('showing', true)
};


var deselectNodeFunc = function (itemIndex) {
    console.log('De-Selected Item index:', itemIndex);
    selectedIdentifier = undefined;
    selectedItem = undefined;
    d3.select(this).classed('showing', false);
};


var doubleClickNodeFunc = function (itemIndex) {
    console.log('Double clicked Node index:', itemIndex);
    console.log(g.node(itemIndex))
};


$("input[name='addnode']").click(function () {
    console.log('Add node clicked');
    if (selectedNodeIdentifier != undefined) {
        nodesCount += 1;
        nodeString = nodesCount.toString();
        g.setNode(nodesCount, {
            label: 'node' + nodeString,
            class: 'type-' + nodeString
        });
        edgesCount += 1;
        g.setEdge(selectedNodeIdentifier, nodesCount, {
            label: edgesCount.toString(),
            class: 'type-' + selectedNodeIdentifier + '_' + nodeString
        });
        //g.setEdge(2, 3, {label:'hi', class:'type-2_3'});

        renderGraphics();
        updateGraphSize();

        var newCreatedItem = gNode.select('.type-' + nodeString);
        newCreatedItem.on('click', selectNodeFunc);
        newCreatedItem.on('blur', deselectNodeFunc);
        newCreatedItem.on('dblclick', doubleClickNodeFunc);

        var newCreatedEdge = gNode.select('.type-' + selectedNodeIdentifier + '_' + nodeString);
        newCreatedEdge.on('focus', selectEdgeFunc);

        console.log(newCreatedItem);
        console.log(newCreatedItem.node());
        newCreatedItem.node().focus();

        console.log(newCreatedEdge);
        console.log(newCreatedEdge.node())

    }
});

$("input[name='removenode']").click(function () {
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
        //selectedItem = undefined

        if (predecessorsList.length > 0) {
            temp = predecessorsList[0];
            tempItem = gNode.select('.type-' + temp)
        }
        if (tempItem != undefined) {
            console.log(tempItem);
            console.log(tempItem.node());
            tempItem.node().focus()
        }

    }
});

$("input[name='left']").click(function (item) {
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
});


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
            var parentDiv = document.querySelector("#parses");
            removeAllChildren(parentDiv);
            const div = parentDiv.appendChild(create_graph_div(tree));
            // const svg = div.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
            const svg = d3.select("svg");
            svg.selectAll("*").remove();
            drawTree(tree, svg);

            var allNodes = svg.selectAll('g.node');
            allNodes.on('click', selectNodeFunc);
            allNodes.on('blur', deselectNodeFunc);
            allNodes.on('dblclick', doubleClickNodeFunc);
            var allEdges = svg.selectAll('g.edgePath');
            allEdges.on('focus', selectEdgeFunc);
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

function updateGraphSize() {
    const svg = d3.select("svg");
    var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", g.graph().height + 40);
}

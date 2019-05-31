/*var bodyElem = d3.select('body'),
    jsElem = d3.select('#js'),
    jsPanel = bodyElem.append('div').attr('id', 'jsPanel');
cssElem = d3.select('#css'),
    cssPanel = bodyElem.append('div').attr('id', 'cssPanel');
*/

var treeObj = undefined;
var graphLibObj = undefined;
var render = undefined;

var loadTreeFunc = function () {
     
    const parse_str = document.querySelector("#input").value.trim().replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ');
    if (parse_str.startsWith('(') && parse_str.endsWith(')')) {
        const treeDS = parseBrackets(parse_str);
        treeObj = new TreeGroup(treeDS);
        if (treeObj) {

            drawTree(treeObj);

            // the following code needs to be removed. 
            // Rather than mapping events to the whole node DOM, two entities of node DOM are only mapped to avoid event bubbling
            // There was a conflict between select node event and add,delete, edit etc button event. Whenever the later was performed, the
            // former was invoked and causing issues.
            
            //right now, event propagation is stopped and also event can be mapped to whole node DOM
            
            /*
            console.log('All Nodes:');
            console.log(allNodes);
            for (i in allNodes._groups[0]){
                temp = allNodes._groups[0][i];
                addActionButtonsOnNode(temp);
            }

            var allNodesRect = svg.selectAll('g.node>rect');
            console.log('All Nodes Rect:', allNodesRect);
            var result = allNodesRect.on('click', selectNodeFunc);
            console.log(result);

            var allNodeLabels = svg.selectAll('g.node>g.label');
            console.log('All Node Labels:', allNodeLabels);
            var result = allNodeLabels.on('click', selectNodeFunc);
            console.log(result);
            */

            //allNodes.on('blur', deselectNodeFunc);
            //allNodes.on('dblclick', doubleClickNodeFunc);
            //var allEdges = svg.selectAll('g.edgePath');
            //allEdges.on('focus', selectEdgeFunc);
        }
    }
};
$('#loadtree').click(loadTreeFunc);

function drawTree(treeObj) {
    console.log('drawTree is executing !!!');
    
    // Cleaning all resources
    clearNodeVariables();
    clearEdgeVariables();
    parentNodeIndex = undefined;

    removeGraphLibNodes();

    // Display the status - Will be mapped with textbox later
    var parentDiv = document.querySelector("#parses");
    parentDiv.appendChild(create_graph_div(treeObj.trees[0]));
    
    // Build a new graph from scratch
    for (i in treeObj.trees){
        build_graphLibObj(treeObj.trees[i]);//build_graphLibObj(treeObj.trees[i], i+1);
    }

    // Render the graph usng D3. This will use the SVG and add all elements
    renderGraphics();
    
    // Adds events such as select, add buttons to each and every node and edge
    linkTreeEvents();
}

//creates a new div for a new parse
function create_graph_div(tree) {
    
    
    let div = document.createElement("DIV");
    let pre = document.createElement("PRE");
    pre.innerHTML = parse2str(tree);
    div.appendChild(pre);
    return div;
}

var removeGraphLibNodes = function(){
    if(graphLibObj != undefined){
        //Enumerate all the nodes and remove one by one - which inturn will remove the edges
        nodes = graphLibObj.nodes();
        for (i in nodes){
            graphLibObj.removeNode(nodes[i]);
        }
    }
}

function build_graphLibObj(tree) {
    // Create the input graph
    // Available options: https://github.com/dagrejs/dagre/wiki
    if(graphLibObj == undefined){
        graphLibObj = new dagreD3.graphlib.Graph()
        .setGraph({nodesep: 30, ranksep: 30})
        .setDefaultEdgeLabel(function () {
            return {};
        });
    }
    
    // Create the node with label and class
    //the label of the node (which is displayed)
    let label = tree.label;
    if (treeObj.morph) {
        label += '-' + tree.morph;
    }
    const graph_node = {label: label,};
    
    // Class will be used to pin-point a specific node in the graph by using DOM elements
    
    if (treeObj.class) {
        graph_node.class = tree.class.join(' ');
    }
    // The ids start from 1 and goes on with 11,12,13 - to represent its three children and 111,112,113 to represent their children
    // The tree nodes contain the id within itself
    graphLibObj.setNode(tree.id, graph_node);

    //Enumerate the children one by one. Build the node for each
    // Create an edge between them and use the respective label
    let children = tree.children;
    if (children) {
        for (let i in children) {
            let child = children[i];
            build_graphLibObj(child);
            const child_edge = {};
            if (child.gf) {
                child_edge.label = child.gf;
            }
            graphLibObj.setEdge(tree.id, child.id, child_edge);
        }
    }
    
    // Round the corners of the nodes
    graphLibObj.nodes().forEach(function (v) {
        let node = graphLibObj.node(v);
        node.rx = node.ry = 5;
    });
}

var addActionButtonsOnNode = function (argNode) {
    
    //DOM Structure
    //Array of controls
    //--Addition button
    //--Deletion button
    //--Edit button
    //--Move left button
    //--Move right button

    //Every button is represented as :
    // g tag is used to group the controls
    //--image tag helps to load raster graphics (images) inside SVG
    //--rect tag is used to make the image clickable (But the co-ordinates has to be as same as image)
    
    //Both addition and deletion nodes are shown to the left of the node and the rest to the right
    var addNode = "<g class='add'><image xlink:href='lib/open-iconic-master/png/plus-4x.png' x='-60' y='20' height='20' width='20'></image> <rect class='btn' onclick='addNodeClickFunc()' x='-60' y='20' width='20' height='20'/></g>";
    var deleteNode = "<g class='delete'><image xlink:href='lib/open-iconic-master/png/delete-4x.png' x='-30' y='20' height='20' width='20'></image> <rect class='btn' onclick='removeNodeClickFunc()' x='-30' y='20' width='20' height='20'/></g>";
    
    var editNode = "<g class='edit'><image xlink:href='lib/open-iconic-master/png/wrench-4x.png' x='20' y='20' height='20' width='20'></image> <rect class='btn' onclick='editNodeClickFunc()' x='20' y='20' width='20' height='20'/></g>";
    var moveLeftNode = "<g class='left'><image xlink:href='lib/open-iconic-master/png/caret-left-4x.png' x='50' y='20' height='20' width='20'></image> <rect class='btn' onclick='moveLeftClickFunc()' x='50' y='20' width='20' height='20'/></g>";
    var moveRightNode = "<g class='right'><image xlink:href='lib/open-iconic-master/png/caret-right-4x.png' x='80' y='20' height='20' width='20'></image> <rect class='btn' onclick='moveRightClickFunc()' x='80' y='20' width='20' height='20'/></g>";
    
    var makeMaster = "<g class='master'><image xlink:href='lib/open-iconic-master/png/media-record-4x.png' x='-30' y='-40' height='20' width='20'></image> <rect class='btn' onclick='selectParentNodeClickFunc()' x='-30' y='-40' width='20' height='20'/></g>";
    var addEdge = "<g class='addChild'><image xlink:href='lib/open-iconic-master/png/sun-4x.png' x='20' y='-40' height='20' width='20'></image> <rect class='btn' onclick='addEdgeClickFunc()' x='20' y='-40' width='20' height='20'/></g>";
    

    if (argNode != undefined) {
        elements = "<g class='settingsGroup' visibility='hidden'>" + 
                    makeMaster + addEdge +
                    addNode + deleteNode + 
                    editNode + moveLeftNode + moveRightNode + 
                    "</g>";
        // For some reasons adding elements using DOM APIs was not reflecting. Not sure why? and hence resolved to innerHTML
        argNode.innerHTML = argNode.innerHTML + elements;
    }
};

var addActionButtonsOnEdge = function (argEdge) {
    
    //DOM Structure
    //Array of controls
    //--Deletion button
    //--Edit button
    
    //Every button is represented as :
    // g tag is used to group the controls
    //--image tag helps to load raster graphics (images) inside SVG
    //--rect tag is used to make the image clickable
    
    // It is important to draw those buttons near to where the edge is. Figuring out where the edge is drawn is messy.
    // A line is drawn using Path element which is the first child of Edge. It has the following attribute.
    //d="M96.625,378L96.625,393L96.625,408"
    // M - represents a marker and L represent point co-ordinates for drawlines (2 L's to have 2 point co-ordinates to draw a line)
    
    //Need to do experiments more - to figure out whether it is robust enough when complex edges are drawn (with multiple lines)
    var lineCoordinates = argEdge.firstElementChild.getAttribute('d');
    var arrowStartIndex = lineCoordinates.indexOf('L') + 1; //0
    var arrowEndIndex = lineCoordinates.lastIndexOf('L'); //0
    var arrowPoint = lineCoordinates.substring(arrowStartIndex, arrowEndIndex); //Result - 96.625,393
    //console.log('Arrow Point : ',arrowPoint, lineCoordinates);
    //var xArrowIndex = arrowPoint.indexOf(',');
    //var xArrowPoint = arrowPoint.substring(0,xArrowIndex);
    //var yArrowPoint = arrowPoint.substring(xArrowIndex+1,arrowPoint.length);
    //console.log('X,Y Arrow Point : ',xArrowPoint, yArrowPoint);
    
    //delete node to the left and edit node to the right
    var deleteEdge = "<g class='delete'><image xlink:href='lib/open-iconic-master/png/delete-4x.png' x='-30' y='0' height='20' width='20'></image> <rect class='btn' onclick='removeEdgeClickFunc()' x='-30' y='0' width='20' height='20'/></g>";

    var editEdge = "<g class='edit'><image xlink:href='lib/open-iconic-master/png/wrench-4x.png' x='30' y='0' height='20' width='20'></image> <rect class='btn' onclick='editEdgeClickFunc()' x='30' y='0' width='20' height='20'/></g>";

    if (argEdge != undefined) {
        elements = "<g class='settingsGroup' transform='translate("+arrowPoint+")' visibility='hidden'>" + deleteEdge + editEdge + "</g>";
        // For some reasons adding elements using DOM APIs was not reflecting. Not sure why? and hence resolved to innerHTML
        argEdge.innerHTML = argEdge.innerHTML + elements;
    }
};

function renderGraphics() {
    // Create render if not available
    if (render == undefined){
        render = new dagreD3.render();
    }
    
    // Remove everything from svg element first
    const svg = d3.select("svg");
    svg.selectAll("*").remove();
    svgGroup = svg.append("g");
    
    // Render
    render(d3.select("svg g"), graphLibObj);
    
    //Give enough width for svg to accomodate the whole graph
    svg.attr("width", graphLibObj.graph().width + 200);
    
    // Center the graph
    const xCenterOffset = (svg.attr("width") - graphLibObj.graph().width) / 2;
    svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
    svg.attr("height", graphLibObj.graph().height + 100);
}

var linkTreeEvents = function(){
    
    // Assign all the nodes with click event - this is set the global variables with node index and do some UI gimmicks for selection :-)
    const svg = d3.select("svg");
    
    // For nodes
    var allNodes = svg.selectAll('g.node');
    var result = allNodes.on('click', selectNodeFunc);

    // D3's selectAll output is wierd. Have to access the elements using this property. It contains the indexes as number strings '1', '2' etc.
    // In addition to that it contains other properties such as 'length'. These should not be used and hence the check for NaN property.
    
    for (i in allNodes._groups[0]){
        if(!isNaN(i)){ 
            temp = allNodes._groups[0][i];
            addActionButtonsOnNode(temp);
        }
    }
    
    // For edges
    var allEdges = svg.selectAll('g.edgePath');
    var result = allEdges.on('click', selectEdgeFunc);
        
    for (i in allEdges._groups[0]){
        if(!isNaN(i)){
            temp = allEdges._groups[0][i];
            addActionButtonsOnEdge(temp);
        }
    }
    
};

var selectedNodeIndex = undefined;
var selectedNode = undefined;

var clearNodeVariables = function(){
    
    if (selectedNodeIndex != undefined) {
        // the previous selected node needs to be de-selected 
        // and the controls respective to it should be hidden
        selectedNode.classList.remove('selected');
        //selectedNode.lastElementChild.style.display='none';
        //selectedNode.lastElementChild.setAttribute('enabled', true);
        var buttonsGroupElement = selectedNode.lastElementChild;
        buttonsGroupElement.querySelector('.left').setAttribute('visibility','hidden');
        buttonsGroupElement.querySelector('.right').setAttribute('visibility','hidden');
        buttonsGroupElement.setAttribute('visibility', 'hidden');

    }
    
    selectedNodeIndex = undefined;
    selectedNode = undefined;
};

var selectNodeFunc = function (nodeIndex) {
    
    // It is important to clear both node and edge variables
    
    clearNodeVariables();
    clearEdgeVariables();
    
    // Save the node Index and the element
    selectedNodeIndex = nodeIndex;
    console.log('Selected Node index :',selectedNodeIndex);
    selectedNode = this;

    // selected class will show the node with blue colour overlay
    selectedNode.classList.add('selected');
    

    // display the array of controls associated with it

    // DOM structure
    //Node
    //--Rect
    //--Label
    //--Array of controls - this needs to be shown
    
    
    var buttonsGroupElement = selectedNode.lastElementChild;
    //Using setAttribute because the cross browerser support is high
    buttonsGroupElement.setAttribute('visibility', 'visible');
    //selectedNode.lastElementChild.style.display='block';
    
    // the move left and right buttons need to be shown only based on the positioning of element in the tree.
    // If it is to the extreme left then move left can be made invisible and so on.

    leftNodeVisible = treeObj.hasNodeLeft(selectedNodeIndex)? 'visible':'hidden';
    rightNodeVisible = treeObj.hasNodeRight(selectedNodeIndex)? 'visible':'hidden';
    buttonsGroupElement.querySelector('.left').setAttribute('visibility',leftNodeVisible);
    buttonsGroupElement.querySelector('.right').setAttribute('visibility',rightNodeVisible);
    //buttonsGroupElement.querySelector('.left').style.display='none';
};

var addNodeClickFunc = function () {
    console.log('Add node clicked');
    event.stopImmediatePropagation();
    if (selectedNodeIndex != undefined) {
        treeObj.addNode(selectedNodeIndex, 'new_node');   
        setTimeout(drawTree(treeObj), 1000);
    } else{
        console.log('Select a node first !!!');
    }
};
var removeNodeClickFunc = function () {
    console.log('Remove node clicked');
    event.stopImmediatePropagation();
    if (selectedNodeIndex != undefined) {        
        treeObj.removeNode(selectedNodeIndex);
        setTimeout(drawTree(treeObj), 1000);
    } else{
        console.log('Select a node first !!!');
    }
};
var editNodeClickFunc = function () {
    console.log('Edit button clicked!!');
    event.stopImmediatePropagation();
    if (selectedNodeIndex != undefined) {
        let oldLabel = treeObj.getNodeLabel(selectedNodeIndex);
        let newLabel = prompt('Please enter a new node label: ',oldLabel);
        if(newLabel != null){
            treeObj.setNodeLabel(selectedNodeIndex, newLabel);
            setTimeout(drawTree(treeObj), 1000);
        }
    } else{
        console.log('Select a node first !!!');
    }
};

var moveLeftClickFunc = function () {
    console.log('Move left clicked');
    event.stopImmediatePropagation();
    if (selectedNodeIndex != undefined) {
        treeObj.leftShift(selectedNodeIndex);
        setTimeout(drawTree(treeObj), 1000);
    } else{
        console.log('Select a node first !!!');
    }
};
var moveRightClickFunc = function(){
    console.log('Move right clicked');
    event.stopImmediatePropagation();
    if (selectedNodeIndex != undefined) {
        treeObj.rightShift(selectedNodeIndex);
        setTimeout(drawTree(treeObj), 1000);
    } else{
        console.log('Select a node first !!!');
    }
};

var selectedEdgeIndex = undefined;
var parentNodeIndex = undefined;
var selectedEdge = undefined;

var clearEdgeVariables = function(){
    if (selectedEdgeIndex != undefined) {
        // the previous selected node needs to be de-selected 
        // and the controls respective to it should be hidden
        selectedEdge.classList.remove('selected');
        //selectedNode.lastElementChild.style.display='none';
        //selectedNode.lastElementChild.setAttribute('enabled', true);
        var buttonsGroupElement = selectedEdge.lastElementChild;
        buttonsGroupElement.setAttribute('visibility', 'hidden');

    }
    selectedEdgeIndex = undefined;
    selectedEdge = undefined;
};

var selectEdgeFunc = function (edgeIndex) {
    
    // It is important to clear both node and edge variables
    
    clearEdgeVariables();
    clearNodeVariables();

    // select both the edge index and element
    selectedEdgeIndex = edgeIndex;
    console.log('Selected Edge index :',selectedEdgeIndex);
    selectedEdge = this;

    // selected class will show the node with blue colour overlay
    selectedEdge.classList.add('selected');
    
    // display the array of controls associated with it

    // DOM structure
    //Node
    //--Rect
    //--Label
    //--Array of controls - this needs to be shown
    
    var buttonsGroupElement = selectedEdge.lastElementChild;
    // Using setAttribute because it improves the cross browser support
    buttonsGroupElement.setAttribute('visibility', 'visible');
    //buttonsGroupElement.querySelector('.left').style.display='none';
    //selectedNode.lastElementChild.style.display='block';

};

var selectParentNodeClickFunc = function(){
    if(selectedNodeIndex != undefined){
        parentNodeIndex = selectedNodeIndex;
    } else{
        console.log('Select a node first !!!')
    }
};

var addEdgeClickFunc = function(){
    console.log('Add edge clicked');
    // It is important to stop the event from bubbling up.
    // Otherwise when the remove and edit edge buttons are clicked, once after their respective event handlers are executed,
    // the event bubbles up and calls the click event handlers of the element. This needs to be stopped.
    event.stopImmediatePropagation();
    if(selectedNodeIndex != undefined){
        if (parentNodeIndex != undefined) {
            if(!treeObj.hasParentNode(selectedNodeIndex)){
                if(selectedNodeIndex != parentNodeIndex){
                    console.log('Arguments : ', parentNodeIndex, selectedNodeIndex);
                    treeObj.addEdge(parentNodeIndex, selectedNodeIndex,'');
                    setTimeout(drawTree(treeObj), 1000);        
                } else{
                    console.log('Cyclic reference exists! Choose a different node!!!');
                }
                
            } else{
                console.log('Select a node which does not have parent !!!');    
            }
        } else{
            console.log('Select a parent node first !!!');
        }
    } else {
        console.log('Select a node first !!!');
    }
};

var removeEdgeClickFunc = function(){
    console.log('Remove edge clicked');
    // It is important to stop the event from bubbling up.
    // Otherwise when the remove and edit edge buttons are clicked, once after their respective event handlers are executed,
    // the event bubbles up and calls the click event handlers of the element. This needs to be stopped.
    event.stopImmediatePropagation();
    if (selectedEdgeIndex != undefined) {        
        treeObj.removeEdge(selectedEdgeIndex['v'], selectedEdgeIndex['w']); 
        setTimeout(drawTree(treeObj), 1000);
    } else{
        console.log('Select an edge first !!!');
    }    
};

var editEdgeClickFunc = function(){
    console.log('Edit edge clicked!!');
    event.stopImmediatePropagation();
    if (selectedEdgeIndex != undefined) {
        let oldLabel = treeObj.getEdgeLabel(selectedEdgeIndex['w']);
        let newLabel = prompt('Please enter a new edge label: ',oldLabel);
        if(newLabel != null){
            //console.log('new input : ', newLabel);
            treeObj.setEdgeLabel(selectedEdgeIndex['w'], newLabel);
            setTimeout(drawTree(treeObj), 1000);
        }
    } else{
        console.log('Select an edge first !!!');
    }    
};

var undoClickFunc = function(){
    console.log('Undo clicked!!');
    event.stopImmediatePropagation();
    treeObj.undo();
    setTimeout(drawTree(treeObj), 1000);    
};
$('#undo').click(undoClickFunc);

var redoClickFunc = function(){
    console.log('Redo clicked!!');
    event.stopImmediatePropagation();
    treeObj.redo();
    setTimeout(drawTree(treeObj), 1000);    
};
$('#redo').click(redoClickFunc);

//TBD - Need to make the whole control as a components and be able to instantiate it
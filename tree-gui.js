class TreeGUI{
    
    constructor(domElementId){
        this.treeGroupObj = undefined;
        this.graphLibObj = undefined;
        this.render = undefined;
        
        this.selectedNodeIndex = undefined;
        this.selectedNode = undefined;

        this.selectedEdgeIndex = undefined;
        this.parentNodeIndex = undefined;
        this.selectedEdge = undefined;
        
        this.domElementId = domElementId;
        this.guiElement = document.querySelector("#"+this.domElementId);

        //Rendering of the Dagre library was not working when added through DOM API.
        // Not sure why? - There were many hierarchy of calls in D3 API and was throwing error
        // regarding bounding box. 
        //This method of adding all DOM elements through innerHtml and adding event handlers which
        // are nested inside Object works out. So, sticking to it
        
        this.guiElement.innerHTML = '<textarea class="input" rows="15"> (VROOT(SIMPX (SIMPX-KONJ (VF-3p (NX-ON-npn (NN-npn Monopole[lemma=Monopol]))) (LK-VXFIN-3pis (VXFIN-HD-3pis (VMFIN-3pis sollen[lemma=sollen]))) (VC-VXINF (VXINF-OV (VVPP geknackt[lemma=knacken])) (VXINF-HD (VAINF werden[lemma=werden])))) (KON und[lemma=und]) (SIMPX-KONJ (VF-3p (NX-ON-npm (NN-npm Märkte[lemma=Markt]))) (LK-VXFIN-3pis (VXFIN-HD-3pis (VMFIN-3pis sollen[lemma=sollen]))) (VC-VXINF (VXINF-OV (VVPP getrennt[lemma=trennen])) (VXINF-HD (VAINF werden[lemma=werden])))))) </textarea> \
        <div class="btn-group"> \
            <input type="button" class="load" value="Load" size=50> \
            <input type="button" class="undo" value="Undo" size=50> \
            <input type="button" class="redo" value="Redo" size=50> \
        </div> \
        <svg width=960 height=600></svg>';
        
        // The event handlers will have event context and so this will most likely point to DOM
        // But inour case we need it to point to current object where these functions are residing
        // An arrow function expression will have parent context always - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
        this.guiElement.querySelector('.load').onclick = ()=>this.loadTreeFunc();
        this.guiElement.querySelector('.undo').onclick = ()=>this.undoClickFunc();
        this.guiElement.querySelector('.redo').onclick = ()=>this.redoClickFunc();
    }

    loadTreeFunc() {
        const parse_str = this.guiElement.querySelector(".input").value.trim().replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ');
        if (parse_str.startsWith('(') && parse_str.endsWith(')')) {
            const treeDS = parseBrackets(parse_str);
            this.treeGroupObj = new TreeGroup(treeDS);
            if (this.treeGroupObj) {
                this.drawTree(this.treeGroupObj);
            }
        }
    }

    drawTree(treeGroupObj) {
        console.log('drawTree is executing !!!');

        // Cleaning all resources
        this.clearNodeVariables();
        this.clearEdgeVariables();
        this.parentNodeIndex = undefined;

        this.removeGraphLibNodes();

        // Display the status - mapped with textbox. Updates are two ways
        this.guiElement.querySelector(".input").value = treeGroup2str(treeGroupObj);

        // Build a new graph from scratch
        for (var i in treeGroupObj.trees){
            this.build_graphLibObj(treeGroupObj.trees[i]);
        }

        // Render the graph usng D3. This will use the SVG and add all elements
        this.renderGraphics();

        // Adds events such as select, add buttons to each and every node and edge
        this.linkTreeEvents();
    }

    removeGraphLibNodes(){
        if(this.graphLibObj != undefined){
            //Enumerate all the nodes and remove one by one - which inturn will remove the edges
            var nodes = this.graphLibObj.nodes();
            for (var i in nodes){
                this.graphLibObj.removeNode(nodes[i]);
            }
        }
    }

    build_graphLibObj(tree) {
        // Create the input graph
        // Available options: https://github.com/dagrejs/dagre/wiki
        if(this.graphLibObj == undefined){
            this.graphLibObj = new dagreD3.graphlib.Graph()
            .setGraph({nodesep: 30, ranksep: 30})
            .setDefaultEdgeLabel(function () {
                return {};
            });
        }

        // Create the node with label and class
        //the label of the node (which is displayed)
        let label = tree.label;
        if (this.treeGroupObj.morph) {
            label += '-' + tree.morph;
        }
        const graph_node = {label: label,};

        // Class will be used to pin-point a specific node in the graph by using DOM elements

        if (this.treeGroupObj.class) {
            graph_node.class = tree.class.join(' ');
        }
        // The ids start from 1 and goes on with 1.1,1.2,1.3 - to represent its three children and 1.1.1,1.1.2,1.1.3 to represent their children
        // The tree nodes contain the id within itself
        this.graphLibObj.setNode(tree.id, graph_node);

        //Enumerate the children one by one. Build the node for each
        // Create an edge between them and use the respective label
        let children = tree.children;
        if (children) {
            for (let i in children) {
                let child = children[i];
                this.build_graphLibObj(child);
                const child_edge = {};
                if (child.gf) {
                    child_edge.label = child.gf;
                }
                this.graphLibObj.setEdge(tree.id, child.id, child_edge);
            }
        }

        // Round the corners of the nodes
        this.graphLibObj.nodes().forEach(function(that){
            return function (v) {
                let node = that.graphLibObj.node(v);
                node.rx = node.ry = 5;
            }    
        }(this));
    }

    addActionButtonsOnNode(argNode) {

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
        var addNode = "<g class='addnode'><image xlink:href='lib/open-iconic-master/png/plus-4x.png' x='-60' y='20' height='20' width='20'></image> <rect class='btn' x='-60' y='20' width='20' height='20'/></g>";
        var deleteNode = "<g class='deletenode'><image xlink:href='lib/open-iconic-master/png/delete-4x.png' x='-30' y='20' height='20' width='20'></image> <rect class='btn' x='-30' y='20' width='20' height='20'/></g>";

        var editNode = "<g class='editnode'><image xlink:href='lib/open-iconic-master/png/wrench-4x.png' x='20' y='20' height='20' width='20'></image> <rect class='btn' x='20' y='20' width='20' height='20'/></g>";
        var moveLeftNode = "<g class='moveleftnode'><image xlink:href='lib/open-iconic-master/png/caret-left-4x.png' x='50' y='20' height='20' width='20'></image> <rect class='btn' x='50' y='20' width='20' height='20'/></g>";
        var moveRightNode = "<g class='moverightnode'><image xlink:href='lib/open-iconic-master/png/caret-right-4x.png' x='80' y='20' height='20' width='20'></image> <rect class='btn' x='80' y='20' width='20' height='20'/></g>";

        var makeMasterNode = "<g class='makemasternode'><image xlink:href='lib/open-iconic-master/png/media-record-4x.png' x='-30' y='-40' height='20' width='20'></image> <rect class='btn' x='-30' y='-40' width='20' height='20'/></g>";
        var addChildNode = "<g class='addchildnode'><image xlink:href='lib/open-iconic-master/png/sun-4x.png' x='20' y='-40' height='20' width='20'></image> <rect class='btn' x='20' y='-40' width='20' height='20'/></g>";


        if (argNode != undefined) {
            var elements = "<g class='settingsGroup' visibility='hidden'>" + 
                        makeMasterNode + addChildNode +
                        addNode + deleteNode + 
                        editNode + moveLeftNode + moveRightNode + 
                        "</g>";
            // For some reasons adding elements using DOM APIs was not reflecting. Not sure why? and hence resolved to innerHTML
            argNode.innerHTML = argNode.innerHTML + elements;
        }
        
        argNode.querySelector('.addnode rect').onclick = ()=>this.addNodeClickFunc();
        argNode.querySelector('.deletenode rect').onclick = ()=>this.removeNodeClickFunc();
        argNode.querySelector('.editnode rect').onclick = ()=>this.editNodeClickFunc();
        argNode.querySelector('.moveleftnode rect').onclick = ()=>this.moveLeftClickFunc();
        argNode.querySelector('.moverightnode rect').onclick = ()=>this.moveRightClickFunc();
        argNode.querySelector('.makemasternode rect').onclick = ()=>this.selectParentNodeClickFunc();
        argNode.querySelector('.addchildnode rect').onclick = ()=>this.addEdgeClickFunc();
    }

    addActionButtonsOnEdge(argEdge) {

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

        var lineCoordinates = argEdge.firstElementChild.getAttribute('d');
        var arrowStartIndex = lineCoordinates.indexOf('L') + 1; //0
        var arrowEndIndex = lineCoordinates.lastIndexOf('L'); //0
        var arrowPoint = lineCoordinates.substring(arrowStartIndex, arrowEndIndex); //Result - 96.625,393
        
        //delete node to the left and edit node to the right
        var deleteEdge = "<g class='deleteedge'><image xlink:href='lib/open-iconic-master/png/delete-4x.png' x='-30' y='0' height='20' width='20'></image> <rect class='btn' x='-30' y='0' width='20' height='20'/></g>";

        var editEdge = "<g class='editedge'><image xlink:href='lib/open-iconic-master/png/wrench-4x.png' x='30' y='0' height='20' width='20'></image> <rect class='btn' x='30' y='0' width='20' height='20'/></g>";

        if (argEdge != undefined) {
            var elements = "<g class='settingsGroup' transform='translate("+arrowPoint+")' visibility='hidden'>" + deleteEdge + editEdge + "</g>";
            argEdge.innerHTML = argEdge.innerHTML + elements;
        }
        
        argEdge.querySelector('.deleteedge rect').onclick = ()=>this.removeEdgeClickFunc();
        argEdge.querySelector('.editedge rect').onclick = ()=>this.editEdgeClickFunc();
    }

    renderGraphics() {
        // Create render if not available
        if (this.render == undefined){
            this.render = new dagreD3.render();
        }

        // Remove everything from svg element first
        const svg = d3.select("#"+this.domElementId+" svg");
        svg.selectAll("*").remove();
        var svgGroup = svg.append("g");

        // Render
        this.render(svgGroup, this.graphLibObj);

        //Give enough width for svg to accomodate the whole graph
        svg.attr("width", this.graphLibObj.graph().width + 200);

        // Center the graph
        const xCenterOffset = (svg.attr("width") - this.graphLibObj.graph().width) / 2;
        svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
        svg.attr("height", this.graphLibObj.graph().height + 100);
    }

    linkTreeEvents(){
        //D3 event mapping is used. it has special arguments in event handlers such node/edge id,
        // index and the complete list of nodes/edges
        const svg = d3.select("#"+this.domElementId+" svg");

        // For nodes
        var allNodes = svg.selectAll('g.node');
        var result = allNodes.on('click', 
                                 (nodeId, nodeIndex, nodeList)=>this.selectNodeFunc(nodeId, nodeIndex, nodeList));

        // D3's selectAll output is wierd. Have to access the elements using this property. It contains the indexes as number strings '1', '2' etc.
        // In addition to that it contains other properties such as 'length'. These should not be used and hence the check for NaN property.

        for (var i in allNodes._groups[0]){
            if(!isNaN(i)){ 
                var temp = allNodes._groups[0][i];
                this.addActionButtonsOnNode(temp);
            }
        }

        // For edges
        var allEdges = svg.selectAll('g.edgePath');
        var result = allEdges.on('click', 
                                 (edgeId, edgeIndex, edgeList)=>this.selectEdgeFunc(edgeId, edgeIndex, edgeList));

        for (i in allEdges._groups[0]){
            if(!isNaN(i)){
                temp = allEdges._groups[0][i];
                this.addActionButtonsOnEdge(temp);
            }
        }

    }

    clearNodeVariables(){

        if (this.selectedNodeIndex != undefined) {
            // the previous selected node needs to be de-selected 
            // and the controls respective to it should be hidden
            this.selectedNode.classList.remove('selected');
            //selectedNode.lastElementChild.style.display='none';
            //selectedNode.lastElementChild.setAttribute('enabled', true);
            var buttonsGroupElement = this.selectedNode.lastElementChild;
            buttonsGroupElement.querySelector('.moveleftnode').setAttribute('visibility','hidden');
            buttonsGroupElement.querySelector('.moverightnode').setAttribute('visibility','hidden');
            buttonsGroupElement.querySelector('.addchildnode').setAttribute('visibility','hidden');
            buttonsGroupElement.setAttribute('visibility', 'hidden');

        }

        this.selectedNodeIndex = undefined;
        this.selectedNode = undefined;
    }

    selectNodeFunc(nodeId, nodeIndex, nodeList) {

        // It is important to clear both node and edge variables

        this.clearNodeVariables();
        this.clearEdgeVariables();

        // Save the node Index and the element
        this.selectedNodeIndex = nodeId;
        console.log('Selected Node index :',this.selectedNodeIndex);
        this.selectedNode = nodeList[nodeIndex];

        // selected class will show the node with blue colour overlay
        this.selectedNode.classList.add('selected');


        // display the array of controls associated with it

        // DOM structure
        //Node
        //--Rect
        //--Label
        //--Array of controls - this needs to be shown


        var buttonsGroupElement = this.selectedNode.lastElementChild;
        //Using setAttribute because the cross browerser support is high
        buttonsGroupElement.setAttribute('visibility', 'visible');
        //selectedNode.lastElementChild.style.display='block';

        // the move left and right buttons need to be shown only based on the positioning 
        // of element in the tree. If it is to the extreme left then move left can be made 
        // invisible and so on.

        var leftNodeVisible = this.treeGroupObj.hasNodeLeft(this.selectedNodeIndex)? 'visible':'hidden';
        buttonsGroupElement.querySelector('.moveleftnode').setAttribute('visibility',leftNodeVisible);

        var rightNodeVisible = this.treeGroupObj.hasNodeRight(this.selectedNodeIndex)? 'visible':'hidden';
        buttonsGroupElement.querySelector('.moverightnode').setAttribute('visibility',rightNodeVisible);

        var addChildNodeVisible = this.treeGroupObj.hasParentNode(this.selectedNodeIndex)? 'hidden':'visible';
        buttonsGroupElement.querySelector('.addchildnode').setAttribute('visibility',addChildNodeVisible);

        //buttonsGroupElement.querySelector('.left').style.display='none';
    }

    addNodeClickFunc () {
        console.log('Add node clicked');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {
            this.treeGroupObj.addNode(this.selectedNodeIndex, 'new_node');   
            //this.drawTree(this.treeGroupObj);
            setTimeout(this.drawTree(this.treeGroupObj), 1000);
        } else{
            console.log('Select a node first !!!');
        }
    }
    removeNodeClickFunc () {
        console.log('Remove node clicked');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {        
            this.treeGroupObj.removeNode(this.selectedNodeIndex);
            setTimeout(this.drawTree(this.treeGroupObj), 1000);
        } else{
            console.log('Select a node first !!!');
        }
    }
    editNodeClickFunc () {
        console.log('Edit button clicked!!');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {
            let oldLabel = this.treeGroupObj.getNodeLabel(this.selectedNodeIndex);
            let newLabel = prompt('Please enter a new node label: ',oldLabel);
            if(newLabel != null){
                this.treeGroupObj.setNodeLabel(this.selectedNodeIndex, newLabel);
                setTimeout(this.drawTree(this.treeGroupObj), 1000);
            }
        } else{
            console.log('Select a node first !!!');
        }
    }

    moveLeftClickFunc () {
        console.log('Move left clicked');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {
            this.treeGroupObj.leftShift(this.selectedNodeIndex);
            setTimeout(this.drawTree(this.treeGroupObj), 1000);
        } else{
            console.log('Select a node first !!!');
        }
    }
    moveRightClickFunc (){
        console.log('Move right clicked');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {
            this.treeGroupObj.rightShift(this.selectedNodeIndex);
            setTimeout(this.drawTree(this.treeGroupObj), 1000);
        } else{
            console.log('Select a node first !!!');
        }
    }

    clearEdgeVariables (){
        if (this.selectedEdgeIndex != undefined) {
            // the previous selected node needs to be de-selected 
            // and the controls respective to it should be hidden
            this.selectedEdge.classList.remove('selected');
            //selectedNode.lastElementChild.style.display='none';
            //selectedNode.lastElementChild.setAttribute('enabled', true);
            var buttonsGroupElement = this.selectedEdge.lastElementChild;
            buttonsGroupElement.setAttribute('visibility', 'hidden');

        }
        this.selectedEdgeIndex = undefined;
        this.selectedEdge = undefined;
    }

    selectEdgeFunc(edgeId, edgeIndex, edgeList) {

        // It is important to clear both node and edge variables

        this.clearEdgeVariables();
        this.clearNodeVariables();

        // select both the edge index and element
        this.selectedEdgeIndex = edgeId;
        console.log('Selected Edge index :',this.selectedEdgeIndex);
        this.selectedEdge = edgeList[edgeIndex];

        // selected class will show the node with blue colour overlay
        this.selectedEdge.classList.add('selected');

        // display the array of controls associated with it

        // DOM structure
        //Node
        //--Rect
        //--Label
        //--Array of controls - this needs to be shown

        var buttonsGroupElement = this.selectedEdge.lastElementChild;
        // Using setAttribute because it improves the cross browser support
        buttonsGroupElement.setAttribute('visibility', 'visible');
        //buttonsGroupElement.querySelector('.left').style.display='none';
        //selectedNode.lastElementChild.style.display='block';

    }

    selectParentNodeClickFunc (){
        if(this.selectedNodeIndex != undefined){
            this.parentNodeIndex = this.selectedNodeIndex;
        } else{
            console.log('Select a node first !!!')
        }
    }

    addEdgeClickFunc (){
        console.log('Add edge clicked');
        // It is important to stop the event from bubbling up.
        // Otherwise when the remove and edit edge buttons are clicked, once after their respective event handlers are executed,
        // the event bubbles up and calls the click event handlers of the element. This needs to be stopped.
        event.stopImmediatePropagation();
        if(this.selectedNodeIndex != undefined){
            if (this.parentNodeIndex != undefined) {
                if(!this.treeGroupObj.hasParentNode(this.selectedNodeIndex)){
                    if(this.selectedNodeIndex != this.parentNodeIndex){
                        console.log('Arguments : ', this.parentNodeIndex, this.selectedNodeIndex);
                        this.treeGroupObj.addEdge(this.parentNodeIndex, this.selectedNodeIndex,'');
                        setTimeout(this.drawTree(this.treeGroupObj), 1000);        
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
    }

    removeEdgeClickFunc (){
        console.log('Remove edge clicked');
        // It is important to stop the event from bubbling up.
        // Otherwise when the remove and edit edge buttons are clicked, once after their respective event handlers are executed,
        // the event bubbles up and calls the click event handlers of the element. This needs to be stopped.
        event.stopImmediatePropagation();
        if (this.selectedEdgeIndex != undefined) {        
            this.treeGroupObj.removeEdge(this.selectedEdgeIndex['v'], this.selectedEdgeIndex['w']); 
            setTimeout(this.drawTree(this.treeGroupObj), 1000);
        } else{
            console.log('Select an edge first !!!');
        }    
    }

    editEdgeClickFunc (){
        console.log('Edit edge clicked!!');
        event.stopImmediatePropagation();
        if (this.selectedEdgeIndex != undefined) {
            let oldLabel = this.treeGroupObj.getEdgeLabel(this.selectedEdgeIndex['w']);
            let newLabel = prompt('Please enter a new edge label: ',oldLabel);
            if(newLabel != null){
                //console.log('new input : ', newLabel);
                this.treeGroupObj.setEdgeLabel(this.selectedEdgeIndex['w'], newLabel);
                setTimeout(this.drawTree(this.treeGroupObj), 1000);
            }
        } else{
            console.log('Select an edge first !!!');
        }    
    }

    undoClickFunc (){
        console.log('Undo clicked!!');
        event.stopImmediatePropagation();
        this.treeGroupObj.undo();
        setTimeout(this.drawTree(this.treeGroupObj), 1000);    
    }

    redoClickFunc (){
        console.log('Redo clicked!!');
        event.stopImmediatePropagation();
        this.treeGroupObj.redo();
        setTimeout(this.drawTree(this.treeGroupObj), 1000);    
    }

}


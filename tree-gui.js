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
        
        this.filterProperties = ['none'];

        //Rendering of the Dagre library was not working when added through DOM API.
        // Not sure why? - There were many hierarchy of calls in D3 API and was throwing error
        // regarding bounding box. 
        //This method of adding all DOM elements through innerHtml and adding event handlers which
        // are nested inside Object works out. So, sticking to it
        
        this.guiElement.innerHTML = ' \
        <div class="row parse_text_editor"> \
            <div class="col-sm-8"> \
                <textarea class="input" rows="15"> (expr S (conj S 1~[subject={2},head={5},ref=3] (subj NP 2~[{4},ref=1] (head PropN 3~[{4}] (lex Mari 4~[stem=Mari,case=nominative,person=3,number=sg,gender=fem]))) (head V 5~[{6},ref=11] (lex liest 6~[stem=read,tense=present,person=3,number=sg,mode=active])) (dobj NP 13~[{14},ref=7] (head N 14~[{15},ref=7] (lex Bücher 15~[stem=book,case=accusative,person=3,number=pl,gender=masc])))) (coord C 13~[{12}] (lex und 12~[stem=and])) (conj S 7~[subject={10},ref=13,head={11}] (subj NP 8~[{10},ref=2] (head PropN 9~[{10}] (lex Jüri 10~[stem=Jüri,case=nominative,person=3,number=sg,gender=masc])))      (head V 11~[{12},ref=12] (lex schreibt 12~[stem=write,tense=present,person=3,number=sg,mode=active]))  (dobj NP 16~[{17},ref=7] (head N 17~[{18},ref=7] (lex Bücher 18~[stem=book,case=accusative,person=3,number=pl,gender=fem]))))) </textarea> \
            </div> \
            <div class="col-sm-2"> \
                <select class="choose_filter" multiple="True" size=15> \
                </select> \
            </div> \
        </div> \
        <div class="row> \
            <div class="col-sm-12"> \
                <div class="btn-group"> \
                    <input type="button" class="load" value="Load" size=50> \
                    <input type="button" class="undo" value="Undo" size=50> \
                    <input type="button" class="redo" value="Redo" size=50> \
                    <input type="button" class="save_image" value="To Image" size=50> \
                    <input type="button" class="full_screen" value="Toggle Display" size=50> \
                </div> \
            </div> \
        </div> \
        <div class="row"> \
            <div class="col-11"> \
                <svg class="drawing_area"></svg> \
            </div> \
        </div>';
        // The event handlers will have event context and so this will most likely point to DOM
        // But inour case we need it to point to current object where these functions are residing
        // An arrow function expression will have parent context always - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
        this.guiElement.querySelector('.load').onclick = ()=>this.loadTreeFunc();
        this.guiElement.querySelector('.undo').onclick = ()=>this.undoClickFunc();
        this.guiElement.querySelector('.redo').onclick = ()=>this.redoClickFunc();
        this.guiElement.querySelector('.save_image').onclick = ()=>this.saveImageClickFunc();
        this.guiElement.querySelector('.full_screen').onclick = ()=>this.fullScreenClickFunc();
    }

    loadTreeFunc(parse_str='') {
        var treeDS = undefined;
        // It can either take string input or Parser data model input or empty-indicating that 
        // we should use the textbox inside DOM
        if(typeof(parse_str) == 'string'){
            if(!parse_str){
            //if arguement passed empty then take the input from textbox
            //there will always be input :-)
                parse_str = this.guiElement.querySelector(".input").value.trim();
                //replace(/(\r\n|\n|\r)/gm, "").replace(/\s+/g, ' ');
            }
            
            if (parse_str.startsWith('(') && parse_str.endsWith(')')) {
                treeDS = parseBrackets(parse_str);
            } else {
                treeDS = JSON.parse(parse_str);
            }
        } else if(typeof(parse_str) == 'object'){
            treeDS = parse_str;
        }
        
        if (this.treeGroupObj) {
            this.treeGroupObj.load(treeDS);
        }else{
            this.treeGroupObj = new TreeGroup(treeDS);    
        }
        
        this.drawTree(this.treeGroupObj);
    }

    drawTree(treeGroupObj) {
        console.log('drawTree is executing !!!');

        // Cleaning all resources
        this.clearNodeVariables();
        this.clearEdgeVariables();
        this.parentNodeIndex = undefined;

        this.removeGraphLibNodes();
        
        //Filter properties
        var properties = ['all', 'none','id'];
        properties = properties.concat(this.treeGroupObj.getAllProperties());
        
        this.filterProperties.filter(function(value, index, arr){
           return properties.includes(value); 
        });
        
        var filterElement = this.guiElement.querySelector('.choose_filter');
        var filterOptionsText = '';
        for(var i in properties){
            let selected = '';
            if(this.filterProperties.includes(properties[i])){
                selected=' selected';
            }
            filterOptionsText += '<option value="'+properties[i]+'"'+selected+'>'+properties[i]+'</option>'
        }
        filterElement.innerHTML = filterOptionsText;
        filterElement.onchange = (event)=>this.handleFilterChange(event);
                
        // Display the status - mapped with textbox. Updates are two ways
        this.guiElement.querySelector(".input").value = treeGroup2str(treeGroupObj);

        // Build a new graph from scratch
        for (var i in treeGroupObj.children){
            this.build_graphLibObj(treeGroupObj.children[i]);
        }

        // Render the graph usng D3. This will use the SVG and add all elements
        this.renderGraphics();

        // Adds events such as select, add buttons to each and every node and edge
        this.linkTreeEvents();
    }
    
    handleFilterChange(event){
        //This is invoke when filters options (properties of parser tree) are changed
        this.filterProperties = [];
        //Enumerate the selected options and push it to filterProperties
        for(let i in event.target.selectedOptions){
            if(!isNaN(i)){ //some properties are not numeric
                this.filterProperties.push(event.target.selectedOptions[i].value);
            }
        }
        setTimeout(this.drawTree(this.treeGroupObj), 1000);
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

        // Create the node content based on filters
        //the label of the node (which is displayed)  
        var labelContent = tree.label;
        if(this.filterProperties.includes('all') || 
           this.filterProperties.includes('id')){
            if(tree.refId){
                labelContent += ' '+tree.refId+'~';
            }
        }
        if(tree.properties && !this.filterProperties.includes('none')){
            let propertiesContent = '';
            
            for(var i in tree.properties){
                if(this.filterProperties.includes('all') || 
                   this.filterProperties.includes(i)){
                    propertiesContent += i+'='+tree.properties[i]+',';    
                }
                
            }
            if(propertiesContent){
                
                // Remove the last comma
                propertiesContent = propertiesContent.slice(0,-1);
                
                if(!tree.refId){
                    labelContent += ' ';
                }
                labelContent += '['+propertiesContent+']';    
            }
            
        }
        const graph_node = {label: labelContent};

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
                const child_edge = {'label':''};
                if (child.edge) {
                    child_edge.label = child.edge;
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
        const svg = d3.select("#"+this.domElementId+" .drawing_area");
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
        const svg = d3.select("#"+this.domElementId+" .drawing_area");

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
        
        //Since we redraw the graph every time when a single operation is performed, 
        // selecting the same node is tricky. The tree objects make sure that they 
        // update the id when numerated once again. Here, All nodes contain all the nodes
        // We iterate to check which has the new updated id and call the selectNodeFunc accordingly.
        //Even for edge operations - to make it simple we end up selecting the parent node
        
        allNodes.select((nodeId, nodeIndex, nodeList)=>
              { if(nodeId == this.treeGroupObj.selectedIndex){
                  this.selectNodeFunc(nodeId, nodeIndex, nodeList);
            }});
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
        this.treeGroupObj.selectedIndex = nodeId;
        console.log('Selected Node index :',this.selectedNodeIndex);
        
        // the function either takes three arguments - nodeId, nodeIndex - the index of nodeList
        // and nodeList - this is usual through UI operations
        
        // Otherwise - it takes two arguments
        // nodeId remains the same
        // Instead of nodeIndex, we pass the selectedNode itself
        
        if(nodeList) {
            this.selectedNode = nodeList[nodeIndex];
        } else {
            //here nodeIndex is the node to be selcted
            this.selectedNode = nodeIndex;
        }
        
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
            if(this.treeGroupObj.addNode(this.selectedNodeIndex, 'new_node')) {
                setTimeout(this.drawTree(this.treeGroupObj), 1000);    
            }            
        } else{
            console.log('Select a node first !!!');
        }
    }
    removeNodeClickFunc () {
        console.log('Remove node clicked');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {        
            if(this.treeGroupObj.removeNode(this.selectedNodeIndex)){
                setTimeout(this.drawTree(this.treeGroupObj), 1000);    
            }
        } else{
            console.log('Select a node first !!!');
        }
    }
    editNodeClickFunc () {
        console.log('Edit button clicked!!');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {
            let oldLabel = this.treeGroupObj.getNodeLabelWithProperties(this.selectedNodeIndex);
            let newLabel = prompt('Please enter a new node label: ',oldLabel);
            if(newLabel != null){
                var results = this.treeGroupObj.setNodeLabelWithProperties(this.selectedNodeIndex, newLabel);
                if(results[0] || results[1]){
                    alert('Error occurred in parsing. The old values are retained. Please make sure that syntax is correct !!!');
                }
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
            if(this.treeGroupObj.leftShift(this.selectedNodeIndex)){
                setTimeout(this.drawTree(this.treeGroupObj), 1000);    
            }
        } else{
            console.log('Select a node first !!!');
        }
    }
    moveRightClickFunc (){
        console.log('Move right clicked');
        event.stopImmediatePropagation();
        if (this.selectedNodeIndex != undefined) {
            if(this.treeGroupObj.rightShift(this.selectedNodeIndex)){
                setTimeout(this.drawTree(this.treeGroupObj), 1000);    
            }
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
        this.treeGroupObj.selectedIndex = edgeId['v'];
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
                        if(this.treeGroupObj.addEdge(this.parentNodeIndex, this.selectedNodeIndex,'')){
                            setTimeout(this.drawTree(this.treeGroupObj), 1000);            
                        }
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
            if(this.treeGroupObj.removeEdge(this.selectedEdgeIndex['v'], this.selectedEdgeIndex['w'])){
                setTimeout(this.drawTree(this.treeGroupObj), 1000);    
            }
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
                if(this.treeGroupObj.setEdgeLabel(this.selectedEdgeIndex['w'], newLabel)){
                    setTimeout(this.drawTree(this.treeGroupObj), 1000);    
                }
            }
        } else{
            console.log('Select an edge first !!!');
        }    
    }

    undoClickFunc (){
        console.log('Undo clicked!!');
        event.stopImmediatePropagation();
        if(this.treeGroupObj.undo()){
            setTimeout(this.drawTree(this.treeGroupObj), 1000);        
        }
        
    }

    redoClickFunc (){
        console.log('Redo clicked!!');
        event.stopImmediatePropagation();
        if(this.treeGroupObj.redo()){
            setTimeout(this.drawTree(this.treeGroupObj), 1000);        
        }
    }
    
    saveImageClickFunc (){
        
        function readElement(ParentNode, OrigData){
            var ContainerElements = ["svg","g"];
            var RelevantStyles = {"rect":["fill","stroke","stroke-width"],
                              "path":["fill","stroke","stroke-width"],
                              "circle":["fill","stroke","stroke-width"],
                              "line":["stroke","stroke-width"],
                              "text":["fill","font-size","text-anchor"],
                              "polygon":["stroke","fill"]};



            var Children = ParentNode.childNodes;
            var OrigChildDat = OrigData.childNodes;     

            for (var cd = 0; cd < Children.length; cd++){
                var Child = Children[cd];

                var TagName = Child.tagName;
                if (ContainerElements.indexOf(TagName) != -1){
                    readElement(Child, OrigChildDat[cd])
                } else if (TagName in RelevantStyles){
                    var StyleDef = window.getComputedStyle(OrigChildDat[cd]);

                    var StyleString = "";
                    for (var st = 0; st < RelevantStyles[TagName].length; st++){
                        StyleString += RelevantStyles[TagName][st] + ":" + StyleDef.getPropertyValue(RelevantStyles[TagName][st]) + "; ";
                    }

                    Child.setAttribute("style",StyleString);
                }
            }

        }
        
        //The SVG derived also contains accessory button images of selected node.
        // In order to avoid that, it is important to deselect the current node
        // Get the SVG and select the node back
        
        // Get the selected node parameters
        var tempNode = this.selectedNode;
        var tempNodeId = this.selectedNodeIndex;
        
        // Clear the nodes and edges
        this.clearNodeVariables();
        this.clearEdgeVariables();
        
        console.log('Save Image Function clicked!!');
        event.stopImmediatePropagation();

        //Get the SVG reference
        var svgElement = d3.select("#"+this.domElementId+" .drawing_area");
        svgElement = svgElement._groups[0][0];
        
        // Get the copy of SVG Element including the CSS style 
        // This is mandatory for a Good looking UI
        var oDOM = svgElement.cloneNode(true);
        readElement(oDOM, svgElement);
    
        // Serialize by XML and create a Blob object of type svg and xml
        // Download the content using link download
        var svgData = new XMLSerializer().serializeToString(oDOM);
        var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "newesttree.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink); 
        
        // Select the node or edge after extract SVG image
        //here we pass only two arguments which is taken care of
        this.selectNodeFunc(tempNodeId, tempNode);
        
    }
    
    fullScreenClickFunc (){
        var parseTreeEditor =  this.guiElement.querySelector(".parse_text_editor");
        if(parseTreeEditor){
            var currentDisplayStatus = parseTreeEditor.style.display;
            if(currentDisplayStatus == 'none'){
                // this will make the bootstrap to take over
                parseTreeEditor.style.display = '';
            }
            else{
                parseTreeEditor.style.display='none';        
            }
        }
    }
    
    
}
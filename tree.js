class Tree {

    constructor(inputTree=undefined) {
        this.tree = inputTree;
        this.history = [];
        this.redo_history = [];
        this.active_history = this.history;
        this.isUndoRedoAction = false;
    }

    findNode(nodeId) {
        //nodeId will be like for e.g. 1.3.2.1
        //Since we are dealing with only one tree. We can ignore the first index
        //The subsequent number will specify the index of the childnode of rootnode. (They also start from 1)
        
        let nodeStrPath = nodeId.split('.'); //gives out an array of individual strings
        let nodeDigitsPath = nodeStrPath.map(Number); //converts all the strings to numbers
        let treeId = nodeDigitsPath.shift() - 1; // Removes the left most digit. Subtract by 1 to get the treeId since nodeId starts from 1
        let indexList = [treeId]; // stores all the indexes. Starts with tree index
        let node = this.tree; 
        let i;
        while ((i = nodeDigitsPath.shift()) !== undefined) {
            if (i > node.children.length) {
                console.log('Path: ${nodeId} was not found');
                return [undefined,[]];
            }
            node = node.children[i-1]; // here minus 1 refers to the index of childnode
            indexList.push(i-1);
        }
        return [node,indexList]; // the node element and index of the element with respect to parent
    }
    
    isRoot(nodeId){
        let node_constituents = nodeId.split('.');
        return node_constituents.length === 1;
    }
    
    hasNodeLeft(nodeId){
        //find the  node
        let result = this.findNode(nodeId);
        let node = result.shift();
        if(node === undefined){
            //console.error('Node was not found!');
            return;
        }
        
        //Check for root node
        if(this.isRoot(nodeId)){
            //console.warn('The selected node is the root node. Nothing is changed!');
            return;
        }
        
        let indexList = result.shift();
        let treeIndex = indexList[0];
        let nodeIndex = indexList.slice(-1)[0]
        
        let parent = node.parent;
                
        //Check whether it is the only node and check whether it is the left most node
        return (nodeIndex !== 0);
    }    
    hasNodeRight(nodeId){
        //find the  node
        let result = this.findNode(nodeId);
        let node = result.shift();
        if(node === undefined){
            //console.error('Node was not found!');
            return;
        }
        
        //Check for root node
        if(this.isRoot(nodeId)){
            //console.warn('The selected node is the root node. Nothing is changed!');
            return;
        }
        
        let indexList = result.shift();
        let treeIndex = indexList[0];
        let nodeIndex = indexList.slice(-1)[0]
        
        let parent = node.parent;
                
        //Check whether it is the only node and check whether it is the right most node
        
        return (nodeIndex !== (parent.children.length - 1));
    }
    hasParentNode(nodeId){
        //find the  node
        let result = this.findNode(nodeId);
        let node = result.shift();
        if(node === undefined){
            //console.error('Node was not found!');
            return;
        }
        
        //check for non-root node. If so then they have a parent
        return !this.isRoot(nodeId);
    }
    
    getEdgeLabel(nodeId) {
        //find the  node
        let node = this.findNode(nodeId)[0];
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        let label = node.gf;
        return label;
    }
    setEdgeLabel(nodeId, label='') {
        //find the  node
        let node = this.findNode(nodeId)[0];
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        let old_label = node.gf;
        node.gf = label;
        
        this.active_history.push([this.setEdgeLabel, this, [nodeId, old_label]]);
        this.clearRedoList();
    }
    
    leftShift(nodeId) {
        //find the  node
        let result = this.findNode(nodeId);
        let node = result.shift();
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        
        //Check for root node
        if(this.isRoot(nodeId)){
            console.warn('The selected node is the root node. Nothing is changed!');
            return;
        }
        
        let indexList = result.shift();
        let treeIndex = indexList[0];
        let nodeIndex = indexList.slice(-1)[0]
        
        let parent = node.parent;
        //Check whether it is the only node and check whether it is the left most node
        if (parent.children.length == 1) {
            console.warn('Parent node: ${parent.label} contains only one child. Nothing is changed!');
            return;
        } else if (nodeIndex === 0) {
            console.warn('The selected node is already thge leftmost child of: ${parent.label}. Nothing is changed!');
            return;
        }
        
        //Removes the respective node from parent list
        //Splice 2nd argument 1 means remove only one value
        let child = parent.children.splice(nodeIndex, 1)[0];
        //Adds the element in the parent list with an index -1
        //Splice 2nd argument 0 means don't remove any value, 3rd argument adds the child
        parent.children.splice(nodeIndex - 1, 0, child);
        
        this.numerate(treeIndex);
        this.active_history.push([this.rightShift, this, [child.id]]);
        this.clearRedoList();
    }
    rightShift(nodeId) {
        //find the  node
        let result = this.findNode(nodeId);
        let node = result.shift();
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        
        //Check for root node
        if(this.isRoot(nodeId)){
            console.warn('The selected node is the root node. Nothing is changed!');
            return;
        }
        
        let indexList = result.shift();
        let treeIndex = indexList[0];
        let nodeIndex = indexList.slice(-1)[0]
        
        let parent = node.parent;
        //Check whether it is the only node and check whether it is the right most node
        if (parent.children.length == 1) {
            console.warn('Parent node: ${parent.label} contains only one child. Nothing is changed!');
            return;
        } else if (nodeIndex === (parent.children.length - 1)) {
            console.warn('The selected node is already thge rightmost child of: ${parent.label}. Nothing is changed!');
            return;
        }
        
        //Removes the respective node from parent list
        //Splice 2nd argument 1 means remove only one value
        let child = parent.children.splice(nodeIndex, 1)[0];
        //Adds the element in the parent list with an index +1
        //Splice 2nd argument 0 means don't remove any value, 3rd argument adds the child
        parent.children.splice(nodeIndex + 1, 0, child);
        
        this.numerate(treeIndex);
        this.active_history.push([this.leftShift, this, [child.id]]);
        this.clearRedoList();
    }

    addNode(parentId, label) {
        //find the  node
        let node = this.findNode(parentId)[0];
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        
        let addedNodeId = addNode(node, {label: label, gf:''});
        this.active_history.push([this.removeNode, this, [addedNodeId]]);
        this.clearRedoList();
    }
    addNodeAt(parentId, index, childNode) {
        let result = this.findNode(parentId);
        let node = result.shift();
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        
        let indexList = result.shift();
        let treeIndex = indexList[0];
        
        node.children.splice(index, 0, childNode);
        childNode.parent = node;
        
        this.numerate(treeIndex);
        this.active_history.push([this.removeNode, this, [childNode.id]]);
        this.clearRedoList();
    }
    
    removeNode(nodeId) {
        //find the  node
        let result = this.findNode(nodeId);
        let node = result.shift();
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        
        let indexList = result.shift();
        let treeIndex = indexList[0];
        let nodeIndex = indexList.slice(-1)[0]
        
                
        let parent = node.parent;
        if(parent){
            let deletedNode = parent.children.splice(nodeIndex, 1)[0];
            let node_label = deletedNode.label;
            //Numerating from the current tree is suffice
            this.numerate(treeIndex);
            
            this.active_history.push([this.addNodeAt, this, [parent.id, nodeIndex, deletedNode]])
            this.clearRedoList();
        } else{
            console.warn('Dont remove the root node!');
        } 
    }  
    getNodeLabel(nodeId) {
        //find the  node
        let node = this.findNode(nodeId)[0];
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        let label = node.label;
        return label;
    }
    setNodeLabel(nodeId, label='') {
        //find the  node
        let node = this.findNode(nodeId)[0];
        if(node === undefined){
            console.error('Node was not found!');
            return;
        }
        let old_label = node.label;
        node.label = label;
        
        this.active_history.push([this.setNodeLabel, this, [nodeId, old_label]]);
        this.clearRedoList();
    }

    undo() {
        //pop the operation from history and perform.
        //Before performing assign the active history as redo history . 
        //So that all reactions for operation will be logged in redo history.
        //Assign the active history back to undo history
        let operation = this.history.pop();
        if (operation !== undefined) {
            this.active_history = this.redo_history;
            this.isUndoRedoAction = true;
            Reflect.apply.apply(null, operation);
            this.isUndoRedoAction = false;
            this.active_history = this.history;
        }
    }
    redo() {
        //pop the operation from redo history and perform.
        let operation = this.redo_history.pop();
        if (operation !== undefined) {
            this.isUndoRedoAction = true;
            Reflect.apply.apply(null, operation);
            this.isUndoRedoAction = false;
        }
    }
    clearRedoList(){
        if(!this.isUndoRedoAction && this.redo_history.length > 0){
            this.redo_history=[];
        }
    }
    
    numerate(newId='1', node=this.tree){
        
        // Change the current node to new Id
        node.id = newId.toString();
        // Enumerate through the children and set their Ids based on new Id
        let children = node.children;
        if (children) {
            //let childrenId  = newId*10 + 1;
            let childrenId  = 1;
            for (let j in children) {
                let child = children[j];
                this.numerate(newId+'.'+childrenId, child);
                childrenId = childrenId + 1;
            }
        }
    }
}

// append a new child to the parent and set backreference child.parent
function addNode(parent, child, rootId = 1) {
    if (parent) {
        if (!parent.hasOwnProperty('children')) {
            parent.children = [];
        }
        parent.children.push(child);
        child.parent = parent;
        //child.id = (parent.id * 10 + parent.children.length).toString();
        child.id = (parent.id + '.' + parent.children.length).toString();
    } else {
        child.id = rootId.toString();
    }
    if (!child.hasOwnProperty('class')) {
        child.class = [];
    }
    child.class.push('type-' + child.id);
    return child.id;
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

function tree2str(tree, level = 0){
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
            result += '\n' + spacing + tree2str(children[i], level + 1);
        }
    } else {
        result += ' ' + tree2str(children[0], level);
    }
    return result + ')';
}

/*
    (TOP (SIMPX-NONE/nohead (VF-NONE/nohead (NX-ON (PPER-HD Es)))(LK-NONE (VXFIN-HD (VAFIN-HD ist)))(MF-NONE/nohead (NX-OA (ART-NONE eine)(ADJX-NONE (ADJA-HD schöne))(NN-HD Frau)))))
    transforms parse string in bracketing format (as above) to an object
 */
function parseBrackets(brackets) {
    
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
        node.gf='';
        
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
    
    //For this parser to work there should atleast a ROOT, a pre-terminal and terminal such as below
    // (VROOT (a b)) - here VROOT is the root, a is the pre-terminal and b is the terminal
    // Extending the simple example
    // (VROOT (a (b c))) - here VROOT is the root, a is the non-terminal,b is the pre-terminal, 
    // and c is the terminal
    
    // Iterate through the text, creates nodes and put them in hierarchy as per the 
    // position of '(' and ')' paranthesis
    let unmatched_brackets = 0;
    let parentobj = null;
    let node = '';
    for (let i in brackets) {
        let ch = brackets.charAt(i);

        switch (ch) {
            case '(':
                unmatched_brackets += 1;
                //remove the spaces from both sides
                node = node.trim();
                // At the very first time this will be empty.
                if (!isEmpty(node)) {
                    // The extract content is a non-terminal since it does have children - (will be extracted using ')' paranthesis)
                    let nonterminal = parseNonterminal(node);
                    // Add the extracted non-terminal under parentObj (which can be ROOT or other non-terminals)
                    addNode(parentobj, nonterminal);
                    parentobj = nonterminal;
                    node = '';
                }
                break;
            case ')':
                unmatched_brackets -= 1;
                //remove the spaces from both sides
                node = node.trim();
                // At the end of nodes with atleast one level of hierarchy - this will be empty.
                // In that case choose the parent 
                if (!isEmpty(node)) {
                    let termArray = node.split(/\s+/);
                    if (termArray.length > 1) {
                        const preterm = parsePreterminal(termArray[0]);
                        const term = termArray.slice(1).join(' ').trim();
                        addNode(parentobj, preterm);
                        addNode(preterm, {label: term, class: ["type-PRETERM"]});
                    }
                    node = '';
                } else {
                    if (unmatched_brackets) { // top element has no parent
                        parentobj = parentobj.parent;
                    }
                }
                break;
                // Collect the content untill we encounter '(' or ')'
            default:
                node += ch;
        }
    }
    console.assert(unmatched_brackets === 0);
    return parentobj;
}


//TBD
//When trees are redrawn - Should this library be handling what is the current selectedNode and where has it gone
// It looks more of a UI operation but it is impossible to do it in UI layer


//TBD Loading  and Serialization, creation of Graphlib nodes need to be moved to a separate class

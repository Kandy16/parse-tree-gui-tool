class Tree {
    constructor(tree) {
        this.trees = [];
        this.trees.push(tree);
        this.history = [];
        this.redo_history = [];
        this.active_history = this.history;
    }

    findNode(nodeId) {
        //nodeId will be like 1321...
        // The first number will specify the tree and also the root node (It starts from 1)
        //The subsequent number will specify the index of the childnode. (They also start from 1)
        
        let nodeStrPath = nodeId.split(''); //gives out an array of individual characters
        let nodeDigitsPath = nodeStrPath.map(Number); //converts all the characters to numbers
        let nodeIndex = nodeDigitsPath[nodeDigitsPath.length-1] - 1; // get the final child index
        console.log('Inside findNode nodeindex - ',nodeIndex);
        let treeId = nodeDigitsPath.shift() - 1; // Removes the left most digit. Subtract by 1 to get the treeId since nodeId starts from 1
        let tree = this.trees[treeId]; 
        let node = tree; 
        let i;
        while ((i = nodeDigitsPath.shift()) !== undefined) {
            if (i > node.children.length) {
                console.log(`Path: ${nodeId} was not found`);
                return undefined,nodeIndex;
            }
            node = node.children[i-1]; // here minus 1 refers to the index of childnode
            //nodeIndex = i-1;
        }
        console.log(node);
        return [node,nodeIndex];
    }

    setEdgeLabel(nodeId, label) {
        let node = this.findNode(nodeId)[0];
        let old_label = node.gf;
        node.gf = label;
        
        this.active_history.push([this.setEdgeLabel, this, [nodeId, old_label]]);
    }

    addEdge(parentId, childId, label = undefined) {
        let parent = findNode(parentId)[0];
        let childDigitsPath = childId.split('').map(Number);
        let childTreeId = childDigitsPath.shift() - 1;
        let child = this.trees.splice(childTreeId, 1)[0];
        if (childDigitsPath === undefined) {
            console.error(`Node ${child.label} was not found!`);
            return;
        } else if (childDigitsPath.length != 0 || child.parent !== undefined) {
            console.warn(`Node ${child.label} has already an incoming edge. Remove this edge first!`);
            return;
        }
        parent.children.push(child);
        child.parent = parent;
        if (label !== undefined) {
            child.gf = label;
        }
        let parentDigitsPath = parentId.split('').map(Number);
        let parentTreeId = childDigitsPath.shift() - 1;
        let parentTree = this.trees[parentTreeId];
        numerateTree(parentTree, parentTreeId + 1);
        // TODO: add history here
    }

    removeEdge(parentId, childId) {
        if (childId.indexOf(parentId) !== -1) {
            console.error(`Wrong parent id: ${parentId} and child id: ${childId}`);
            return;
        }
        let parent = findNode(parentId)[0];
        let childDigitsPath = childId.split('').map(Number);
        let childIndex = childDigitsPath.pop() - 1;
        let child = parent.children.splice(childIndex, 1)[0];
        child.parent = undefined;
        numerateTree(child, this.trees.length);
        this.trees.push(child);
        // TODO: add history here
    }

    leftShift(nodeId) {
        let nodeIndex = Number(nodeId.slice(-1)) - 1;
        let parent = this.findNode(nodeId.slice(0,-1))[0];
        if (parent.children.length == 1) {
            console.warn(`Parent node: ${parent.label} contains only one child. Nothing is changed!`);
            return;
        } else if (nodeIndex == 0) {
            console.warn(`The selected node is already thge leftmost child of: ${parent.label}. Nothing is changed!`);
            return;
        }
        let child = parent.children.splice(nodeIndex, 1)[0];
        parent.children.splice(nodeIndex - 1, 0, child);
        let parentTreeId = Number(nodeId.slice(0, 1)) - 1;
        let parentTree = this.trees[parentTreeId];
        numerateTree(parentTree, parentTreeId + 1);
        this.active_history.push([this.rightShift, this, [child.id.toString()]]);
    }

    rightShift(nodeId) {
        let nodeIndex = Number(nodeId.slice(-1)) - 1;
        let parent = this.findNode(nodeId.slice(0,-1))[0];
        if (parent.children.length == 1) {
            console.warn(`Parent node: ${parent.label} contains only one child. Nothing is changed!`);
            return;
        } else if (nodeIndex == parent.children.length - 1) {
            console.warn(`The selected node is already the rightmost child of: ${parent.label}. Nothing is changed!`);
            return;
        }
        let child = parent.children.splice(nodeIndex, 1)[0];
        parent.children.splice(nodeIndex + 1, 0, child);
        let parentTreeId = Number(nodeId.slice(0, 1)) - 1;
        let parentTree = this.trees[parentTreeId];
        numerateTree(parentTree, parentTreeId + 1);
        this.active_history.push([this.leftShift, this, [child.id.toString()]]);
    }

    addNode(parentId, label) {
        // Find the parent node and append the child
        // Appending will not change the Ids. Id sanity is maintained.
        let node = this.findNode(parentId)[0];
        console.log(node);
        if (node !== undefined) {
            let addedNodeId = addNode(node, {label: label});
            this.active_history.push([this.removeNode, this, [addedNodeId.toString()]])
        }
    }

    addNodeAt(parentId, label, index) {
        let node = this.findNode(parentId)[0];
        if (node !== undefined) {
            let addedNodeId = insertNode(node, {label: label}, index);
            
            //this.active_history.push([this.removeNode, this, [addedNodeId.toString()]]);
        }
    }

    removeNode(nodeId) {
        console.log("removeNode called");
        let result=  this.findNode(nodeId);
        let node = result[0];
        let node_index = result[1];
        console.log(node);
        if(node !== undefined){
            let parent = node.parent;
            let deletedNode = parent.children.splice(node_index, 1)[0];
            let node_label = deletedNode.label;
            
            //It is important to change all ids to maintain sanity
            this.changeAllIds();
            //this.active_history.push([this.addNodeAt, this, [parent.id.toString(), node_label, node_index]])
        } else{
            console.log('may the node is not found yet');
        }
        
        /*let nodeStrPath = nodeId.split('');
        let nodeDigitsPath = nodeStrPath.map(Number);
        let treeId = nodeDigitsPath.shift() - 1;

        let tree = this.trees[treeId];
        let node_index = nodeDigitsPath.pop() - 1;
        let parent = tree;
        let i;
        while ((i = nodeDigitsPath.shift()) !== undefined) {
            if (i > parent.children.length) {
                console.log(`Path: ${nodeId} was not found`);
                return;
            }
            parent = parent.children[i - 1];
        }

        if (parent !== undefined) {
            let node = parent.children.splice(node_index, 1)[0];
            let node_label = node.label;
            this.active_history.push([this.addNodeAt, this, [parent.id.toString(), node_label, node_index]])
        } else{
            console.log('may the node is not found yet')
        }*/
    }

    undo() {
        let operation = this.history.pop();
        if (operation !== undefined) {
            this.active_history = this.redo_history;
            Reflect.apply.apply(null, operation);
            this.active_history = this.history;
        }
    }

    redo() {
        let operation = this.redo_history.pop();
        if (operation !== undefined) {
            Reflect.apply.apply(null, operation);
        }
    }
    
    hasNodeLeft(nodeId){
        return Math.random() > 0.5;
    }
    
    hasNodeRight(nodeId){
        return Math.random() > 0.5;
    }
    
    changeAllIds(){
        function changeTreeIds(node, newId){
            // Change the current node to new Id
            node.id = newId;
            // Enumerate through the children and set their Ids based on new Id
            let children = node.children;
            if (children) {
                let childrenId  = newId*10 + 1;
                for (let j in children) {
                    let child = children[j];
                    changeTreeIds(child, childrenId);
                    childrenId = childrenId + 1;
                }
            }
        }
        
        console.log(this.trees);
        let treeId = 1;
        // Enumerate the tree one by one and set their ids in incremental fashion
        for(let i in this.trees){
            let tree = this.trees[i];
            changeTreeIds(tree, 1);
            treeId = treeId + 1;
        }
        console.log(this.trees);
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
        child.id = parent.id * 10 + parent.children.length;
    } else {
        child.id = rootId;
    }
    if (!child.hasOwnProperty('class')) {
        child.class = [];
    }
    child.class.push('type-' + child.id);
    return child.id;
}

// append a new child to the parent and set backreference child.parent
function insertNode(parent, child, at = 0, rootId = 1) {
    if (parent) {
        if (!parent.hasOwnProperty('children')) {
            parent.children = [];
        }
        parent.children.splice(at, 0, child);
        child.parent = parent;
        child.id = parent.id * 10 + parent.children.length;
    } else {
        child.id = rootId;
    }
    if (!child.hasOwnProperty('class')) {
        child.class = [];
    }
    child.class.push('type-' + child.id);
    return child.id;
}

// returns neat formatted string representation of a parse
function parse2str(tree, level = 0) {
    
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

function numerateTree(node, gorn = 0) {
    node.id = gorn;
    gorn *= 10;
    if (node.hasOwnProperty('children')) {
        children = node.children;
        for (let i = 0; i < children.length; i++) {
            numerateTree(children[i], gorn + (i + 1));
        }
    }
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
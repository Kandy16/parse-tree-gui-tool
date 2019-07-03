
class TreeGroup extends Tree{
    constructor(inputTree) {
        super();
        this.trees = [];
        this.trees.push(inputTree);
    }

    
    findNode(nodeId) {
        //nodeId will be like 1.3.2.1
        // The first number will specify the tree and also the root node (It starts from 1)
        //The subsequent number will specify the index of the childnode of rootnode. (They also start from 1)
        
        let nodeStrPath = nodeId.split('.'); //gives out an array of individual strings
        let nodeDigitsPath = nodeStrPath.map(Number); //converts all the strings to numbers
        let treeId = nodeDigitsPath.shift() - 1; // Removes the left most digit. Subtract by 1 to get the treeId since nodeId starts from 1
        let indexList = [treeId]; // stores all the indexes. Starts with tree index
        let tree = this.trees[treeId]; 
        let node = tree; 
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
    
    addTreeAt(index, childTree){
        this.trees.splice(index, 0, childTree);
        childTree.parent = undefined;
        
        this.numerate(); 
        this.active_history.push([this.removeNode, this, [childTree.id]]);
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

        } else{
            // if node is the root (complete tree is being removed)
            let deletedNode = this.trees.splice(treeIndex,1)[0];
            let node_label = deletedNode.label;
            //Numerating from the current tree is suffice
            this.numerate(treeIndex);
            
            this.active_history.push([this.addTreeAt, this, [treeIndex, deletedNode]])
        }
        this.clearRedoList();
    }

    addEdge(parentId, childId, label='') {
        // find the parentNode
        let parent = this.findNode(parentId)[0];
        if(parent === undefined){
            console.error('Source node was not found!');
            return;
        }
        
        //find the child node
        let child = this.findNode(childId)[0];
        if(child === undefined){
            console.error('Target node was not found!');
            return;
        }
        
        //Check whether the child is root node
        if (!this.isRoot(childId) || child.parent !== undefined) {
            console.warn('Target node ${child.label} has already an incoming edge. Remove this edge first!');
            return;
        }
        
        // Remove the child tree from tree list and add it under parent node
        let childTreeId = parseInt(childId) - 1;
        child = this.trees.splice(childTreeId, 1)[0];
        parent.children.push(child);
        child.parent = parent;
        if (label !== undefined) {
            child.gf = label;
        }
        
        // it is good numerate everything from scratch. 
        // Otherwise get the index of parent and child tree and take the least value
        this.numerate();
        this.active_history.push([this.removeEdge, this, [parent.id, child.id]]);
        this.clearRedoList();
        
    }
    removeEdge(parentId, childId) {
        if (parentId.indexOf(childId) !== -1) {
            console.error('Wrong parent id: ${parentId} and child id: ${childId}');
            return;
        }
        
         // find the parentNode
        let parent = this.findNode(parentId)[0];
        if(parent === undefined){
            console.error('Source node was not found!');
            return;
        }
        
        //find the child node
        let result = this.findNode(childId);
        let child = result.shift();
        if(child === undefined){
            console.error('Target node was not found!');
            return;
        }
        
        let nodeIndex = result.shift().slice(-1)[0];
        // Remove the child from parent list and add it to tree list
        child = parent.children.splice(nodeIndex, 1)[0];
        child.parent = undefined;
        this.trees.push(child);
        
        // it is good numerate everything from scratch. 
        // Otherwise get the index of parent and child tree and take the least value
        this.numerate();
        this.active_history.push([this.addEdgeAt, this, [parent.id, nodeIndex, child.id]]);
        this.clearRedoList();
    }
    addEdgeAt(parentId, index, childId){
        // find the parentNode
        let parent = this.findNode(parentId)[0];
        if(parent === undefined){
            console.error('Source node was not found!');
            return;
        }
        
        //find the child node
        let child = this.findNode(childId)[0];
        if(child === undefined){
            console.error('Target node was not found!');
            return;
        }
        
        //Check whether the child is root node
        if (!this.isRoot(childId) || child.parent !== undefined) {
            console.warn('Target node ${child.label} has already an incoming edge. Remove this edge first!');
            return;
        }
        // Remove the child tree from tree list and add it under parent node
        // Since this has to be a root node - parseInt can be applied directly.
        // Otherwise split based on . and convert them to numbers and use it
        
        let childTreeId = parseInt(childId) - 1;
        child = this.trees.splice(childTreeId, 1)[0];
        
        parent.children.splice(index, 0, child);
        child.parent = parent;
        
        // it is good numerate everything from scratch. 
        // Otherwise get the index of parent and child tree and take the least value
        this.numerate();
        this.active_history.push([this.removeEdge, this, [parent.id, child.id]]);
        this.clearRedoList();
    }
    
    numerate(treeId=1){
        
        function numerateTree(newId='1', node=this.tree){
            console.log('Numerate from Tree is executing !');

            // Change the current node to new Id
            node.id = newId.toString();
            // Enumerate through the children and set their Ids based on new Id
            let children = node.children;
            if (children) {
                //let childrenId  = newId*10 + 1;
                let childrenId  = 1;
                for (let j in children) {
                    let child = children[j];
                    numerateTree(newId+'.'+childrenId, child);
                    childrenId = childrenId + 1;
                }
            }
        }

        if(treeId <= 0){
            treeId = 1;
        }
        // Enumerate the tree one by one and set their ids in incremental fashion
        for(let i = treeId; i<=this.trees.length;i++){
            numerateTree(i, this.trees[i-1]);
        }
    }

}

// returns neat formatted string representation of a parse
function treeGroup2str(treeGroup) {
    resultVal = '';
    console.log('Inside treeGroup 2 str',treeGroup);
    if (treeGroup.trees) {
        for (let i in treeGroup.trees) {
            let tree = treeGroup.trees[i];
            resultVal += tree2str(tree) + '\n\n'; 
        }
    }
    
    return resultVal;
}
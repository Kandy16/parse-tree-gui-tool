class Graph {
    constructor(tree) {
        this.trees = [];
        this.trees.push(tree);
        this.history = [];
        this.redo_history = []
        this.active_history = this.history;
    }


    findNode(nodeId) {
        let nodeStrPath = nodeId.split('');
        let nodeDigitsPath = nodeStrPath.map(Number);
        let treeId = nodeDigitsPath.shift() - 1;

        let tree = this.trees[treeId];
        let node = tree;
        let i;
        while ((i = nodeDigitsPath.shift()) !== undefined) {
            if (i > node.children.length) {
                console.log(`Path: ${nodeId} was not found`);
                return;
            }
            node = node.children[i - 1];
        }
        return node
    }

    addEdge(parentId, childId, label = undefined) {

    }

    removeEdge(parentId, childId) {

    }

    leftShift(nodeId) {

    }

    rightShift(nodeId) {

    }

    addNode(parentId, label) {
        let node = this.findNode(parentId);
        if (node !== undefined) {
            let addedNodeId = addNode(node, {label: label});
            this.active_history.push([this.removeNode, this, [addedNodeId.toString()]])
        }
    }

    addNodeAt(parentId, label, index) {
        let node = this.findNode(parentId);
        if (node !== undefined) {
            let addedNodeId = insertNode(node, {label: label}, index);
            this.active_history.push([this.removeNode, this, [addedNodeId.toString()]]);
        }
    }

    removeNode(nodeId) {
        console.log("removeNode called");
        let nodeStrPath = nodeId.split('');
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
        }
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

// function numerateTree(node, gorn = 0) {
//     node.id = gorn;
//     gorn *= 10;
//     if (node.hasOwnProperty('children')) {
//         children = node.children;
//         for (let i = 0; i < children.length; i++) {
//             numerateTree(children[i], gorn + (i + 1));
//         }
//     }
// }

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
                    addNode(parentobj, nonterminal);
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
            default:
                node += ch;
        }
    }
    console.assert(unmatched_brackets === 0);
    // console.log(parentobj);
    return parentobj;
}
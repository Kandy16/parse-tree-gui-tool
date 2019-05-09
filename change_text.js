window.getlocalmousecoord = function (svg, evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    var localpoint = pt.matrixTransform(svg.getScreenCTM().inverse());
    localpoint.x = Math.round(localpoint.x);
    localpoint.y = Math.round(localpoint.y);
    return localpoint;
};

window.edittext = function (localpoint, svg, dest, text) {
    if(dest) {
        dest.setAttribute('display', 'none');
    }
    var myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    var textdiv = document.createElement("div");
    text = text || "type on me";
    var textnode = document.createTextNode(text);
    textdiv.appendChild(textnode);
    textdiv.setAttribute("contentEditable", "true");
    textdiv.setAttribute("width", "auto");
    myforeign.setAttribute("width", "100%");
    myforeign.setAttribute("height", "100%");
    myforeign.classList.add("foreign"); //to make div fit text
    textdiv.classList.add("insideforeign"); //to make div fit text
    myforeign.setAttributeNS(null, "transform", "translate(" + localpoint.x + " " + localpoint.y + ")");
    svg.appendChild(myforeign);
    myforeign.appendChild(textdiv);
        
    var range = document.createRange();
    range.selectNodeContents(textdiv);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    function accept() {
        console.log('accept')
        if(textdiv.innerText.length) {
            if(dest) {
                dest.childNodes[0].nodeValue = textdiv.innerText;
                dest.setAttribute('display', 'inline-block')
            } else {
                var svgtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                svgtext.appendChild(document.createTextNode(textdiv.innerText));
                svgtext.setAttribute("x", localpoint.x);
                svgtext.setAttribute("y", localpoint.y);
                svg.appendChild(svgtext);
            }
        } else if(dest) {
            dest.remove();
        }
        textdiv.onblur = null;
        myforeign.remove()
    }
    function cancel() {
        if(dest) {
          	dest.setAttribute('display', 'inline-block')            
        }
        textdiv.onblur = null;
        myforeign.remove()
    }
    
    textdiv.onkeydown = function(event) {
        if(event.keyCode===13) {
            accept();
        } else if(event.keyCode===27) {
            cancel();
        }
    }
    textdiv.onblur = cancel;

    textdiv.focus();
};
/*
var svg = document.getElementById('svg-canvas');
$('#svg-canvas').click(function (evt) {
    var localpoint, text, dest;
    if(evt.target.tagName === 'text') {
        dest = evt.target;
        localpoint = {x: dest.getAttribute("x"), y: dest.getAttribute("y")};
        text = dest.childNodes[0].nodeValue;
    } else if(evt.target.tagName === 'svg') {
        text = null;
      	localpoint = getlocalmousecoord(svg, evt);
    }
    else {
    }
    console.log('Event : ',evt)
    console.log('Local Point : ',localpoint)
    //return;
    //edittext(localpoint, svg, dest, text);
});
*/
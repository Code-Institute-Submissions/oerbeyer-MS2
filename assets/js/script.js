document.addEventListener("DOMContentLoaded", function() {
    
    // JS test
    let body = document.getElementsByTagName('body')[0]
    JSTest(body);
    
    body.append(document.createElement('br'));

    // JQuery test
    JQueryTest($('body'));
})

/**
 * Function to test if JS is working.
 */
function JSTest(target) {   
    let span = document.createElement("span");
    span.innerHTML = "JS test pass";
    target.appendChild(span);
}

/**
 * Function to test if JQuery is working.
 */
function JQueryTest(target) {
    target.append('<span>JQuery test pass</span>');
}






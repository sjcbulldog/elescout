let status_top = undefined ;
let status_content = undefined ;
let status_close = undefined ;
let status_span = undefined ;
let status_text = undefined ;
let status_title = undefined ;

function statusCreate() {
    status_top = document.createElement('div') ;
    status_top.id = "status" ;
    status_top.style.bo
    $("#righttop").append(status_top) ;

    status_content = document.createElement('div') ;
    status_content.id = "modalcontent" ;
    status_top.append(status_content) ;

    status_span = document.createElement('span') ;
    status_content.append(status_span) ;
    status_span.id = 'close' ;
    status_span.innerHTML = '&times;'
    status_span.style.display = 'none' ;
    status_span.onclick = function() { statusHide() ; }

    status_title = document.createElement('p') ;
    status_title.id = "status-title" ;
    status_title.innerText = 'Title' ;
    status_content.append(status_title) ;    

    status_text = document.createElement('p') ;
    status_text.innerText = 'Text To Display' ;
    status_content.append(status_text) ;
}

function statusSetTitle(text) {
    status_text.innerText = text ;
}

function statusShow() {
    $('#status').show() ;
}

function statusHide() {
    $('#status').hide() ;
}

function statusSetText(text) {
    status_text.innerText = text ;
}

function statusGetText() {
    return status_text.innerText ;
}

function statusSetHTML(html) {
    status_text.innerHTML = html ;
}

function statusSetTitle(text) {
    status_title.innerText = text ;
}

function statusShowCloseButton(show) {
    if (show) {
        status_span.style.display = "block" ;
    }
    else {
        status_span.style.display = "none" ;
    }
}

window.scoutingAPI.receive("set-status-text", (args)=>statusSetText(args)) ;
window.scoutingAPI.receive("set-status-html", (args)=>statusSetHTML(args)) ;
window.scoutingAPI.receive("set-status-title", (args) => statusSetTitle(args)) ;
window.scoutingAPI.receive("set-status-visible", (args)=> { args ? statusShow() : statusHide() ; }) ;
window.scoutingAPI.receive("set-status-close-button-visible", (args)=>statusShowCloseButton(args)) ;
function emptyView(message) {
    $("#rightcontent").empty() ;

    let div = document.createElement("div") ;
    div.id = "empty-div"

    let span = document.createElement("span") ;
    span.id = "empty-span" ;
    while (message.indexOf('-') !== -1) {
        message = message.replace('-', '&#8209;') ;
    }
    span.innerHTML = "<b>" + message + "</b>" ;
    
    div.append(span);
    $("#rightcontent").append(div) ;
}

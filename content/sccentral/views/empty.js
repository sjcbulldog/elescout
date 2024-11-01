function emptyView() {
    $("#rightcontent").empty() ;

    let div = document.createElement("div") ;
    div.id = "empty-div"

    let span = document.createElement("span") ;
    span.id = "empty-span" ;
    span.innerHTML = "<b>No Event Loaded</b>" ;
    
    div.append(span);
    $("#rightcontent").append(div) ;
}

function emptyView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.id = "empty" ;
    div.innerHTML = "<b>No Project Loaded</b>" ;
    $("#rightcontent").append(div) ;
}

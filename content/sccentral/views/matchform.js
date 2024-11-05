function matchFormView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Info</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-match-form");
}

function updateMatchForm(obj) {
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    
    if (obj.errormsg.length > 0) {
        div.innerText = obj.errormsg ;
    }
    else {
        formViewJsonToForm(div, obj.formjson, 'match') ;
    }
}

window.scoutingAPI.receive("send-match-form", (args)=>updateMatchForm(args[0])) ;

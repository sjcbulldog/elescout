function teamFormView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Info</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-team-form");
}

function updateTeamForm(obj) {
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    
    if (obj.errormsg.length > 0) {
        div.innerText = obj.errormsg ;
    }
    else {
        formViewJsonToForm(div, obj.formjson, 'team') ;
    }
}

window.scoutingAPI.receive("send-team-form", (args)=>updateTeamForm(args[0])) ;

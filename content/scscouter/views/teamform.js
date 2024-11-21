let teamformdivtitle = undefined ;

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

    teamformdivtitle = document.createElement('div') ;
    teamformdivtitle.className = 'form-div-title' ;
    div.append(teamformdivtitle) ;

    let formdiv = document.createElement('div') ;
    div.append(formdiv) ;
    
    if (obj.errormsg.length > 0) {
        div.innerText = obj.errormsg ;
    }
    else {
        formViewJsonToForm(formdiv, obj.formjson, 'team') ;
        teamformdivtitle.innerText = obj.title ;
    }
}

window.scoutingAPI.receive("send-team-form", (args)=>updateTeamForm(args[0])) ;

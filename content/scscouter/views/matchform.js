let matchformdivtitle = undefined ;

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

    matchformdivtitle = document.createElement('div') ;
    matchformdivtitle.className = 'form-div-title' ;
    div.append(matchformdivtitle) ;

    let formdiv = document.createElement('div') ;
    div.append(formdiv) ;
    
    if (obj.errormsg.length > 0) {
        div.innerText = obj.errormsg ;
    }
    else {
        formViewJsonToForm(formdiv, obj.formjson, 'match') ;
        matchformdivtitle.innerText = obj.title ;
    }
}

window.scoutingAPI.receive("send-match-form", (args)=>updateMatchForm(args[0])) ;

function previewFormView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Preview Form</b>" ;
    div.id = "preview" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-preview-form");
}

function updatePreviewForm(obj) {
    $("#rightcontent").empty() ;
    let div = document.createElement('div') ;
    $("#rightcontent").append(div) ;
    
    if (obj.errormsg.length > 0) {
        div.innerText = obj.errormsg ;
    }
    else {
        formViewJsonToForm(div, obj.formjson, 'preview') ;
    }
}

window.scoutingAPI.receive("send-preview-form", (args)=>updatePreviewForm(args[0])) ;

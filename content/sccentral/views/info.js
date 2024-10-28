function infoView() {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.innerHTML = "<b>Info</b>" ;
    div.id = "info" ;
    $("#rightcontent").append(div) ;

    window.scoutingAPI.send("get-info-data");
}
// 
// public bakey_? : string ;
// public teamform? : string ;
// public matchform? : string ;
// public tablets_? : Tablets ;
// public teams_? : Team[] ;
// public matches_? : Match[] ;

function addbaykey(div, bakey) {
    let badiv = document.createElement('div') ;
    badiv.id = "info_bakey" ;

    if (bakey) {
        badiv.innerHTML = 'Blue Alliance Key: ' + bakey ;
    }
    else {
        badiv.innerHTML = 'Blue Alliance Key: NONE' ;
    }

    div.append(badiv) ;
}

function addteamform(div, teamform) {
}

function addmatchform(div, matchform) {

}

function addtablets(div, tablets) {

}

function addteams(div, teams) {

}

function addmatches(div, matches) {

}

function updateInfoView(info) {
    $("#rightcontent").empty() ;
    let div = document.createElement("div") ;
    div.id = "info_main" ;

    addbaykey(div, info.bakey_) ;
    addteamform(div, info.teamform_) ;
    addmatchform(div, info.matchform_) ;
    addtablets(div, info.tablets_) ;
    addteams(div, info.teams_) ;
    addmatches(div, info.matches_) ;
    
    $("#rightcontent").append(div) ;
}

window.scoutingAPI.receive("update-info", (args)=>updateInfoView(args)) ;

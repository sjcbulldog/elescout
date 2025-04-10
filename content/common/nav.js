let navelems = [] ;

async function updateNav() {
    window.scoutingAPI.send("get-nav-data");
}

function updateNavProcess(args) {
    $("#leftnav").empty();

    let navdata = args[0] ;
    navelems = [] ;

    if (navdata) {
        let nav = document.createElement("div");
        nav.className = "navlist";

        for (let item of navdata) {
            let navitem = document.createElement("p")
            navitem.command = item.command;
            if (item.type === "item") {
                navitem.className = "navlistitem";
                navitem.textContent = item.title;
                navelems.push(navitem) ;
            }
            else if (item.type === 'icon') {
                navitem.className = "navlistitem";
                let icon = document.createElement("img");
                icon.src = `data:image/jpg;base64,${item.icon}`
                icon.alt = item.title;
                icon.title = item.title;
                icon.width = item.width ;
                icon.height = item.height;
                navitem.appendChild(icon);
                navelems.push(navitem) ;
            }
            else if (item.type === "separator") {
                navitem.className = "navlistseparator" ;
                navitem.textContent = item.title ;
            }
            nav.append(navitem);
        }

        $("#leftnav").append(nav);

        $(".navlistitem").hover(
            function () {
                $(this).css("background-color", "#808080");
                $(this).css("color", "#ffffff");
            },
            function () {
                $(this).css("background-color", "#111");
                $(this).css("color", "#c0c0c0");
            }
        );

        $(".navlistitem").mousedown(function (event) {
            window.scoutingAPI.send("execute-command", this.command);
        });
    }
}

function highlightNavProcess(args) {
    for(let one of navelems) {
        if (one.command === args[0]) {
            one.style.border = "2px solid #808080" ;
        }
        else {
            one.style.border = "none" ;
        }
    }
}

window.scoutingAPI.receive("send-nav-data", (args)=>updateNavProcess(args)) ;
window.scoutingAPI.receive("send-nav-highlight", (args)=>highlightNavProcess(args)) ;



async function updateNav() {
    window.scoutingAPI.send("get-nav-data");
}

function updateNavProcess(args) {
    $("#leftnav").empty();

    let navdata = args[0] ;

    if (navdata) {
        let nav = document.createElement("div");
        nav.className = "navlist";

        for (let item of navdata) {
            let navitem = document.createElement("p")
            navitem.command = item.command;
            if (item.type === "item") {
                navitem.className = "navlistitem";
                navitem.textContent = item.title;
            }
            else if (item.type === "separator") {
                navitem.className = "navlistseparator" ;
                navitem.textContent = "---- " + item.title + " ----";
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

        $(".navlistitem").mousedown(function () {
            window.scoutingAPI.send("execute-command", this.command);
        });
    }
}

window.scoutingAPI.receive("send-nav-data", (args)=>updateNavProcess(args)) ;


async function updateTree() {
    window.scoutingAPI.send("get-tree-data");
}

function updateTreeProcess(treedata) {
    $("#lefttree").empty();

    if (treedata) {
        let tree = document.createElement("div");
        tree.className = "treelist";

        for (let item of treedata) {
            let treeitem = document.createElement("p")
            treeitem.command = item.command;
            if (item.type === "item") {
                treeitem.className = "treelistitem";
                treeitem.textContent = item.title;
            }
            else if (item.type === "separator") {
                treeitem.className = "treelistseparator" ;
                treeitem.textContent = "---- " + item.title + " ----";
            }
            tree.append(treeitem);
        }

        $("#lefttree").append(tree);

        $(".treelistitem").hover(
            function () {
                $(this).css("background-color", "#808080");
                $(this).css("color", "#ffffff");
            },
            function () {
                $(this).css("background-color", "#111");
                $(this).css("color", "#c0c0c0");
            }
        );

        $(".treelistitem").mousedown(function () {
            window.scoutingAPI.send("execute-command", this.command);
        });
    }
}

window.scoutingAPI.receive("update-tree", (args)=>updateTreeProcess(args)) ;

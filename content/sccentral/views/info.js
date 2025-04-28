class InfoView extends XeroView {
    static minRequiredNumberTeams = 18;

    constructor(div, viewtype) {
        super(div, viewtype);
        this.buildInitialView("Retreiving data for the info view, Please wait ....");
        this.registerCallback('send-info-data', this.formCallback.bind(this));
        this.scoutingAPI("get-info-data");
    }

    addlocation(info) {
        let row = document.createElement('tr');
        let loc = document.createElement('td');
        loc.id = "info_location"
        loc.innerText = info.location_;
        loc.colSpan = 3;
        row.append(loc);

        return row;
    }

    updateName() {
        this.scoutingAPI('set-event-name', this.evname_.innerText.trim());
    }

    addname(info) {
        let row = document.createElement('tr');

        let label = document.createElement('td');
        label.innerHTML = 'Name:  ';
        label.className = "info-table-cell";
        row.append(label);

        this.evname_ = document.createElement('td')
        this.evname_.className = "info-table-cell";
        this.evname_.innerHTML = (info.name_ ? info.name_ : 'NONE');
        this.evname_.oninput = this.updateName.bind(this) ;

        if (!info.baky_ && !info.locked_) {
            this.evname_.contentEditable = true;
        }

        row.append(this.evname_);
        return row;
    }

    adduuid(info) {
        let row = document.createElement('tr');

        let label = document.createElement('td');
        label.innerHTML = 'Id:  ';
        label.className = "info-table-cell";
        row.append(label);

        let evname = document.createElement('td')
        evname.className = "info-table-cell";
        evname.innerHTML = info.uuid_ ? info.uuid_ : 'NONE (created when locked)' ;

        row.append(evname);
        return row;
    }

    addbakey(info) {
        let row = document.createElement('tr');

        let label = document.createElement('td');
        label.innerHTML = 'Blue Alliance Key:  ';
        label.className = "info-table-cell";
        row.append(label);

        let value = document.createElement('td')
        value.className = "info-table-cell";
        value.innerHTML = (info.bakey_ ? info.bakey_ : 'NONE');
        row.append(value);

        if (info.teams_.length == 0 && info.matches_.length == 0 && !info.bakey_) {
            let cell = document.createElement('td');
            cell.className = "info-table-cell";
            row.append(cell);

            let button = document.createElement('button');
            cell.append(button);

            button.innerText = 'Load Event';
            button.onclick = () => { updateMainWindow("select-event") };
        }

        return row;
    }

    addteamform(info) {
        let row = document.createElement('tr');

        let label = document.createElement('td');
        label.innerHTML = 'Team Form:  ';
        label.className = "info-table-cell";
        row.append(label);

        let value = document.createElement('td');
        value.innerHTML = (info.teamform_ ? info.teamform_ : 'NONE');
        value.className = "info-table-cell";
        value.title = info.teamformfull_;
        row.append(value);

        let cell = document.createElement('td');
        cell.className = "info-table-cell";
        row.append(cell);

        if (!info.locked_) {
            let icon = document.createElement('img');
            icon.className = "info-table-icon-import";
            icon.src = `data:image/jpg;base64,${info.importicon}`
            icon.alt = 'Import' ;
            icon.title = 'Import' ;
            icon.width = 32 ;
            icon.height = 32 ;
            icon.onclick = () => { this.scoutingAPI('execute-command', 'select-team-form'); };
            cell.append(icon) ;
            
            icon = document.createElement('img');
            icon.className = "info-table-icon-create";
            icon.src = `data:image/jpg;base64,${info.createicon}`
            icon.alt = 'Create' ;
            icon.title = 'Create' ;
            icon.width = 32 ;
            icon.height = 32 ;
            icon.onclick = () => { this.scoutingAPI('execute-command', 'create-team-form'); };
            cell.append(icon) ;

            if (info.teamform_) {
                icon = document.createElement('img');
                icon.className = "info-table-icon-edit";
                icon.src = `data:image/jpg;base64,${info.editicon}`
                icon.alt = 'Edit' ;
                icon.title = 'Edit' ;
                icon.width = 32 ;
                icon.height = 32 ;
                icon.onclick = () => { this.scoutingAPI('execute-command', 'edit-team-form'); };
                cell.append(icon) ;                
            }
        }

        cell = document.createElement('td');
        if (info.teamform_) {
            cell.innerHTML = "&check;"
            cell.style.color = "green";
        }
        else {
            cell.innerHTML = "&cross;"
            cell.style.color = "red";
        }
        row.append(cell);

        return row;
    }

    addmatchform(info) {
        let row = document.createElement('tr');

        let label = document.createElement('td');
        label.innerHTML = 'Match Form:  ';
        label.className = "info-table-cell";
        row.append(label);

        let value = document.createElement('td');
        value.innerHTML = (info.matchform_ ? info.matchform_ : 'NONE');
        value.title = info.matchformfull_;
        value.className = "info-table-cell";
        row.append(value);

        let cell = document.createElement('td');
        cell.className = "info-table-cell";
        row.append(cell);

        if (!info.locked_) {
            let icon = document.createElement('img');
            icon.className = "info-table-icon-import";
            icon.src = `data:image/jpg;base64,${info.importicon}`
            icon.alt = 'Import' ;
            icon.title = 'Import' ;
            icon.width = 32 ;
            icon.height = 32 ;
            icon.onclick = () => { this.scoutingAPI('execute-command', 'select-match-form'); };
            cell.append(icon) ;
            
            icon = document.createElement('img');
            icon.className = "info-table-icon-create";
            icon.src = `data:image/jpg;base64,${info.createicon}`
            icon.alt = 'Create' ;
            icon.title = 'Create' ;
            icon.width = 32 ;
            icon.height = 32 ;
            icon.onclick = () => { this.scoutingAPI('execute-command', 'create-match-form'); };
            cell.append(icon) ;

            if (info.matchform_) {
                icon = document.createElement('img');
                icon.className = "info-table-icon-edit";
                icon.src = `data:image/jpg;base64,${info.editicon}`
                icon.alt = 'Edit' ;
                icon.title = 'Edit' ;
                icon.width = 32 ;
                icon.height = 32 ;
                icon.onclick = () => { this.scoutingAPI('execute-command', 'edit-match-form'); };
                cell.append(icon) ;                
            }       
        }

        cell = document.createElement('td');
        if (info.matchform_) {
            cell.innerHTML = "&check;"
            cell.style.color = "green";
        }
        else {
            cell.innerHTML = "&cross;"
            cell.style.color = "red";
        }
        row.append(cell);

        return row;
    }


    addtablets(info) {
        let row = document.createElement('tr');
    
        let label = document.createElement('td');
        label.innerHTML = 'Tablets:  ';
        label.className = "info-table-cell";
        row.append(label);
    
        let value = document.createElement('td')
        value.innerHTML = (info.tablets_ ? info.tablets_.length : 'NOT ASSIGNED');
        value.className = "info-table-cell";
        row.append(value);
    
        let cell = document.createElement('td');
        cell.className = "info-table-cell";
        row.append(cell);
    
        if (!info.locked_) {
            let button = document.createElement('button');
            cell.append(button);
    
            button.innerText = 'Assign Tablets';
            button.onclick = () => { this.scoutingAPI('execute-command', 'assign-tablets') };
        }
    
        cell = document.createElement('td');
    
        if (info.tablets_valid_) {
            cell.innerHTML = "&check;"
            cell.style.color = "green";
        }
        else {
            cell.innerHTML = "&cross;"
            cell.style.color = "red";
        }
        row.append(cell);
    
        return row;
    }
    
    addteams(info) {
        let row = document.createElement('tr');
    
        let label = document.createElement('td');
        label.innerHTML = 'Teams:  ';
        label.className = "info-table-cell";
        row.append(label);
    
        let value = document.createElement('td')
        value.innerHTML = (info.teams_ ? info.teams_.length : 'No Teams');
        value.className = "info-table-cell";
        row.append(value);
    
        let cell = document.createElement('td');
        cell.className = "info-table-cell";
        row.append(cell);
    
        if (!info.bakey_ && !info.locked_) {
            let button = document.createElement('button');
            cell.append(button);
    
            button.innerText = 'Edit Teams';
            button.onclick = () => { this.scoutingAPI('execute-command', 'edit-teams') };
        }
    
        cell = document.createElement('td');
        if (info.teams_ && info.teams_.length >= InfoView.minRequiredNumberTeams) {
            cell.innerHTML = "&check;"
            cell.style.color = "green";
        }
        else {
            cell.innerHTML = "&cross;"
            cell.style.color = "red";
        }
        row.append(cell);
    
        return row;
    }
    
    addmatches(info) {
        let row = document.createElement('tr');
    
        let label = document.createElement('td');
        label.innerHTML = 'Matches:  ';
        label.className = "info-table-cell";
        row.append(label);
    
        let value = document.createElement('td')
        value.className = "info-table-cell";
        value.innerHTML = (info.matches_ ? info.matches_.length : 'No Matches');
        row.append(value);
    
        let cell = document.createElement('td');
        cell.className = "info-table-cell";
        row.append(cell);
    
        if (!info.bakey_ && info.teams_ && info.teams_.length >= InfoView.minRequiredNumberTeams && !info.locked_) {
            let button = document.createElement('button');
            cell.append(button);
    
            button.innerText = 'Edit Matches';
            button.onclick = () => { this.scoutingAPI('execute-command', 'edit-matches') };
        }
    
        cell = document.createElement('td');
        if (info.matches_) {
            cell.innerHTML = "&check;"
            cell.style.color = "green";
        }
        else {
            cell.innerHTML = "&cross;"
            cell.style.color = "red";
        }
        row.append(cell);
    
        return row;
    }

    readyToLock(info) {
        return info.teams_ && info.teams_.length >= InfoView.minRequiredNumberTeams &&
            info.matchform_ && info.teamform_ && info.tablets_ && info.tablets_valid_;
    }
    
    addLocked(info) {
        let row = document.createElement('tr');
    
        let label = document.createElement('td');
        label.innerHTML = 'Locked:  ';
        label.className = "info-table-cell";
        row.append(label);
    
        let value = document.createElement('td')
        value.className = "info-table-cell";
        value.innerHTML = (info.locked_ ? "Locked" : "Unlocked");
        row.append(value);
    
        let cell = document.createElement('td');
        cell.className = "info-table-cell";
        row.append(cell);
    
        if (info.teams_ && info.teamform_ && info.matchform_ && !info.locked_) {
            let button = document.createElement('button');
            cell.append(button);
    
            button.innerText = 'Lock Event';
            button.onclick = () => {
                this.scoutingAPI('execute-command', 'lock-event')
            };
        }
    
        cell = document.createElement('td');
        if (info.locked_) {
            cell.innerHTML = "&#x1F512;";
            cell.style.color = "green";
        }
        else if (this.readyToLock(info)) {
            cell.innerHTML = "&#x1F513;";
            cell.style.color = "green";
        } else {
            cell.innerHTML = "&cross;"
            cell.style.color = "red";
        }
        row.append(cell);
    
        return row;
    }
    
    addGeneratorComment(info) {
        let row = document.createElement('tr');
        let label = document.createElement('td');
        if (!info.locked_) {
            label.innerHTML = 'Locking the event will generate the scouting schedule';
        }
        else {
            label.innerHTML = '';
        }
        label.className = "info-table-cell";
        label.colSpan = 3;
        label.style.textAlign = 'center';
        row.append(label);
    
        return row;
    }

    formCallback(args) {
        let row;

        this.reset();

        this.preview_div_ = undefined;
        this.main_div_ = document.createElement("div");
        this.main_div_.id = "info_main";

        this.table_ = document.createElement("table");
        this.table_.id = "info_table";
        this.main_div_.append(this.table_);

        let info = args[0];

        row = this.addlocation(info);
        this.table_.append(row);

        row = this.addname(info);
        this.table_.append(row);

        row = this.adduuid(info);
        this.table_.append(row);

        row = this.addbakey(info);
        this.table_.append(row);

        row = this.addteamform(info);
        this.table_.append(row);

        row = this.addmatchform(info);
        this.table_.append(row);

        row = this.addtablets(info);
        this.table_.append(row);
    
        row = this.addteams(info);
        this.table_.append(row);
    
        row = this.addmatches(info);
        this.table_.append(row);
    
        row = this.addLocked(info);
        this.table_.append(row);
    
        row = this.addGeneratorComment(info) ;
        this.table_.append(row) ;

        this.top_.append(this.main_div_);
    }
}
class AssignTablets extends XeroView {
    static tabletTeam = "team";
    static tabletMatch = "match";

    constructor(div, viewtype) {
        super(div, viewtype);
        this.frctablets_ = [] ;

        this.buildInitialView("Retreiving data for the tablet assignments, please wait ....");
        this.registerCallback('send-tablet-data', this.formCallback.bind(this));
        window.scoutingAPI.send("get-tablet-data");
    }

    doesTabletExist(name) {
        if (!this.frctablets_)
            return false;

        for (let tab of this.frctablets_) {
            if (tab.name === name)
                return true;
        }

        return false;
    }

    findNewTabletName() {
        let num = 1;
        let name;

        while (true) {
            name = "Tablet " + num;
            if (!this.doesTabletExist(name))
                break;
            num++;
        }

        return name;
    }

    addTablet() {
        let tabdata = {
            name: this.findNewTabletName(),
            purpose: undefined
        }

        if (!this.frctablets_) {
            this.frctablets_ = [];
        }

        this.frctablets_.push(tabdata);
        this.placeTablets();
    }

    createTabletsAvailable() {
        let div = document.createElement('div');

        let span = document.createElement('span');
        span.id = "assign-tablets-available-span";
        span.innerText = 'Available';
        div.append(span);

        let availholder = document.createElement('div');
        availholder.id = "assign-tablets-available-holder";
        div.append(availholder);

        return [div, availholder] ;
    }

    createMatchTablets() {
        let div = document.createElement('div');

        let span = document.createElement('span');
        span.id = "assign-tablets-match-span";
        span.innerText = 'Matches';
        div.append(span);

        let matchholder = document.createElement('div');
        matchholder.id = "assign-tablets-match-holder";
        matchholder.ondragover = this.allowDrop.bind(this);
        matchholder.ondrop = this.dropmatch.bind(this);
        div.append(matchholder);

        return [div, matchholder];
    }

    createTeamTablets() {
        let div = document.createElement('div');

        let span = document.createElement('span');
        span.id = "assign-tablets-team-span";
        span.innerText = 'Teams';
        div.append(span);

        let teamholder = document.createElement('div');
        teamholder.id = "assign-tablets-team-holder";
        teamholder.ondragover = this.allowDrop.bind(this);
        teamholder.ondrop = this.dropteam.bind(this);
        div.append(teamholder);

        return [div, teamholder];
    }

    allowDrop(ev) {
        ev.preventDefault();
    }

    startdrag(ev) {
        let tabname = ev.target.innerText;
        ev.dataTransfer.setData("text", tabname);
        ev.dataTransfer.dropEffect = "move";
    }

    setTabletToType(tablet, type) {
        if (this.frctablets_) {
            for (let i = 0; i < this.frctablets_.length; i++) {
                if (this.frctablets_[i].name === tablet) {
                    this.frctablets_[i].purpose = type;
                    break;
                }
            }
            this.placeTablets();
        }
    }

    dropmatch(ev) {
        ev.preventDefault();
        let tabname = ev.dataTransfer.getData("text");
        this.setTabletToType(tabname, AssignTablets.tabletMatch);
    }

    dropteam(ev) {
        ev.preventDefault();
        let tabname = ev.dataTransfer.getData("text");
        this.setTabletToType(tabname, AssignTablets.tabletTeam);
    }

    saveData() {
        this.frctablets_ = [];

        for (let t of this.availbletablets_.childNodes) {
            let obj = {
                name: t.innerText,
                purpose: undefined
            }
            this.frctablets_.push(obj);
        }

        for (let t of this.teamtablets_.childNodes) {
            let obj = {
                name: t.innerText,
                purpose: AssignTablets.tabletTeam
            }
            this.frctablets_.push(obj);
        }

        for (let t of this.matchtablets_.childNodes) {
            let obj = {
                name: t.innerText,
                purpose: AssignTablets.tabletMatch
            }
            this.frctablets_.push(obj);
        }
        window.scoutingAPI.send("set-tablet-data", this.frctablets_);
    }

    resetTablets() {
        for (let t of this.frctablets_) {
            t.purpose = undefined;
        }

        this.placeTablets();
    }

    removeAll() {
        this.frctablets_ = [];
        this.placeTablets();
    }

    autoAssign() {
        let purpose;

        this.frctablets_ = [];
        for (let i = 1; i <= 7; i++) {
            if (i === 7) {
                purpose = AssignTablets.tabletTeam;
            }
            else {
                purpose = AssignTablets.tabletMatch;
            }

            let tab = {
                name: 'Tablet ' + i,
                purpose: purpose
            }
            this.frctablets_.push(tab);
        }
        this.placeTablets();
    }

    placeTablets() {
        this.clear(this.availbletablets_) ;
        this.clear(this.matchtablets_);
        this.clear(this.teamtablets_);

        for (let tablet of this.frctablets_) {
            let p = document.createElement("p");
            p.innerText = tablet.name;
            p.className = "assign-tablets-list-item";

            if (tablet.purpose === AssignTablets.tabletTeam) {
                this.teamtablets_.append(p) ;
                p.contentEditable = true;
            }
            else if (tablet.purpose === AssignTablets.tabletMatch) {
                this.matchtablets_.append(p) ;
                p.contentEditable = true;
            }
            else {
                p.draggable = true;
                p.ondragstart = this.startdrag.bind(this);
                this.availbletablets_.append(p) ;
            }
        }
    }

    formCallback(args) {
        let col ;
        this.frctablets_ = args[0];

        if (!this.frctablets_) {
            this.frctablets_ = [] ;
        }

        this.assign_tablets_div_ = document.createElement('div');
        this.assign_tablets_div_.id = "assign-tablets-main-top-div";

        this.tabletdiv_ = document.createElement('div');
        this.tabletdiv_.id = "assign-tablets-tablet-div";
        this.assign_tablets_div_.append(this.tabletdiv_);

        col = this.createTabletsAvailable();
        this.availbletablets_ = col[1] ;
        this.availbletablets_.id = "assign-tablets-available";
        this.tabletdiv_.append(col[0]) ;

        col = this.createMatchTablets();
        this.matchtablets_ = col[1] ;''
        this.matchtablets_.id = "assign-tablets-match";
        this.tabletdiv_.append(col[0]);

        col = this.createTeamTablets();
        this.teamtablets_ = col[1] ;
        this.teamtablets_.id = "assign-tablets-team";
        this.tabletdiv_.append(col[0]) ;

        let hr = document.createElement('hr');
        this.assign_tablets_div_.append(hr);

        this.buttondiv_ = document.createElement('div');
        this.buttondiv_.id = "assign-tablets-buttons";
        this.assign_tablets_div_.append(this.buttondiv_);

        let autoassign = document.createElement('button');
        autoassign.innerText = 'Auto Assign';
        this.buttondiv_.append(autoassign);
        autoassign.onclick = this.autoAssign.bind(this);

        let add = document.createElement('button');
        add.innerText = 'Add Tablet';
        this.buttondiv_.append(add);
        add.onclick = this.addTablet.bind(this);

        let reset = document.createElement('button');
        reset.innerText = 'Unassign Tablets';
        this.buttondiv_.append(reset);
        reset.onclick = this.resetTablets.bind(this);

        let removeall = document.createElement('button');
        removeall.innerText = 'Remove All';
        this.buttondiv_.append(removeall);
        removeall.onclick = this.removeAll.bind(this);

        let save = document.createElement('button');
        save.innerText = 'Save';
        this.buttondiv_.append(save);
        save.onclick = this.saveData.bind(this);

        let discard = document.createElement('button');
        discard.innerText = 'Cancel';
        discard.onclick = () => { updateMainWindow("info"); }
        this.buttondiv_.append(discard);

        this.reset();
        this.top_.append(this.assign_tablets_div_);

        this.placeTablets();
    }
}

window.scoutingAPI.receive("send-tablet-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-tablet-data', args); });
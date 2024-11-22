
class GraphDataSelector {
  constructor(title) {
    let detail = document.createElement('details');
    detail.className = 'team-graph-details';

    let summary = document.createElement('summary');
    summary.innerText = title;
    detail.append(summary);

    let fieldset = document.createElement('fieldset');
    detail.append(fieldset);

    let legend = document.createElement('legend');
    legend.innerText = title;
    fieldset.append(legend);

    let list = document.createElement('ul');
    fieldset.append(list);

    this.detail = detail;
    this.summary = summary;
    this.fieldset = fieldset;
    this.list = list;
  }

  clear(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  getSelectorItems() {
    let data = [];
    for (let item of this.items) {
      if (item.checked) {
        data.push(item.xerodata);
      }
    }

    return data;
  }

  addDataToSelectors(list, cb) {
    this.items = [];
    this.clear(this.list);

    for (let item of list) {
      let li = document.createElement('li');
      let label = document.createElement('label');
      label.for = item;
      label.innerText = item;
      li.append(label);

      let check = document.createElement('input');
      check.type = 'checkbox';
      check.xerodata = item;
      check.onchange = cb;
      this.items.push(check);
      label.append(check);

      this.list.append(li);
    }
  }

  clearAllSelected() {
    for (let item of this.items) {
      item.checked = false;
    }
  }

  checkItem(data) {
    for (let item of this.items) {
      if (item.xerodata === data) {
        item.checked = true;
      }
    }
  }

  selectItems(list) {
    this.clearAllSelected();
    for (let data of list) {
      this.checkItem(data);
    }
  }
}

class GraphBaseView extends XeroView {
  constructor(div, viewtype) {
    super(div, viewtype);
  }
}

class TeamGraphView extends GraphBaseView {
  constructor(div, viewtype) {
    super(div, viewtype);

    this.team_boxes_ = [];
    this.team_field_boxes_left_ = [];
    this.match_field_boxes_left_ = [];
    this.team_field_boxes_right_ = [];
    this.match_field_boxes_right_ = [];
    this.current_chart_ = undefined;

    this.registerCallback('send-team-graph-data', this.formCallback.bind(this));
    this.registerCallback('send-team-list', this.receiveTeamList.bind(this));
    this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
    this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));
    this.registerCallback('send-match-list', this.receivedMatchList.bind(this));
    this.registerCallback('send-stored-graph-list', this.receivedStoredGraphList.bind(this));

    this.createBasePage();

    window.scoutingAPI.send('get-team-list');
    window.scoutingAPI.send('get-team-field-list');
    window.scoutingAPI.send('get-match-field-list');
    window.scoutingAPI.send('get-match-list');
    window.scoutingAPI.send('get-stored-graph-list');
  }

  render() {
    this.reset();
    this.top_.append(this.top_div_);
  }

  createGraph(ctx, data) {
    this.current_chart_ = new Chart(ctx,
      {
        type: 'bar',
        data: data,
        options: {
          scales: {
            x : {
              position: 'bottom',
            },
            y: {
              type: 'linear',
              position: 'left',
            },
            y2: {
              type: 'linear',
              position: 'right',
            }
          }
        }
      });
  }

  createBasePage() {
    this.top_div_ = document.createElement('div');

    this.select_div_ = document.createElement('div');
    this.select_div_.id = 'graph-team-select-div';
    this.top_div_.append(this.select_div_);

    this.select_div_one_ = document.createElement('div');
    this.select_div_one_.id = 'graph-team-select-one-div';
    this.select_div_.append(this.select_div_one_);

    this.select_div_two_ = document.createElement('div');
    this.select_div_two_.id = 'graph-team-select-two-div';
    this.select_div_.append(this.select_div_two_);

    this.team_selector_ = new GraphDataSelector('Teams');
    this.select_div_one_.append(this.team_selector_.detail);

    this.team_field_selector_left_ = new GraphDataSelector('Left Team Fields');
    this.select_div_one_.append(this.team_field_selector_left_.detail);

    this.match_field_selector_left_ = new GraphDataSelector('Left Match Fields');
    this.select_div_one_.append(this.match_field_selector_left_.detail);

    this.team_field_selector_right_ = new GraphDataSelector('Right Team Fields');
    this.select_div_one_.append(this.team_field_selector_right_.detail);

    this.match_field_selector_right_ = new GraphDataSelector('Right Match Fields');
    this.select_div_one_.append(this.match_field_selector_right_.detail);

    this.select_match_label_ = document.createElement('label');
    this.select_match_label_.textContent = 'Match';
    this.select_match_label_.className = 'graph-label';
    this.select_div_two_.append(this.select_match_label_);

    this.select_match_ = document.createElement('select');
    this.select_match_.onchange = this.selectedMatchChanged.bind(this);
    this.select_match_label_.append(this.select_match_);
    this.select_div_two_.append(this.select_match_label_);

    this.select_stored_label_ = document.createElement('label');
    this.select_stored_label_.className = 'graph-label'
    this.select_stored_label_.textContent = 'Saved Graph';
    this.select_div_two_.append(this.select_stored_label_);

    this.select_stored_ = document.createElement('select');
    this.select_stored_.onchange = this.selectedStoredChanged.bind(this);
    this.select_stored_label_.append(this.select_stored_);
    this.select_div_two_.append(this.select_stored_label_)

    this.select_delete_button_ = document.createElement('button') ;
    this.select_delete_button_.textContent = 'Delete' ;
    this.select_delete_button_.id = 'graph-delete-button' ;
    this.select_delete_button_.onclick = this.deleteStoredGraph.bind(this) ;
    this.select_div_two_.append(this.select_delete_button_) ;

    this.save_name_ = document.createElement('input');
    this.save_name_.type = 'text';
    this.save_name_.maxLength = 32;
    this.save_name_.placeholder = 'Enter Name Of Graph' ;

    this.select_div_two_.append(this.save_name_);

    this.save_action_ = document.createElement('button');
    this.save_action_.textContent = 'Save';
    this.save_action_.onclick = this.saveGraph.bind(this);
    this.select_div_two_.append(this.save_action_);

    this.canvas_ = document.createElement('canvas');
    this.top_div_.append(this.canvas_);
  }

  deleteStoredGraph() {
    let name = this.select_stored_.value ;
    if (name.length > 0) {
      window.scoutingAPI.send('delete-stored-graph', name);
    }
  }

  selectedMatchChanged() {
    var m = this.select_match_.options[this.select_match_.selectedIndex].value ;
    let regex = /([a-z]+)-([0-9]+)-([0-9]+)/ ;

    if (m.length > 0) {
      let result = regex.exec(m) ;
      if (result) {
        for(let match of this.match_list_) {
          if (match.comp_level === result[1] && match.set_number === +result[2] && match.match_number === +result[3]) {
            this.team_selector_.selectItems([...match.red, ...match.blue]) ;
            this.somethingChanged() ;
            break ;
          }
        }
      }
    }
  }

  selectedStoredChanged() {
    let value = this.select_stored_.value ;

    if (value.length > 0) {
      for(let sel of this.stored_graphs_) {
        if (sel.name === value) {
          this.team_field_selector_left_.selectItems(sel.data.leftteam) ;
          this.match_field_selector_left_.selectItems(sel.data.leftmatch) ;
          this.team_field_selector_right_.selectItems(sel.data.rightteam) ;
          this.match_field_selector_right_.selectItems(sel.data.rightmatch) ;
          this.save_name_.value = sel.name ;
        }
      }
    }
  }

  checkValidSaveName() {
    let name = this.save_name_.value;
    let regex = /^[a-zA-Z_][a-zA-Z_0-9]+$/;
    if (!regex.test(name)) {
      alert('Invalid save name, letters, numbers and underscore are all that are allowed');
      return false;
    }

    return true;
  }

  saveGraph() {
    let obj = {
      name: this.save_name_.value,
      teams: this.team_selector_.getSelectorItems(),
      data: {
        leftteam: this.team_field_selector_left_.getSelectorItems(),
        leftmatch: this.match_field_selector_left_.getSelectorItems(),
        rightteam: this.team_field_selector_right_.getSelectorItems(),
        rightmatch: this.match_field_selector_right_.getSelectorItems(),
      }
    };

    window.scoutingAPI.send('save-team-graph-setup', obj);
    window.scoutingAPI.send('get-stored-graph-list');
  }

  render() {
    this.reset();
    this.top_.append(this.top_div_);
  }

  formCallback(args) {
    if (this.current_chart_) {
      this.current_chart_.destroy();
    }
    this.createGraph(this.canvas_, args[0]);
  }

  isGraphValid(obj) {
    if (obj.teams.length === 0) {
      return false;
    }

    if (obj.data.leftteam.length + obj.data.leftmatch.length +
      obj.data.rightteam.length + obj.data.rightmatch.length === 0) {
      return false;
    }

    return true;
  }

  somethingChanged() {
    let obj = {
      teams: this.team_selector_.getSelectorItems(),
      data: {
        leftteam: this.team_field_selector_left_.getSelectorItems(this.team_field_selector_left_),
        leftmatch: this.match_field_selector_left_.getSelectorItems(this.match_field_selector_left_),
        rightteam: this.team_field_selector_right_.getSelectorItems(this.team_field_selector_right_),
        rightmatch: this.match_field_selector_right_.getSelectorItems(this.match_field_selector_right_),
      }
    };

    if (this.isGraphValid(obj)) {
      window.scoutingAPI.send('get-team-graph-data', obj);
    }
    else {
      if (this.current_chart_) {
        this.current_chart_.destroy();
      }
    }
  }

  receivedMatchList(list) {
    this.clear(this.select_match_);

    if(list && list[0]) {
      this.match_list_ = list[0] ;

      let opt = document.createElement('option');
      opt.value = '' ;
      opt.text = 'None' ;
      this.select_match_.append(opt);

      for (let match of list[0]) {
        let opt = document.createElement('option');
        opt.value = match.comp_level + '-' + match.set_number + '-' + match.match_number ;
        opt.text = opt.value ;
        this.select_match_.append(opt);
      }
    }
  }

  receivedStoredGraphList(list) {
    this.clear(this.select_stored_);

    let opt = document.createElement('option');
    opt.value = '' ;
    opt.text = 'None' ;
    this.select_stored_.append(opt);    

    if (list && list[0]) {
      this.stored_graphs_ = list[0] ;
      for (let stored of list[0]) {
        let opt = document.createElement('option');
        opt.value = stored.name ;
        opt.text = stored.name;
        this.select_stored_.append(opt);
      }
    }
  }

  receiveTeamList(list) {
    this.team_selector_.addDataToSelectors(list[0], this.somethingChanged.bind(this))
  }

  receiveTeamFieldList(list) {
    this.team_field_selector_left_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
    this.team_field_selector_right_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
  }

  receiveMatchFieldList(list) {
    this.match_field_selector_left_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
    this.match_field_selector_right_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
  }
}

window.scoutingAPI.receive("send-team-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-list', args); });
window.scoutingAPI.receive("send-team-field-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-field-list', args); });
window.scoutingAPI.receive("send-match-field-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-match-field-list', args); });
window.scoutingAPI.receive("send-team-graph-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-graph-data', args); });
window.scoutingAPI.receive("send-match-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-match-list', args); });
window.scoutingAPI.receive("send-stored-graph-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-stored-graph-list', args); });

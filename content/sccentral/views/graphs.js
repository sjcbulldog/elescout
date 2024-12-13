
class GraphBaseView extends XeroView {
  constructor(div, viewtype) {
    super(div, viewtype);
  }
}

class GraphView extends GraphBaseView {
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

    //
    // Get all of the status data that is needed
    //
    this.scoutingAPI('get-team-list');
    this.scoutingAPI('get-team-field-list');
    this.scoutingAPI('get-match-field-list');
    this.scoutingAPI('get-match-list');
    this.scoutingAPI('get-stored-graph-list');

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

    this.team_selector_ = new XeroSelector('Teams', false);
    this.team_selector_.detail.className = 'field-select-detail' ;
    this.select_div_one_.append(this.team_selector_.detail);

    this.team_field_selector_left_ = new XeroSelector('Left Team Fields', false);
    this.team_field_selector_left_.detail.className = 'field-select-detail' ;
    this.select_div_one_.append(this.team_field_selector_left_.detail);

    this.match_field_selector_left_ = new XeroSelector('Left Match Fields', false);
    this.match_field_selector_left_.detail.className = 'field-select-detail' ;
    this.select_div_one_.append(this.match_field_selector_left_.detail);

    this.team_field_selector_right_ = new XeroSelector('Right Team Fields', false);
    this.team_field_selector_right_.detail.className = 'field-select-detail' ;
    this.select_div_one_.append(this.team_field_selector_right_.detail);

    this.match_field_selector_right_ = new XeroSelector('Right Match Fields', false);
    this.match_field_selector_right_.detail.className = 'field-select-detail' ;
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

    this.reset();
    this.top_.append(this.top_div_);
  }

  deleteStoredGraph() {
    let name = this.select_stored_.value ;
    if (name.length > 0) {
      //
      // This will delete the graph in the main process, which in turn will send the
      // up to date graph list back to the renderer.
      //
      this.scoutingAPI('delete-stored-graph', name);
    }
  }

  //
  // The selected match changed
  //
  selectedMatchChanged() {
    var m = this.select_match_.options[this.select_match_.selectedIndex].value ;
    if (m === '---') {
      this.team_selector_.unselectAll() ;
    }
    else {
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
  }

  //
  // The graph configuration changed, update the view to reflect the newly selected
  // graph configuration.
  //
  selectedStoredChanged() {
    let value = this.select_stored_.value ;   // The name of the new configuration

    if (value.length > 0) {
      for(let sel of this.stored_graphs_) {
        if (sel.name === value) {
          this.team_field_selector_left_.unselectAll() ;
          this.team_field_selector_left_.selectItems(sel.data.leftteam) ;
          this.match_field_selector_left_.unselectAll() ;
          this.match_field_selector_left_.selectItems(sel.data.leftmatch) ;
          this.team_field_selector_right_.unselectAll() ;
          this.team_field_selector_right_.selectItems(sel.data.rightteam) ;
          this.match_field_selector_right_.unselectAll() ;
          this.match_field_selector_right_.selectItems(sel.data.rightmatch) ;
          this.save_name_.value = sel.name ;
          this.somethingChanged() ;
          break ;
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
      teams: this.team_selector_.getSelectedItems(),
      data: {
        leftteam: this.team_field_selector_left_.getSelectedItems(),
        leftmatch: this.match_field_selector_left_.getSelectedItems(),
        rightteam: this.team_field_selector_right_.getSelectedItems(),
        rightmatch: this.match_field_selector_right_.getSelectedItems(),
      }
    };

    this.scoutingAPI('save-team-graph-setup', obj);
    this.scoutingAPI('get-stored-graph-list');
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

  saveCurrentGraph() {
    let grobj = {
      name: this.save_name_.value,
      teams: this.team_selector_.getSelectedItems(),
      data: {
        leftteam: this.team_field_selector_left_.getSelectedItems(),
        leftmatch: this.match_field_selector_left_.getSelectedItems(),
        rightteam: this.team_field_selector_right_.getSelectedItems(),
        rightmatch: this.match_field_selector_right_.getSelectedItems(),
      }
    };
    this.scoutingAPI('save-team-graph-setup', grobj);
  }

  somethingChanged(save) {
    //
    // Something changed in the graph configuration, if save it true
    // it was a field setting and we save the new graph configuration
    //
    if (save) {
      this.saveCurrentGraph() ;
    }

    //
    // Now, ask for the data for the new configuration.
    //
    let obj = {
      teams: this.team_selector_.getSelectedItems(),
      data: {
        leftteam: this.team_field_selector_left_.getSelectedItems(),
        leftmatch: this.match_field_selector_left_.getSelectedItems(),
        rightteam: this.team_field_selector_right_.getSelectedItems(),
        rightmatch: this.match_field_selector_right_.getSelectedItems(),
      }
    };

    if (this.isGraphValid(obj)) {
      //
      // We only ask for new data if the configuration is complete enough to
      // display data.
      //
      this.scoutingAPI('get-team-graph-data', obj);
    }
    else {
      //
      // There is nothing to display, if an existing chart exists, destroy it
      //
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
      opt.value = '---' ;
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
    this.team_selector_.addDataToSelectors(list[0], this.somethingChanged.bind(this, false))
  }

  receiveTeamFieldList(list) {
    this.team_field_selector_left_.addDataToSelectors(list[0], this.somethingChanged.bind(this, true));
    this.team_field_selector_right_.addDataToSelectors(list[0], this.somethingChanged.bind(this, true));
  }

  receiveMatchFieldList(list) {
    this.match_field_selector_left_.addDataToSelectors(list[0], this.somethingChanged.bind(this, true));
    this.match_field_selector_right_.addDataToSelectors(list[0], this.somethingChanged.bind(this, true));
  }
}


class GraphBaseView extends XeroView {
  constructor(div, viewtype) {
    super(div, viewtype) ;
  }
}

class TeamGraphView extends GraphBaseView {
    constructor(div, viewtype) {
        super(div, viewtype);

        this.team_boxes_ = [] ;
        this.team_field_boxes_left_ = [] ;
        this.match_field_boxes_left_ = [] ;
        this.team_field_boxes_right_ = [] ;
        this.match_field_boxes_right_ = [] ;
        this.current_chart_ = undefined ;

        this.registerCallback('send-team-graph-data', this.formCallback.bind(this));
        this.registerCallback('send-team-list', this.receiveTeamList.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));

        this.createBasePage() ;

        window.scoutingAPI.send('get-team-list') ;
        window.scoutingAPI.send('get-team-field-list') ;
        window.scoutingAPI.send('get-match-field-list') ;
    }

    render() {
      this.reset() ;
      this.top_.append(this.top_div_) ;
    }

    createGraph(ctx, data) {
      this.current_chart_ = new Chart(ctx, 
            {
              type: 'bar',
              data: data,
              options: {
                scales: {
                  x: {
                    stacked: false
                  },
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
    }

    createDetailSelector(title) {
      let detail = document.createElement('details') ;
      detail.className = 'team-graph-details' ;

      let summary = document.createElement('summary') ;
      summary.innerText = title ;
      detail.append(summary) ;

      let fieldset = document.createElement('fieldset') ;
      detail.append(fieldset) ;
      
      let legend = document.createElement('legend') ;
      legend.innerText = 'Teams' ;
      fieldset.append(legend) ;

      let list = document.createElement('ul') ;
      fieldset.append(list) ;

      let sel = {
        detail: detail,
        summary: summary,
        fieldset: fieldset,
        legend: legend,
        list: list,
      }

      return sel ;
    }

    createBasePage() {
      this.top_div_ = document.createElement('div') ;

      this.select_div_ = document.createElement('div') ;
      this.select_div_.id = 'graph-team-select-div' ;
      this.top_div_.append(this.select_div_) ;

      this.team_selector_ = this.createDetailSelector('Teams') ;
      this.select_div_.append(this.team_selector_.detail) ;

      this.team_field_selector_left_ = this.createDetailSelector('Left Axis: Team Fields') ;
      this.select_div_.append(this.team_field_selector_left_.detail) ;

      this.match_field_selector_left_ = this.createDetailSelector('Left Axis: Match Fields') ;
      this.select_div_.append(this.match_field_selector_left_.detail) ;

      this.team_field_selector_right_ = this.createDetailSelector('Right Axis: Team Fields') ;
      this.select_div_.append(this.team_field_selector_right_.detail) ;

      this.match_field_selector_right_ = this.createDetailSelector('Right Axis: Match Fields') ;
      this.select_div_.append(this.match_field_selector_right_.detail) ;

      this.save_name_ = document.createElement('input') ;
      this.save_name_.type = 'text' ;
      this.select_div_.append(this.save_name_) ;

      this.save_action_ = document.createElement('button') ;
      this.save_action_.textContent = 'Save' ;
      this.select_div_.append(this.save_action_) ;


      this.canvas_ = document.createElement('canvas') ;
      this.top_div_.append(this.canvas_) ;
    }

    render() {
      this.reset() ;
      this.top_.append(this.top_div_) ;
    }

    formCallback(args) {
        if (this.current_chart_) {
          this.current_chart_.destroy() ;
        }
        this.createGraph(this.canvas_, args[0]) ;
    }

    getSelectorItems(sel) {
      let data = [] ;
      for(let item of sel.items) {
        if (item.checked) {
          data.push(item.xerodata) ;
        }
      }

      return data ;
    }

    isGraphValid(obj) {
      if(obj.teams.length === 0) {
        return false ;
      }

      if (obj.data.leftteam.length + obj.data.leftmatch.length + 
          obj.data.rightteam.length + obj.data.rightmatch.length === 0) {
        return false ;
      }

      return true ;
    }

    somethingChanged() {
      let obj = {
        teams: this.getSelectorItems(this.team_selector_),
        data: {
          leftteam: this.getSelectorItems(this.team_field_selector_left_),
          leftmatch: this.getSelectorItems(this.match_field_selector_left_),
          rightteam: this.getSelectorItems(this.team_field_selector_right_),
          rightmatch: this.getSelectorItems(this.match_field_selector_right_),
        }
      } ;

      if (this.isGraphValid(obj)) {
        window.scoutingAPI.send('get-team-graph-data', obj) ;
      }
      else {
        this.current_chart_.destroy() ;
      }
    }

    addDataToSelectors(sel, list) {
      sel.items = [] ;
      this.clear(sel.list) ;

      for(let item of list) {
        let li = document.createElement('li') ;
        let label = document.createElement('label') ;
        label.for = item ;
        label.innerText = item;
        li.append(label) ;

        let check = document.createElement('input') ;
        check.type = 'checkbox' ;
        check.xerodata = item ;
        check.onchange = this.somethingChanged.bind(this) ;
        sel.items.push(check) ;
        label.append(check) ;

        sel.list.append(li) ;
      }
    }

    receiveTeamList(list) {
      this.addDataToSelectors(this.team_selector_, list[0]) ;
    }

    receiveTeamFieldList(list) {
      this.addDataToSelectors(this.team_field_selector_left_, list[0]) ;
      this.addDataToSelectors(this.team_field_selector_right_, list[0]) ;
    }

    receiveMatchFieldList(list) {
      this.addDataToSelectors(this.match_field_selector_left_, list[0]) ;
      this.addDataToSelectors(this.match_field_selector_right_, list[0]) ;
    }
}

window.scoutingAPI.receive("send-team-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-list', args); });
window.scoutingAPI.receive("send-team-field-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-field-list', args); });
window.scoutingAPI.receive("send-match-field-list", (args) => { XeroView.callback_mgr_.dispatchCallback('send-match-field-list', args); });
window.scoutingAPI.receive("send-team-graph-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-team-graph-data', args); });
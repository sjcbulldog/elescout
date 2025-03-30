class SingleTeamView extends XeroView {

    constructor(div, viewtype) {
        super(div, viewtype);

        this.teams_ = null ;
        this.team_ = null ;

        this.createBaseDisplay() ;
        
        this.registerCallback('send-single-team-data', this.formCallback.bind(this));
        this.registerCallback('send-team-data', this.receiveTeamData.bind(this));
        this.registerCallback('send-team-field-list', this.receiveTeamFieldList.bind(this));
        this.registerCallback('send-match-field-list', this.receiveMatchFieldList.bind(this));
        this.registerCallback('send-single-team-fields', this.receiveSingleTeamFields.bind(this));
        this.registerCallback('send-single-team-formulas', this.receiveFormulaFieldList.bind(this)) ;

        this.team_fields_ = false ;
        this.match_fields_ = false ;

        this.scoutingAPI('get-team-data') ;
        this.scoutingAPI('get-team-field-list');
        this.scoutingAPI('get-match-field-list');
        this.scoutingAPI('get-single-team-formulas') ;
    }

    createTeamSelector(parent) {
        this.team_selector_div_ = document.createElement('div') ;
        this.team_selector_div_.className = 'single-team-team-selector-div' ;
        parent.append(this.team_selector_div_) ;

        this.team_selector_ = document.createElement('select') ;
        this.team_selector_.className = 'single-team-team-selector' ;
        this.team_selector_.onchange = this.selectedTeamChanged.bind(this);
        this.team_selector_div_.append(this.team_selector_) ;

        const opt = document.createElement('option');
        opt.value = '' ;
        opt.text = 'Please Wait ...' ;
        opt.disabled = true ;
        this.team_selector_.append(opt) ;
    }

    createReportData(parent) {
        this.team_report_data_div_ = document.createElement('div') ;
        this.team_report_data_div_.className = 'single-team-report-data-div' ;
        parent.append(this.team_report_data_div_) ;

        this.team_report_data_title_ = document.createElement('span') ;
        this.team_report_data_title_.className = 'single-team-report-data-title' ;
        this.team_report_data_title_.textContent = 'Team Data';
        this.team_report_data_div_.append(this.team_report_data_title_) ;

        this.team_report_data_table_ = document.createElement('table') ;
        this.team_report_data_table_.className = 'single-team-report-data-table' ;
        this.team_report_data_div_.append(this.team_report_data_table_) ;
    }

    createReportSchedule(parent) {
        this.team_report_matches_div_ = document.createElement('div') ;
        this.team_report_matches_div_.className = 'single-team-report-matches-div' ;
        parent.append(this.team_report_matches_div_) ;

        this.team_report_matches_title_ = document.createElement('span') ;
        this.team_report_matches_title_.className = 'single-team-report-matches-title' ;
        this.team_report_matches_title_.textContent = 'Team Matches';
        this.team_report_matches_div_.append(this.team_report_matches_title_) ;

        this.team_report_matches_table_ = document.createElement('table') ;
        this.team_report_matches_table_.className = 'single-team-report-matches-table' ;
        this.team_report_matches_div_.append(this.team_report_matches_table_) ;
    }

    createReportTitle(parent) {
        this.team_report_title_ = document.createElement('span') ;
        this.team_report_title_.className = 'single-team-report-title' ;
        this.team_report_title_.textContent = 'Select A Team' ;
        parent.append(this.team_report_title_) ;
    }

    createReport(parent) {
        this.team_report_div_ = document.createElement('div') ;
        this.team_report_div_.className = 'single-team-report-div' ;
        parent.append(this.team_report_div_) ;

        this.createReportTitle(this.team_report_div_) ;
        this.createReportData(this.team_report_div_) ;
        this.createReportSchedule(this.team_report_div_) ;
    }

    createFieldSelector(parent) {
        this.field_sel_div_ = document.createElement('div') ;
        this.field_sel_div_.className = 'single-team-field-div' ;
        parent.append(this.field_sel_div_) ;

        this.team_field_selector_ = new XeroSelector('Team Fields', false);
        this.team_field_selector_.detail.className = 'single-team-team-field-selector' ;
        this.field_sel_div_.append(this.team_field_selector_.detail);

        this.match_field_selector_ = new XeroSelector('Match Fields', false);
        this.match_field_selector_.detail.className = 'single-team-match-field-selector' ;
        this.field_sel_div_.append(this.match_field_selector_.detail);

        this.formula_field_selector_ = new XeroSelector('Formulas', false);
        this.formula_field_selector_.detail.className = 'single-team-formula-selector' ;
        this.field_sel_div_.append(this.formula_field_selector_.detail);        
    }

    createBaseDisplay() {
        this.reset() ;
        this.single_top_ = document.createElement('div') ;
        this.single_top_.className = 'single-team-top' ;

        this.createFieldSelector(this.single_top_) ;
        this.createTeamSelector(this.single_top_) ;
        this.createReport(this.single_top_) ;

        this.top_.append(this.single_top_) ;
    }

    findTeamByNumber(n) {
        let ret = null ;

        if (this.teams_) {
            for(let team of this.teams_) {
                if (team.team_number === n) {
                    ret = team ;
                    break ;
                }
            }
        }

        return ret;
    }

    selectedTeamChanged() {
        this.team_ = this.findTeamByNumber(+this.team_selector_.value) ;
        if (this.team_) {
            this.team_report_title_.textContent = this.team_.team_number + ' - ' + this.team_.nickname ;
            this.scoutingAPI('get-single-team-data', { team: this.team_.team_number, mcount: 1000 });
        }
    }

    matchTitle(complevel, sno, mno) {
        let str ;

        if (complevel === 'qm') {
            str = 'Qual Match ' + mno ;
        }
        else if (complevel === 'sf') {
            str = 'Semi Final ' + sno ;
        }
        else if (complevel === 'f') {
            str = 'Final ' + mno ;
        }

        return str;
    }

    createMatchTooltip(bkdown) {
        let tip = '' ;
        for(let key of Object.keys(bkdown)) {
            if(tip.length > 0) {
                tip += '\n' ;
            }

            tip += key ;
            tip += '\t';
            tip += bkdown[key] ;
        }

        return tip;
    }

    populateMatches(team, matches) {
        let td, one ;
        let won = 0, lost = 0, tied = 0 ;
        this.clear(this.team_report_matches_table_) ;

        matches.sort(this.sortCompFunBA.bind(this)) ;

        let tr = document.createElement('tr') ;

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Match' ;
        tr.append(td) ;

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Red 1' ;
        tr.append(td) ;

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Red 2' ;
        tr.append(td) ;

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Red 3' ;
        tr.append(td) ;

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Blue 1' ;
        tr.append(td) ;        
        
        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Blue 2' ;
        tr.append(td) ;    

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Blue 3' ;
        tr.append(td) ;    

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Red Score' ;
        tr.append(td) ;    

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Blue Score' ;
        tr.append(td) ;       

        td = document.createElement('th') ;
        td.className = 'single-team-matches-header' ;
        td.textContent = 'Outcome' ;
        tr.append(td) ; 

        this.team_report_matches_table_.append(tr) ;    

        for(let m of matches) {
            if (m.actual_time == null) {
                continue ;
            }

            let isRed = false ;
            tr = document.createElement('tr') ;

            td = document.createElement('td') ;
            td.className = 'single-team-matches-title-cell' ;
            td.textContent = this.matchTitle(m.comp_level, m.set_number, m.match_number) ;
            tr.append(td) ;

            for(let i = 0 ; i < 3 ; i++) {
                td = document.createElement('td') ;
                one = this.keyToNumber(m.alliances.red.team_keys[i]) ;

                td.textContent = one ;
                if (one === team) {
                    isRed = true ;
                    td.className = 'single-team-matches-red-highlight-cell' ;
                }
                else {
                    td.className = 'single-team-matches-red-cell' ;                    
                }
                if (m.score_breakdown && m.score_breakdown.red) {
                    td.title = this.createMatchTooltip(m.score_breakdown.red) ;
                }
                tr.append(td) ;
            }
            
            for(let i = 0 ; i < 3 ; i++) {
                td = document.createElement('td') ;
                one = this.keyToNumber(m.alliances.blue.team_keys[i]) ;
                td.textContent = one ;
                if (one === team) {
                    td.className = 'single-team-matches-blue-highlight-cell' ;
                }
                else {
                    td.className = 'single-team-matches-blue-cell' ;                    
                }
                if (m.score_breakdown && m.score_breakdown.blue) {
                    td.title = this.createMatchTooltip(m.score_breakdown.blue) ;
                }
                tr.append(td) ;
            }

            td = document.createElement('td') ;
            if (m.alliances.red.score) {
                td.textContent = m.alliances.red.score ;
                if (m.alliances.red.score > m.alliances.blue.score) {
                    td.className = 'single-team-matches-red-highlight-cell' ; 
                }
                else {
                    td.className = 'single-team-matches-red-cell' ;    
                }
                td.title = this.createMatchTooltip(m.score_breakdown.red) ;
            }
            else {
                td.textContent = '' ;
            }
            tr.append(td) ;

            td = document.createElement('td') ;
            if (m.alliances.blue.score) {
                td.textContent = m.alliances.blue.score ;
                if (m.alliances.blue.score > m.alliances.red.score) {
                    td.className = 'single-team-matches-blue-highlight-cell' ;
                }
                else {
                    td.className = 'single-team-matches-blue-cell' ;   
                }
                td.title = this.createMatchTooltip(m.score_breakdown.blue) ;
            }
            else {
                td.textContent = '' ;
            }
            tr.append(td) ;

            td = document.createElement('td') ;
            td.className = 'single-team-matches-won-lost' ;

            if (!m.alliances.red.score || !m.alliances.blue.score) {
                td.textContent('-') ;
            }
            else {
                if (m.alliances.red.score === m.alliances.blue.score) {
                    td.textContent = 'Tie' ;
                    tied++ ;
                }
                else if (isRed) {
                    if (m.alliances.red.score > m.alliances.blue.score) {
                        td.textContent = 'Won';
                        won++ ;
                    }
                    else {
                        td.textContent = 'Lost' ;
                        lost++ ;
                    }
                }
                else {
                    if (m.alliances.red.score > m.alliances.blue.score) {
                        td.textContent = 'Lost';
                        lost++ ;
                    }
                    else {
                        td.textContent = 'Won' ;
                        won++ ;
                    }
                }
            }
            tr.append(td) ;
            this.team_report_matches_table_.append(tr) ;
        }
        
        tr = document.createElement('tr') ;
        td = document.createElement('td') ;
        td.colSpan = 10 ;
        td.className = 'single-team-matches-record' ;
        td.textContent = 'Record ' + won + '-' + lost + '-' + tied ;
        tr.append(td) ;         
        this.team_report_matches_table_.append(tr) ;
    }

    populateTeamData(number, data) {
        let tr, td ;
        let even = false ;

        this.clear(this.team_report_data_table_) ;

        tr = document.createElement('tr') ;
        tr.className = 'single-team-report-data-row-even' ;

        td = document.createElement('th') ;
        td.className = 'single-team-report-data-header' ;
        td.textContent = 'Name' ;
        tr.append(td) ;

        td = document.createElement('th') ;
        td.className = 'single-team-report-data-header' ;
        td.textContent = 'Value' ;
        tr.append(td) ;

        this.team_report_data_table_.append(tr) ;
        
        for(let key of Object.keys(data)) {
            let value = data[key] ;

            tr = document.createElement('tr') ;
            if (even) {
                tr.className = 'single-team-report-data-row-even' ;
            }
            else {
                tr.className = 'single-team-report-data-row-odd' ;
            }
            even = !even ;

            td = document.createElement('td') ;
            td.className = 'single-team-report-data-cell' ;
            td.textContent = key ;
            tr.append(td) ;
    
            td = document.createElement('td') ;
            td.className = 'single-team-report-data-cell' ;
            if (typeof value === 'number') {
                td.textContent = value.toFixed(3) ;
            } else {
                td.textContent = value.toString() ;
            }
            tr.append(td) ;
    
            this.team_report_data_table_.append(tr) ;
        }
    }

    formCallback(args) {
        let data = args[0]; 

        if (data.matches) {
            this.populateMatches(this.team_.team_number, data.matches) ;
        }

        if (data.teamdata) {
            this.populateTeamData(this.team_.team_number, data.teamdata) ;
        }
    }

    teamCompareFunction(a, b) {
        return a.team_number - b.team_number ;
    }

    somethingChanged() {
        let mfields = this.match_field_selector_.getSelectedItems() ;
        let tfields = this.team_field_selector_.getSelectedItems() ;
        let ffields = this.formula_field_selector_.getSelectedItems() ;
        let obj = {
            match: mfields,
            team: tfields,
            formulas: ffields,
            num: this.team_.team_number
        } ;
        this.scoutingAPI('update-single-team-data', obj) ;
    }

    receiveTeamData(args) {
        this.teams_ = args[0] ;
		this.teams_.sort(this.teamCompareFunction.bind(this));

        this.clear(this.team_selector_) ;
        for(let team of this.teams_) {
            let opt = document.createElement('option') ;
            opt.text = team.team_number + ' - ' + team.nickname;
            opt.value = team.team_number ;
            this.team_selector_.append(opt) ;
        }
        if (this.teams_ && this.teams_.length > 0) {
            this.team_selector_.value = this.teams_[0].team_number ;
        }
    }

    checkFieldList() {
        if (this.team_fields_ && this.meatch_fields_ && this.formula_fields_) {
            this.scoutingAPI('get-single-team-fields') ;
        }
    }

    receiveTeamFieldList(list) {
        this.team_field_selector_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
        this.team_fields_ = true ;
        this.checkFieldList() ;
    }
    
    receiveMatchFieldList(list) {
        this.match_field_selector_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
        this.meatch_fields_ = true ;
        this.checkFieldList() ;
    }

    receiveSingleTeamFields(list) {
        this.team_field_selector_.selectItems(list[0].team) ;
        this.match_field_selector_.selectItems(list[0].match) ;
        this.formula_field_selector_.selectItems(list[0].formulas) ;
        this.selectedTeamChanged() ;
    }
    
    receiveFormulaFieldList(list) {
        this.formula_field_selector_.addDataToSelectors(list[0], this.somethingChanged.bind(this));
        this.formula_fields_ = true ;
        this.checkFieldList() ;
    }
}
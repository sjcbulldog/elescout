class SelectTablet extends XeroView
{
    static minRequiredNumberTeams = 24 ;

    constructor(div, type, args) {
        super(div, type) ;

        this.top_ = div ;
        this.startup_div_ = document.createElement('div') ;
        this.top_.append(this.startup_div_) ;

        window.scoutingAPI.send("get-tablet-data");
        this.registerCallback('send-tablet-data', this.formCallback.bind(this));

        this.reset() ;
        this.top_.append(this.startup_div_) ;
    }

    selectTablet(event) {
        window.scoutingAPI.send("set-tablet-name-purpose", 
            { 'name' : event.currentTarget.tabletName, 
              'purpose' : event.currentTarget.tabletPurpose
            }) ;
    }
    
    formCallback(tablets) {
        let row ;

        this.reset() ;
    
        this.tablet_top_ = document.createElement("div") ;
        this.tablet_top_.id = "select-tablet-main" ;
    
        this.tablet_table_ = document.createElement("table") ;
        this.tablet_table_.id = "select-tablet-table" ;
        this.tablet_top_.append(this.tablet_table_) ;
    
        let hdr = document.createElement('tr') ;
        hdr.className = "select-tablet-header-row" ;
    
        let hdr1 = document.createElement('th') ;    
        hdr1.innerText = 'Tablet Name' ;
        hdr.appendChild(hdr1) ;
    
        let hdr2 = document.createElement('th') ;    
        hdr2.innerText = 'Purpose' ;
        hdr.appendChild(hdr2) ;
        
        this.tablet_table_.appendChild(hdr) ;
    
        for(let tablet of tablets[0]) {
            let one = document.createElement('tr') ;
            one.className = "select-tablet-row" ;
    
            let cell1 = document.createElement('td') ;
            cell1.innerText = tablet.name ;
            cell1.tabletName = tablet.name ;
            cell1.tabletPurpose = tablet.purpose ;
            cell1.className = 'select-tablet-cell' ;
            cell1.ondblclick = this.selectTablet.bind(this) ;
            one.appendChild(cell1) ;
    
            let cell2 = document.createElement('td') ;
            cell2.innerText = tablet.purpose ;
            cell2.tabletName = tablet.name ;
            cell2.tabletPurpose = tablet.purpose ;
            cell2.className = 'select-tablet-cell' ;
            cell2.ondblclick = this.selectTablet.bind(this) ;
            one.appendChild(cell2) ;
    
            this.tablet_table_.appendChild(one) ;
        }    
    
        let last = document.createElement('tr') ;
        let lastcell = document.createElement('td') ;
        lastcell.colSpan = 2 ;
        lastcell.innerText = 'Double click tablet to select' ;
        lastcell.className = 'select-tablet-instruction' ;
        this.tablet_table_.appendChild(lastcell) ;
    
        this.top_.append(this.tablet_top_) ;
    }
    
    
}

window.scoutingAPI.receive("send-tablet-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-tablet-data', args); });


class SpiderView extends XeroView {
    weblines_ ;
    margin_ ;

    tcolors = [
        'red',
        'blue',
        'green',
        'orange',
        'purple',
        'brown',
    ]

    constructor(div, viewtype) {
        super(div, viewtype) ;

        this.weblines_ = 5 ;
        this.margin_ = 6 ;

        this.registerCallback('send-multi-team-data', this.receiveMultiTeamData.bind(this));
        this.registerCallback('send-multi-selected-teams', this.receiveMultiSelectedTeams.bind(this));

        this.reset() ;
        this.multi_top_ = document.createElement('div') ;
        this.multi_top_.className = 'multi-team-top' ;
        this.top_.appendChild(this.multi_top_) ;
        this.createSpiderView(this.multi_top_) ;

        this.scoutingAPI('get-multi-selected-teams') ;
    }

    receiveMultiSelectedTeams(data) {
        this.teams_ = data[0] ;
        this.scoutingAPI('get-multi-team-data',  { teams: teams, numericonly: true } ) ;
    }

    drawAxis() {
        for(let i = 0 ; i < this.axis_ ; i++) {
            let x = this.center_.x + this.radius_ * Math.cos(i * this.radians_) ;
            let y = this.center_.y + this.radius_ * Math.sin(i * this.radians_) ;

            this.ctx_.beginPath() ;
            this.ctx_.moveTo(this.center_.x, this.center_.y) ;
            this.ctx_.lineTo(x, y) ;
            this.ctx_.stroke() ;

            let text = this.cols_[i + 1] ;
            this.ctx_.textAlign = 'center' ;
            this.ctx_.font = '24px Arial' ;
            let xform = this.ctx_.save() ;
            this.ctx_.translate(x, y) ;
            this.ctx_.rotate(i * this.radians_ + Math.PI / 2) ;
            this.ctx_.fillText(text, 0, 0) ;
            this.ctx_.restore() ;
        }
    }

    scaleValue(didx, value) {
        let range = this.max_[didx] - this.min_[didx] ;
        let scale = this.radius_ / range ;
        return (value - this.min_[didx]) * scale ;
    }

    getValue(team, didx) {
        let idx = didx % this.getDataElementCount() ;
        return (this.data_[team])[this.cols_[idx + 1]];
    }

    getDataElementCount() {
        return this.cols_.length - 1 ;
    }

    drawOneTeam(team) {
        let lastx = -1 ;
        let lasty = -1 ;

        this.ctx_.strokeStyle = this.tcolors[team % this.tcolors.length] ;
        for(let i = 0 ; i < this.axis_ ; i++) {
            let val = this.getValue(team, i) ;
            let dist = this.scaleValue(i, val) ;
            let x = this.center_.x + dist * Math.cos(i * this.radians_) ;
            let y = this.center_.y + dist * Math.sin(i * this.radians_) ;

            if (lastx != -1 && lasty != -1) {
                this.ctx_.beginPath() ;
                this.ctx_.moveTo(lastx, lasty) ;
                this.ctx_.lineTo(x, y) ;
                this.ctx_.stroke() ;
            }

            lastx = x ;
            lasty = y ;
        }  
    }

    drawTeams() {
        for(let teamidx = 0 ; teamidx < this.data_.length ; teamidx++) {
            this.drawOneTeam(teamidx) ;
        }
    }

    drawOneWeb(dist) {
        let lastx = -1 ;
        let lasty = -1 ;

        for(let i = 0 ; i <= this.axis_ ; i++) {
            let x = this.center_.x + dist * Math.cos(i * this.radians_) ;
            let y = this.center_.y + dist * Math.sin(i * this.radians_) ;

            if (lastx != -1 && lasty != -1) {
                this.ctx_.beginPath() ;
                this.ctx_.moveTo(lastx, lasty) ;
                this.ctx_.lineTo(x, y) ;
                this.ctx_.stroke() ;
            }

            lastx = x ;
            lasty = y ;
        }    
    }

    drawWeb() {
        let div = this.radius_ / this.weblines_ ;
        let len = div ;
        for(let tick = 0 ; tick < this.weblines_ ; tick++) {
            this.drawOneWeb(len) ;
            len += div ;
        }
    }

    findDataRange() {
        this.min_ = [] ;
        this.max_ = [] ;

        for(let i = 0 ; i < this.getDataElementCount() ; i++) {
            let min = Number.MAX_VALUE ;
            let max = Number.MIN_VALUE ;

            for(let team = 0 ; team < this.data_.length ; team++) {
                let val = this.getValue(team, i) ;
                if (val < min) {
                    min = val ;
                }
                if (val > max) {
                    max = val ;
                }
            }

            this.min_.push(min) ;
            this.max_.push(max) ;
        }
    }

    receiveMultiTeamData(obj) {
        this.cols_ = obj[0].columns ;
        this.data_ = obj[0].data ;

        this.axis_ = this.cols_.length - 1 ;
        this.radians_ = 2 * Math.PI / this.axis_ ;
        this.center_ = new XeroPoint(this.canvas_.width / 2, this.canvas_.height / 2) ;

        if (this.canvas_.width < this.canvas_.height) {
            this.radius_ = this.canvas_.width / 2 - this.margin_ ;
        } else {
            this.radius_ = this.canvas_.height / 2 - this.margin_ ;
        }
        
        this.ctx_ = this.canvas_.getContext('2d');
        this.findDataRange() ;
        this.drawAxis() ;
        this.drawWeb() ;
        this.drawTeams() ;
    }

    createSpiderView(parent) {
        if (!this.canvas_) {
            this.canvas_ = document.createElement('canvas') ;
            parent.appendChild(this.canvas_) ;

            this.canvas_.width = this.canvas_.parentElement.offsetWidth;
            this.canvas_.height = this.canvas_.parentElement.offsetHeight;    
        }
    }
}
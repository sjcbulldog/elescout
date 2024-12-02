class TwoEndedSlider {
	constructor(canvas, minval, maxval, stepval) {
		this.canvas_ = canvas ;
		this.ctx_ = this.canvas_.getContext('2d');
		this.minval_ = minval ;
		this.maxval_ = maxval ;
		this.stepval_ = stepval ;
		this.lvalue = minval ;
		this.rvalue = maxval ;
		this.left_right_ = 2 ;
		this.top_bottom_ = 2 ;
		this.bar_height_ = 10 ;
		this.bar_space_ = 2 ;
		this.background_color = 'lightgray';
		this.fill_color = 'green' ;
		this.outline_color = 'black' ;
		this.top_ticks_ = 15 ;
		this.handle_width_ = 12 ;
		this.left_moving_ = false ;
		this.right_moving_ = false ;

		this.height_ = this.top_bottom_ * 2 + this.bar_height_ + this.top_ticks_ ;

		this.canvas_.onmousedown = this.mouseDown.bind(this) ;
		this.canvas_.onmousemove = this.mouseMove.bind(this) ;
		this.canvas_.onmouseup = this.mouseUp.bind(this);
		this.canvas_.onmouseleave = this.mouseUp.bind(this) ;
	}

	containsHandle(px, x, y) {
		let x1 = px - this.handle_width_ / 2 ;
		let y1 = this.top_bottom_ ;
		let x2 = px + this.handle_width_ / 2 ;
		let y2 = this.top_bottom_ + this.top_ticks_;

		return x >= x1 && x <= x2 && y >= y1 && y <= y2 ;
	}

	clamp(num, lower, upper) {
		return Math.min(Math.max(num, lower), upper);
	}

	mouseDown(ev) {
		const rect = this.canvas_.getBoundingClientRect();
		const x = ev.clientX - rect.left;
		const y = ev.clientY - rect.top;

		console.log("mousedown " + x + ", " + y) ;

		if (this.containsHandle(this.userValueToPixels(this.lvalue), x, y)) {
			this.left_moving_ = true ;
		}
		else if (this.containsHandle(this.userValueToPixels(this.rvalue), x, y)) {
			this.right_moving_ = true ;
		}
	}

	mouseUp(ev) {
		console.log("mouseup") ;
		this.left_moving_ = false ;
		this.right_moving_ = false ;
	}

	mouseMove(ev) {
		if (this.left_moving_ || this.right_moving_) {
			const rect = this.canvas_.getBoundingClientRect();
			const x = ev.clientX - rect.left;

			let uval = this.pixelValueToUser(x) ;
			console.log('mousemove pval=' + x + ', uval=' + uval + ', pval=' + this.userValueToPixels(uval)) ;

			if (this.left_moving_) {
				this.lvalue = this.clamp(uval, this.minval_, this.maxval_);
				this.draw() ;
			}
			else if (this.right_moving_) {
				this.rvalue = this.clamp(uval, this.minval_, this.maxval_);
				this.draw() ;
			}
		}
	}

	userValueToPixels(uval) {
		let pcnt = (uval - this.minval_) / (this.maxval_ - this.minval_) ;
		let pval = this.left_right_ * 2 + this.mleft_.width + pcnt * this.bwidth_ ;

		return pval ;
	}

	pixelValueToUser(pval) {
		let pcnt = (pval - this.left_right_ * 2 - this.mleft_.width) / this.bwidth_ ;
		let uval = this.minval_ + pcnt * (this.maxval_ - this.minval_) ;

		return uval ;
	}

	drawHandle(px) {
		this.ctx_.moveTo(px - this.handle_width_ / 2, this.top_bottom_) ;
		this.ctx_.lineTo(px + this.handle_width_ / 2, this.top_bottom_) ;
		this.ctx_.lineTo(px, this.top_bottom_ + this.top_ticks_) ;
		this.ctx_.lineTo(px - this.handle_width_ / 2, this.top_bottom_) ;
		this.ctx_.fillStyle = 'green' ;
		this.ctx_.fill() ;
	}

	draw() {
		this.canvas_.height = this.height_ ;
		this.canvas_.width = this.canvas_.parentElement.offsetWidth;

		this.ctx_.font = '18px serif' ;
		let left = this.lvalue.toFixed(1);
		this.mleft_ = this.ctx_.measureText(left) ;
		let right = this.rvalue.toFixed(1) ;
		this.mright_ = this.ctx_.measureText(right) ;
		this.bwidth_ = this.canvas_.width - this.mleft_.width - this.mright_.width - this.left_right_ * 4 ;

		//
		// Draw the left and right text
		//
		this.ctx_.strokeText(left, this.left_right_, this.canvas_.height - this.top_bottom_) ;
		this.ctx_.strokeText(right, this.left_right_ * 3 + this.mleft_.width + this.bwidth_, this.canvas_.height - this.top_bottom_) ;

		//
		// Fill the bar
		//
		this.ctx_.fillStyle = this.background_color ;
		this.ctx_.fillRect(this.left_right_ * 2 + this.mleft_.width, this.top_bottom_ + this.top_ticks_, this.bwidth_, this.bar_height_) ;

		//
		// Outline the bar
		//
		this.ctx_.strokeStyle = this.outline_color ;
		this.ctx_.strokeRect(this.left_right_ * 2 + this.mleft_.width, this.top_bottom_ + this.top_ticks_, this.bwidth_, this.bar_height_) ;

		this.ctx_.fillStyle = this.fill_color ;
		let leftpx = this.userValueToPixels(this.lvalue) ;
		let rightpx = this.userValueToPixels(this.rvalue) ;
		this.ctx_.fillRect(leftpx, this.top_bottom_ + this.top_ticks_ + this.bar_space_, rightpx - leftpx, this.bar_height_ - 2 * this.bar_space_) ;

		//
		// Draw the ticks
		//
		let grid = this.minval_ + this.stepval_ ;
		while (grid < this.maxval_) {
			let px = this.userValueToPixels(grid) ;
			this.ctx_.moveTo(px, this.top_bottom_) ;
			this.ctx_.lineTo(px, this.top_bottom_ + this.top_ticks_) ;
			this.ctx_.stroke() ;

			grid += this.stepval_ ;
		}

		//
		// Draw the left handle
		//
		let px = this.userValueToPixels(this.lvalue) ;
		this.drawHandle(px) ;

		//
		// Draw the rigth handle
		//
		px = this.userValueToPixels(this.rvalue) ;
		this.drawHandle(px) ;
	}
}


class FieldBasedView extends XeroView {
	static ScrollBarHeight = 16 ;

	constructor(div, viewtype) {
		super(div, viewtype);
	}

	loadImages() {
		if (this.image_descs_) {
			for (let im of this.image_descs_) {
				let imagedata = im.data;
				im.image_ = document.createElement('img');
				im.loaded_ = false;
				im.image_.src = `data:image/jpg;base64,${imagedata}`
				im.image_.onload = this.imageLoadComplete.bind(this, im);
			}
		}
	}

	imageLoadComplete(im) {
		im.loaded_ = true;
		this.image_ = this.image_descs_[0];
		this.drawScreen();
	}

	findImage(name) {
		if (this.image_descs_) {
			for (let im of this.image_descs_) {
				if (im.name === name) {
					return im;
				}
			}
		}

		return undefined;
	}

	computeScaleFactor() {
		//
		// Force the canvas to the size of its parent
		//
		this.canvas_.width = this.canvas_.parentElement.offsetWidth;
		this.canvas_.height = this.canvas_.parentElement.offsetHeight;

		//
		// Calculate the aspect ratios of the image and canvas
		//
		const imageAspectRatio = this.image_.image_.width / this.image_.image_.height;
		const canvasAspectRatio = this.canvas_.width / this.canvas_.height;

		this.scaleFactor_ = 1;

		// Determine how to scale the image based on aspect ratios
		if (imageAspectRatio > canvasAspectRatio) {
			// Image is wider than canvas, fit to width
			this.scaleFactor_ = this.canvas_.width / this.image_.image_.width;
		} else {
			// Image is taller than canvas, fit to height
			this.scaleFactor_ = this.canvas_.height / this.image_.image_.height;
		}

		this.scaledWidth_ = this.image_.image_.width * this.scaleFactor_;
		this.scaledHeight_ = this.image_.image_.height * this.scaleFactor_;
	}

	fieldToImagePt(pt) {
		let imwidth = this.bottomright.x - this.topleft.x;
		let imheight = this.bottomright.y - this.topleft.y;

		let fpcntx = pt.x / this.fieldsize.width;
		let fpcnty = pt.y / this.fieldsize.height;

		let impixw = fpcntx * imwidth;
		let impixh = fpcnty * imheight;

		let imx = impixw + this.topleft.x;
		let imy = this.bottomright.y - impixh;

		return new XeroPoint(imx, imy);
	}

	fieldToImageSize(sz) {
		let imwidth = this.bottomright.x - this.topleft.x;
		let imheight = this.bottomright.y - this.topleft.y;

		let width = sz.width / this.fieldsize.width * imwidth;
		let height = sz.height / this.fieldsize.height * imheight;

		return new XeroSize(width, height);
	}

	imageToCanvasPt(pt) {
		let cx = pt.x * this.scaleFactor_;
		let cy = pt.y * this.scaleFactor_;

		return new XeroPoint(cx, cy);
	}

	imageToCanvasSize(sz) {
		return new XeroSize(sz.width * this.scaleFactor_, sz.height * this.scaleFactor_);
	}

	fieldToCanvasPt(pt) {
		return this.imageToCanvasPt(this.fieldToImagePt(pt));
	}

	fieldToCanvasSize(sx) {
		return this.imageToCanvasSize(this.fieldToImageSize(sx));
	}

	drawImageOnCanvas() {
		// Clear the canvas
		this.ctx_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);

		// Draw the image on the canvas, centered and scaled
		this.ctx_.drawImage(this.image_.image_, 0, 0, this.scaledWidth_, this.scaledHeight_);
	}
}

class ZebraView extends FieldBasedView {
	constructor(div, viewtype) {
		super(div, viewtype);

		this.seltype_ = '';
		this.target_ = '' ;

		this.sizesInited_ = false;
		this.createWindowLayout();
		this.registerCallback('send-zebra-data', this.formCallback.bind(this));
		window.scoutingAPI.send("get-zebra-data");
	}

	matchToMatchTitle(m) {
		return m.comp_level + '-' + m.set_number + '-' + m.match_number ;
	}

	teamRadioCB(ev) {
		if (ev.target.checked && this.seltype_ != 'team') {
			this.seltype_ = 'team';
			this.setTeamChoices();
			this.drawScreen() ;
		}
	}

	matchRadioCB(ev) {
		if (ev.target.checked && this.seltype_ != 'match') {
			this.seltype_ = 'match';
			this.setMatchChoices();
			this.drawScreen() ;
		}
	}

	createWindowLayout() {
		this.zebra_top_ = document.createElement('div');
		this.zebra_top_.className = 'zebra-top';

		this.layout_ = document.createElement('div');
		this.layout_.className = 'zebra-controls';
		this.zebra_top_.append(this.layout_);

		this.div1_ = document.createElement('div') ;
		this.div1_.className = 'zebra-controls-div' ;
		this.layout_.append(this.div1_) ;

		this.text1_ = document.createElement('span') ;
		this.text1_.innerText = 'Step 1: Pick One' ;
		this.div1_.append(this.text1_) ;

		this.team_label_ = document.createElement('label');
		this.team_label_.className = 'zebra-radio-label' ;
		this.team_label_.textContent = 'Team';
		this.team_radio_ = document.createElement('input')
		this.team_radio_.setAttribute('type', 'radio');
		this.team_radio_.name = 'xyzzy';
		this.team_radio_.onchange = this.teamRadioCB.bind(this);
		this.team_label_.append(this.team_radio_);
		this.div1_.append(this.team_label_);

		this.match_label_ = document.createElement('label');
		this.match_label_.className = 'zebra-radio-label' ;
		this.match_label_.textContent = 'Match';
		this.match_radio_ = document.createElement('input')
		this.match_radio_.setAttribute('type', 'radio');
		this.match_radio_.name = 'xyzzy';
		this.match_radio_.onchange = this.matchRadioCB.bind(this);
		this.match_label_.append(this.match_radio_);
		this.div1_.append(this.match_label_);

		this.team_radio_.checked = true;

		this.div2_ = document.createElement('div') ;
		this.div2_.className = 'zebra-controls-div' ;
		this.layout_.append(this.div2_) ;

		this.selector_ = new XeroSelector('Step 2: Pick A Team', true);
		this.div2_.append(this.selector_.detail);

		this.div3_ = document.createElement('div') ;
		this.div3_.className = 'zebra-controls-div' ;
		this.layout_.append(this.div3_) ;

		this.selector2_ = new XeroSelector('Step 3: Pick Matches For Team', false)
		this.div3_.append(this.selector2_.detail);

		let canvas = document.createElement('canvas') ;
		canvas.className = 'zebra-time-select' ;
		this.time_ctrl_ = new TwoEndedSlider(canvas, 0.0, this.getMaxTime(), 15.0) ;
		this.zebra_top_.append(canvas) ;

		this.canvas_ = document.createElement('canvas');
		this.canvas_.className = 'zebra-canvas';
		this.zebra_top_.append(this.canvas_);
	}

	teamCompareFunction(a, b) {
		let anum ;
		let bnum ;

		if (typeof a === 'string' && a.startsWith('frc')) {
			anum = +a.substring(3) ;
		}
		else {
			anum = +a ;
		}

		if (typeof b === 'string' && b.startsWith('frc')) {
			bnum = +b.substring(3) ;
		}
		else {
			bnum = +b ;
		}

		return anum - bnum ;
	}

	getAllTeams() {
		let teamlist = [];
		for (let match of this.data_) {
			for (let i = 0; i < 3; i++) {
				if (match) {
					if (!teamlist.includes(match.alliances.red[i].team_key)) {
						teamlist.push(match.alliances.red[i].team_key);
					}
					if (!teamlist.includes(match.alliances.blue[i].team_key)) {
						teamlist.push(match.alliances.blue[i].team_key);
					}
				}
			}
		}

		teamlist.sort(this.teamCompareFunction.bind(this));
		return teamlist;
	}

	matchSelectedForTeamCB(arg) {
		this.drawScreen() ;
	}

	getMatchesByTeam() {
		let mat = [] ;

		for(let m of this.data_) {
			if (m) {
				for(let i = 0 ; i < 3 ; i++) {
					if (m.alliances.red[i].team_key == this.target_) {
						mat.push(this.matchToMatchTitle(m));
						break ;
					}

					if (m.alliances.blue[i].team_key == this.target_) {
						mat.push(this.matchToMatchTitle(m)) ;
						break ;
					}
				}
			}
		}

		return mat ;
	}

	teamSelectedCB(arg) {
		this.target_ = arg.target.xerodata ;
		let matches = this.getMatchesByTeam() ;
		this.selector2_.addDataToSelectors(matches, this.matchSelectedForTeamCB.bind(this)) ;
		this.selector2_.selectAll() ;
		this.drawScreen() ;
	}

	mapMatchType(mtype) {
        let ret= -1 ;

        if (mtype === 'f') {
            ret = 3 ;
        }
        else if (mtype === 'sf') {
            ret = 2 ;
        }
        else {
            ret = 1 ;
        }

        return ret;
    }

    sortCompFun(a, b) {
		let regex = /([a-z]+)-([0-9]+)-([0-9]+)/ ;
        let ret = 0;

		let areg = regex.exec(a) ;
		let breg = regex.exec(b) ;

		if (!areg || !breg || areg.length != 4 || breg.length != 4) {
			return 0 ;
		}

        let atype = this.mapMatchType(areg[1]) ;
        let btype = this.mapMatchType(breg[1]) ;

        if (atype < btype) {
            ret = -1;
        }
        else if (atype > btype) {
            ret = 1;
        }
        else {
            let amat = +areg[2] ;
            let bmat = +breg[2] ;
            if (amat < bmat) {
                ret = -1;
            }
            else if (amat > bmat) {
                ret = 1;
            }
            else {
                let aset = +areg[3] ;
                let bset = +breg[3] ;
                if (aset < bset) {
                    ret = -1;
                }
                else if (aset > bset) {
                    ret = 1;
                }
                else {
                    ret = 0;
                }
            }
        }
        return ret;
    }

	setTeamChoices() {
		this.seltype_ = 'team' ;
		this.selector_.reset() ;
		this.selector_.setTitle('Step 2: Pick A Specific Team');
		let teams = this.getAllTeams();
		this.selector_.addDataToSelectors(teams, this.teamSelectedCB.bind(this));
		this.target_ = teams[0] ;
		this.selector_.select(teams[0]) ;

		this.selector2_.reset() ;
		this.selector2_.setTitle('Step 3: Select Matches For Selected Team');
	}

	findMatchByTitle(title) {
		for(let m of this.data_) {
			if (m) {
				let mtitle = this.matchToMatchTitle(m) ;
				if (mtitle === this.target_) {
					return m ;
				}
			}
		}

		return undefined ;
	}

	getTeamsInMatch(arg) {
		let ret = [] ;
		let m = this.findMatchByTitle(this.target_) ;
		if (m) {
			for(let i = 0 ; i < 3 ; i++) {
				ret.push(m.alliances.red[i].team_key); 
				ret.push(m.alliances.blue[i].team_key) ;
			}
		}

		return ret;
	}

	teamSelectedForMatchCB(arg) {
		this.drawScreen() ;
	}

	matchSelectedCB(arg) {
		this.target_ = arg.target.xerodata ;
		let teams = this.getTeamsInMatch() ;
		this.selector2_.addDataToSelectors(teams, this.teamSelectedForMatchCB.bind(this)) ;
		this.selector2_.selectAll() ;
		this.drawScreen() ;
	}

	getAllMatches() {
		let matlist = [] ;
		for(let m of this.data_) {
			if (m) {
				let text = this.matchToMatchTitle(m) ;
				matlist.push(text) ;
			}
		}
		matlist.sort(this.sortCompFun.bind(this)) ;
		return matlist ;
	}

	setMatchChoices() {
		this.seltype_ = 'match' ;
		this.selector_.reset() ;
		this.selector_.setTitle('Step 2: Pick A Specific Match');
		let matches = this.getAllMatches();
		this.selector_.addDataToSelectors(matches, this.matchSelectedCB.bind(this));
		this.target_ = matches[0] ;
		this.selector_.select(matches[0]) ;

		this.selector2_.reset() ;
		this.selector2_.setTitle('Step 3: Pick Teams From Selected Match')
	}

	getTeamData() {
		let data = [] ;

		for(let m of this.data_) {
			let obj = undefined ;

			if (m) {
				for(let i = 0 ; i < 3 ; i++) {
					console.log(i) ;
					if (m.alliances.red[i].team_key === this.target_) {
						obj = {
							xs: m.alliances.red[i].xs,
							ys: m.alliances.red[i].ys
						} ;
					}
					else if (m.alliances.blue[i].team_key === this.target_) {
						obj = {
							xs: m.alliances.blue[i].xs,
							ys: m.alliances.blue[i].ys
						} ;
					}
				}

				if (obj) {
					obj.times = m.times ;
					data.push(obj) ;
				}
			}
		}

		return data ;
	}

	//
	// For a given team, scan the matches and get the data for the seleced team, but
	// only if the match is in the matches list (the set of matches selected by the user).
	//
	getMatchsForTeamData(team, matches) {
		let ret = [] ;
		for(let m of this.data_) {
			if (m) {
				let title = this.matchToMatchTitle(m) ;
				if (matches.includes(title)) {
					//
					// Now, find the right slot for the team in question
					//
					for(let i = 0 ; i < 3 ; i++) {
						if (m.alliances.red[i].team_key === team) {
							let obj = {
								team_key: m.alliances.red[i].team_key,
								match: title,
								times: m.times,
								xs: m.alliances.red[0].xs,
								ys: m.alliances.red[0].ys
							}
							ret.push(obj) ;
							break ;
						}
						
						if (m.alliances.blue[i].team_key === team) {
							let obj = {
								team_key: m.alliances.blue[i].team_key,
								match: title,
								times: m.times,
								xs: m.alliances.blue[0].xs,
								ys: m.alliances.blue[0].ys
							}
							ret.push(obj) ;
							break ;
						}

					}
				}
			}
		}

		return ret ;
	}

	//
	// Get the data for the set of selected team from the target match
	//
	getTeamsForMatchData(target, teams) {
		let data = [] ;
		let m = this.findMatchByTitle(target) ;
		if (m) {
			for(let i = 0 ; i < 3 ; i++) {
				if (teams.includes(m.alliances.red[i].team_key)) {
					let obj = {
						team_key: m.alliances.red[i].team_key,
						match: target,
						times: m.times,
						xs: m.alliances.red[0].xs,
						ys: m.alliances.red[0].ys
					}
					data.push(obj) ;
				}

				if (teams.includes(m.alliances.blue[i].team_key)) {
					let obj = {
						team_key: m.alliances.blue[i].team_key,
						match: title,
						times: m.times,
						xs: m.alliances.blue[0].xs,
						ys: m.alliances.blue[0].ys
					}
					data.push(obj) ;					
				}
			}
		}

		return data ;
	}

	draw(data) {
	}
	
	drawMatch() {
		let teams = this.selector2_.getSelectedItems() ;
		let drawdata = this.getTeamsForMatchData(this.target_, teams) ;
		this.draw(drawdata) ;
	}

	drawTeam() {
		let matches = this.selector2_.getSelectedItems() ;
		let drawdata = this.getMatchsForTeamData(this.target_, matches) ;
		this.draw(drawdata) ;
	}

	drawZebraCanvas() {
		this.ctx_ = this.canvas_.getContext('2d');
		this.drawImageOnCanvas();

		if (this.seltype_ === 'match') {
			this.drawMatch() ;
		}
		else if (this.seltype_ === 'team') {
			this.drawTeam() ;
		}
	}

	getMaxTime() {
		//
		// TODO: search all matches and get the max times from the times array
		//
		return 135 ;
	}

	drawScreen() {
		if (!this.sizesInited_) {
			this.sizesInited_ = true;
			this.computeScaleFactor();
		}
		this.time_ctrl_.draw() ;
		this.drawZebraCanvas() ;
	}

	render() {
		this.reset();
		this.top_.append(this.zebra_top_);
	}

	formCallback(arg) {
		let obj = arg[0];
		this.image_descs_ = obj.images;
		this.data_ = obj.data;
		this.setTeamChoices();
		this.loadImages();
	}
}

window.scoutingAPI.receive("send-zebra-data", (args) => { XeroView.callback_mgr_.dispatchCallback('send-zebra-data', args); });

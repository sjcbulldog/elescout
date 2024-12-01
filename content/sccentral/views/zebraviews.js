
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
		}
	}

	matchRadioCB(ev) {
		if (ev.target.checked && this.seltype_ != 'match') {
			this.seltype_ = 'match';
			this.setMatchChoices();
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

		this.slider_ = document.createElement('input') ;
		this.slider_.type = 'range' ;
		this.slider_.className = 'zebra-range' ;
		this.slider_.value = 0 ;
		this.zebra_top_.append(this.slider_) ;

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

		return a - b ;
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
		console.log(arg) ;
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
		console.log(args) ;
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
		let m = this.findMatchByName(target) ;
		if (m) {
			for(let i = 0 ; i < 3 ; i++) {
				if (teams.includes(m.alliances.red[i].team_key)) {
					let obj = {
						team_key: m.alliances.blue[i].team_key,
						match: title,
						times: m.times,
						xs: m.alliances.blue[0].xs,
						ys: m.alliances.blue[0].ys
					}
				}

				if (teams.includes(m.alliances.blue[i].team_key)) {
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

	setRangeTicks() {
		let maxval = this.getMaxTime() ;
		this.slider_.max = maxval ;

		let dset = document.createElement('datalist') ;
		dset.id = 'timeticks' ;
		for(let i = 0 ; i <= this.getMaxTime() ; i += 15.0) {
			let opt = document.createElement('option') ;
			opt.value = i ;
			dset.append(opt) ;
		}

		this.slider_.append(dset) ;
		this.slider_.setAttribute('list', 'timeticks') ;
	}

	drawScreen() {
		if (!this.sizesInited_) {
			this.sizesInited_ = true;
			this.computeScaleFactor();
			this.setRangeTicks() ;
		}
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

import { SCBase, XeroAppType, XeroVersion } from "./scbase";
import { BlueAlliance } from "../extnet/ba";
import { Project } from "../project/project";
import { BrowserWindow, dialog, Menu, MenuItem, shell } from "electron";
import { TCPSyncServer } from "../sync/tcpserver";
import { PacketObj } from "../sync/packetobj";
import { PacketType } from "../sync/packettypes";
import { MatchDataModel } from "../model/matchmodel";
import { BAEvent, BAMatch, BATeam } from "../extnet/badata";
import { TeamDataModel } from "../model/teammodel";
import { StatBotics } from "../extnet/statbotics";
import { FormInfo } from "../comms/formifc";
import { ScoutingData } from "../comms/resultsifc";
import { DataSet, MatchSet } from "../project/datasetmgr";
import { TabletData } from "../project/tabletmgr";
import { ProjColConfig } from "../project/datamgr";
import { TeamNickNameNumber } from "../project/teammgr";
import { ManualMatchData } from "../project/matchmgr";
import { GraphInfo, GraphConfig } from "../project/graphmgr";
import { GraphData } from "../comms/graphifc";
import { ProjPicklistNotes } from "../project/picklistmgr";
import Papa from "papaparse";
import * as fs from "fs";
import * as path from "path";

export interface GraphDataRequest {
	ds: string,
	data: {
		leftteam: string[];
		leftmatch: string[];
		rightteam: string[];
		rightmatch: string[];
	};
}

export interface PickListColData {
	field: string,
	teams: number[],
	data: (number|string|Error)[]
};

export class SCCentral extends SCBase {
	private static readonly recentFilesSetting: string = "recent-files";

	private static readonly matchStatusFields: string[] = [
		"comp_level",
		"set_number",
		"match_number",
		"team_key",
		"r1",
		"r2",
		"r3",
		"b1",
		"b2",
		"b3",
	];

	private static readonly openExistingEvent: string = "open-existing";
	private static readonly closeEvent: string = "close-event";
	private static readonly createNewEvent: string = "create-new";
	private static readonly selectTeamForm: string = "select-team-form";
	private static readonly selectMatchForm: string = "select-match-form";
	private static readonly assignTablets: string = "assign-tablets";
	private static readonly loadBAEvent: string = "load-ba-event";
	private static readonly viewInit: string = "view-init";
	private static readonly viewDataSets: string = "view-datasets";
	private static readonly viewPicklist: string = 'view-picklist' ;
	private static readonly lockEvent: string = "lock-event";
	private static readonly editTeams: string = "edit-teams";
	private static readonly editMatches: string = "edit-matches";
	private static readonly importTeams: string = "import-teams";
	private static readonly importMatches: string = "import-matches";
	private static readonly viewTeamForm: string = "view-team-form";
	private static readonly viewTeamStatus: string = "view-team-status";
	private static readonly viewTeamDB: string = "view-team-db";
	private static readonly viewMatchForm: string = "view-match-form";
	private static readonly viewMatchStatus: string = "view-match-status";
	private static readonly viewMatchDB: string = "view-match-db";
	private static readonly viewPreviewForm: string = "view-preview-form";
	private static readonly viewHelp: string = "view-help";
	private static readonly viewAbout: string = "view-about";
	private static readonly viewTeamGraph: string = "view-team-graph";
	private static readonly viewFormulas: string = "view-formulas";
	private static readonly viewMultiView: string = "view-multi-view";
	private static readonly viewSpider: string = "view-spider" ;
	private static readonly viewSingleTeamSummary: string = 'view-single-team-summary' ;

	private project_?: Project = undefined;
	private ba_?: BlueAlliance = undefined;
	private statbotics_?: StatBotics = undefined;
	private baloading_: boolean;
	private tcpsyncserver_?: TCPSyncServer = undefined;
	private previewfile_?: string = undefined;
	private baevents_?: BAEvent[];
	private menuitems_: Map<string, MenuItem> = new Map<string, MenuItem>();
	private year_?: number;
	private msg_?: string;
	private color_ : string ;
	private reversed_ : boolean ;
	private redMenuItem_ : MenuItem | undefined ;
	private blueMenuItem_ : MenuItem | undefined ;
	private reverseImage_: MenuItem | undefined ;
	private lastformview_? : string ;

	constructor(win: BrowserWindow, args: string[]) {
		super(win, "server");

		this.color_ = 'blue' ;
		this.reversed_ = false ;

		for (let arg of args) {
			if (arg.startsWith("--year:")) {
				this.year_ = +arg.substring(7);
			}
		}

		if (!this.year_) {
			let dt = new Date();
			this.year_ = dt.getFullYear();
		}

		this.statbotics_ = new StatBotics(this.year_);

		this.baloading_ = true;
		this.ba_ = new BlueAlliance(this.year_);
		this.ba_
			.init()
			.then((up) => {
				if (!up) {
					this.ba_ = undefined;
				} else {
					this.baloading_ = false;
				}
			})
			.catch((err) => {
				this.ba_ = undefined;
			});
	}

	public get applicationType(): XeroAppType {
		return XeroAppType.Central;
	}

	public basePage(): string {
		return "content/sccentral/central.html";
	}

	public canQuit(): boolean {
		let ret: boolean = true;

		if (this.project_ && this.project_.data_mgr_) {
			ret = this.project_.data_mgr_.close() ;
		}
		return ret;
	}

	private updateView() : boolean {
		let ret: boolean = false ;

		if (this.lastview_ && this.lastview_ === 'formview' && this.lastformview_) {
			this.setView('formview', this.lastformview_) ;
			ret = true ;
		}

		return ret ;
	}

	private colorMenuItem(color: string) {
		this.color_ = color ;

		if (!this.updateView()) {
			if (this.project_) {
				this.setView('info') ;
			}
			else {

				this.setView('empty') ;
			}
		}
	}

	private reverseImage() {
		this.reversed_ = this.reverseImage_!.checked ;
		if (!this.updateView()) {
			if (this.project_) {
				this.setView('info') ;
			}
			else {

				this.setView('empty') ;
			}
		}
	}

	public createMenu(): Menu | null {
		let ret: Menu | null = new Menu();
		let index = 0;

		let filemenu: MenuItem = new MenuItem({
			type: "submenu",
			label: "File",
			role: "fileMenu",
		});

		let createitem: MenuItem = new MenuItem({
			type: "normal",
			label: "Create Event ...",
			id: "create-event",
			click: () => {
				this.executeCommand(SCCentral.createNewEvent);
			},
		});
		filemenu.submenu!.insert(index++, createitem);
		this.menuitems_.set("file/create", createitem);

		let openitem: MenuItem = new MenuItem({
			type: "normal",
			label: "Open Event ...",
			id: "open-event",
			click: () => {
				this.executeCommand(SCCentral.openExistingEvent);
			},
		});
		filemenu.submenu!.insert(index++, openitem);
		this.menuitems_.set("file/open", openitem);

		if (this.hasSetting(SCCentral.recentFilesSetting)) {
			let recent: MenuItem = new MenuItem({
				type: "submenu",
				label: "Recent",
				submenu: new Menu(),
				click: () => {
					this.executeCommand(SCCentral.openExistingEvent);
				},
			});
			filemenu.submenu!.insert(index++, recent);

			let recents = this.getSetting(SCCentral.recentFilesSetting);

			for (let one of recents) {
				let item: MenuItem = new MenuItem({
					type: "normal",
					label: one,
					click: () => {
						let evpath = path.join(one, "event.json");
						Project.openEvent(this.logger_, evpath, this.year_!)
							.then((p) => {
								this.addRecent(p.location);
								this.project_ = p;
								this.updateMenuState(true);
								if (this.project_  && this.project_.isLocked()) {
									this.startSyncServer();
								}
								this.setView("info");
								this.sendNavData();
							})
							.catch((err) => {
								let errobj: Error = err as Error;
								dialog.showErrorBox("Open Project Error", errobj.message);
							});
					},
				});
				recent.submenu!.append(item);
			}
		}

		filemenu.submenu!.insert(index++, new MenuItem({ type: "separator" }));

		let closeitem: MenuItem = new MenuItem({
			type: "normal",
			label: "Close Event",
			id: "close-event",
			enabled: false,
			click: () => {
				this.executeCommand(SCCentral.closeEvent);
			},
		});
		filemenu.submenu!.insert(index++, closeitem);
		this.menuitems_.set("file/close", closeitem);

		ret.append(filemenu);

		let optionmenu: MenuItem = new MenuItem({
			type: 'submenu',
			label: 'Options',
			submenu: new Menu()
		}) ;

		this.blueMenuItem_ = new MenuItem({
			type: 'radio',
			label: 'Blue',
			click: this.colorMenuItem.bind(this, 'blue')
		}) ;
		optionmenu.submenu!.append(this.blueMenuItem_) ;

		this.redMenuItem_ = new MenuItem({
			type: 'radio',
			label: 'Red',
			click: this.colorMenuItem.bind(this, 'red')
		}) ;
		optionmenu.submenu!.append(this.redMenuItem_) ;

		this.reverseImage_ = new MenuItem({
			type: 'checkbox',
			label: 'Reverse',
			checked: false,
			click: this.reverseImage.bind(this)
		}) ;
		optionmenu.submenu!.append(this.reverseImage_) ;
		ret.append(optionmenu);

		let datamenu: MenuItem = new MenuItem({
			type: "submenu",
			label: "Data",
			submenu: new Menu(),
		});

		let downloadBAData: MenuItem = new MenuItem({
			type: "normal",
			label: "Import Data From Blue Alliance",
			enabled: false,
			click: () => {
				this.importBlueAllianceData();
			},
		});
		datamenu.submenu?.append(downloadBAData);
		this.menuitems_.set("data/loadbadata", downloadBAData);

		let downloadSTData: MenuItem = new MenuItem({
			type: "normal",
			label: "Import Data From Statbotics",
			enabled: false,
			click: () => {
				this.importStatboticsData();
			},
		});
		datamenu.submenu?.append(downloadSTData);
		this.menuitems_.set("data/loadstdata", downloadSTData);

		let importGraphDefns: MenuItem = new MenuItem({
			type: "normal",
			label: "Import Graph Definitions",
			enabled: false,
			click: () => {
				this.importGraphDefinitions();
			},
		});
		datamenu.submenu?.append(importGraphDefns);
		this.menuitems_.set("data/graphdefn", importGraphDefns);		

		datamenu.submenu?.append(new MenuItem({ type: "separator" }));

		let exportTeamData: MenuItem = new MenuItem({
			type: "normal",
			label: "Export Team Data",
			enabled: false,
			click: () => {
				this.doExportData(TeamDataModel.TeamTableName);
			},
		});
		datamenu.submenu?.append(exportTeamData);
		this.menuitems_.set("data/exportteam", exportTeamData);

		let exportMatchData: MenuItem = new MenuItem({
			type: "normal",
			label: "Export Match Data",
			enabled: false,
			click: () => {
				this.doExportData(MatchDataModel.MatchTableName);
			},
		});
		datamenu.submenu?.append(exportMatchData);
		this.menuitems_.set("data/exportmatch", exportMatchData);
	
		let exportPicklistData = new MenuItem({
			type: "normal",
			label: "Export All Picklist Data",
			enabled: false,
			click: () => {
				this.doExportPicklist();
			},
		});
		datamenu.submenu?.append(exportPicklistData);
		this.menuitems_.set("data/exportpicklist", exportPicklistData);

		datamenu.submenu?.append(new MenuItem({ type: "separator" }));
		let importFormulas = new MenuItem({
			type: "normal",
			label: "Import Formulas",
			enabled: false,
			click: () => {
				this.importFormulasFromFile();
			},
		});
		datamenu.submenu?.append(importFormulas);
		this.menuitems_.set("data/importformulas", importFormulas);

		ret.append(datamenu);

		let viewmenu: MenuItem = new MenuItem({
			type: "submenu",
			role: "viewMenu",
		});
		ret.append(viewmenu);

		let helpmenu: MenuItem = new MenuItem({
			type: "submenu",
			label: "Help",
			submenu: new Menu(),
		});

		let helpitem: MenuItem = new MenuItem({
			type: "normal",
			label: "Help",
			id: "help-help",
			click: () => {
				this.executeCommand(SCCentral.viewHelp);
			},
		});
		helpmenu.submenu!.append(helpitem);

		let aboutitem: MenuItem = new MenuItem({
			type: "normal",
			label: "About",
			id: "help-about",
			click: () => {
				this.executeCommand(SCCentral.viewAbout);
			},
		});
		helpmenu.submenu!.append(aboutitem);

		ret.append(helpmenu);

		return ret;
	}

	public windowCreated(): void {}

	private enableMenuItem(item: string, state: boolean) {
		if (this.menuitems_.has(item)) {
			this.menuitems_.get(item)!.enabled = state;
		}
	}

	private updateMenuState(hasEvent: boolean) {
		let items: string[] = [
			"data/exportmatch",
			"data/exportteam",
			"data/loadbadata",
			"data/loadstdata",
			"data/exportpicklist",
			"data/graphdefn",
			"file/close",
			"data/importformulas",
		];
		for (let item of items) {
			this.enableMenuItem(item, hasEvent);
		}
	}

	private doExportData(table: string) {
		if (!this.project_ || !this.project_.isInitialized()) {
			dialog.showErrorBox("Export Data", "No event has been loaded - cannot export data");
			return;
		}

		var fpath = dialog.showSaveDialog({
			title: "Select CSV Output File",
			message: "Select file for CSV output for table '" + table + "'",
			filters: [
				{
					extensions: ["csv"],
					name: "CSV File",
				},
			],
			properties: ["showOverwriteConfirmation"],
		});

		fpath.then((pathname) => {
			if (!pathname.canceled) {
				this.project_!.data_mgr_!.exportToCSV(pathname.filePath, table);
			}
		});
	}

	public sendForm(arg: string) {
		let ret : FormInfo = {
			message: undefined,
			form: undefined,
			reversed: undefined,
			color: undefined
		} ;

		let filename: string ;
		let title: string ;
		let good: boolean = true ;

		if (arg === 'preview') {
			filename = this.previewfile_! ;
			title = 'Preview Form' ;
		}
		else if (arg === 'team') {
			if (this.project_ && this.project_.isInitialized() && this.project_.form_mgr_!.hasForms()) {
				filename = this.project_.form_mgr_!.getTeamFormFullPath()! ;
				title = 'Team Form' ;
			}
			else {
				good = false ;
				ret.message = 'No team form has been defined yet.' ;
			}
		}
		else if (arg === 'match') {
			if (this.project_ && this.project_.isInitialized() && this.project_.form_mgr_!.hasForms()) {
				filename = this.project_.form_mgr_!.getTeamFormFullPath()! ;
				title = 'Match Form' ;
			}
			else {
				good = false ;
				ret.message = 'No match form has been defined yet.' ;
			}
		}
		else {
			good = false;
			ret.message = 'Internal equest for invalid form type' ;
		}

		if (good) {
			let jsonstr = fs.readFileSync(filename!).toString();
			try {
				let jsonobj = JSON.parse(jsonstr);
				ret.form = {
					json: jsonobj,
					type: arg,
					title: title!,
				} ;

				ret.color = this.color_ ;
				ret.reversed = this.reversed_ ;

				this.getImages(ret) ;
			} catch (err) {
				let errobj = err as Error;
				ret.message = errobj.message;
			}
		} else {
			ret.message = "No team form has been set";
		}
		this.sendToRenderer("send-form", ret);
	}

	public async sendMatchStatus() {
		interface data {
			comp_level: string;
			set_number: number;
			match_number: number;
			red1: number;
			redtab1: string;
			redst1: string;
			red2: number;
			redtab2: string;
			redst2: string;
			red3: number;
			redtab3: string;
			redst3: string;
			blue1: number;
			bluetab1: string;
			bluest1: string;
			blue2: number;
			bluetab2: string;
			bluest2: string;
			blue3: number;
			bluetab3: string;
			bluest3: string;
		}

		try {
			let ret: data[] = [];

			if (this.project_ && this.project_.isInitialized() && this.project_.match_mgr_!.hasMatches()) {
				for (let one of this.project_.match_mgr_!.getMatches()) {
					let r1 = one.alliances.red.team_keys[0];
					let r2 = one.alliances.red.team_keys[1];
					let r3 = one.alliances.red.team_keys[2];
					let b1 = one.alliances.blue.team_keys[0];
					let b2 = one.alliances.blue.team_keys[1];
					let b3 = one.alliances.blue.team_keys[2];

					let obj = {
						comp_level: one.comp_level,
						set_number: one.set_number,
						match_number: one.match_number,
						red1: this.keyToTeamNumber(r1),
						redtab1: this.project_!.tablet_mgr_!.findTabletForMatch(
							one.comp_level,
							one.set_number,
							one.match_number,
							r1
						),
						redst1: this.project_!.data_mgr_!.hasMatchScoutingResult(
							one.comp_level,
							one.set_number,
							one.match_number,
							r1
						),
						red2: this.keyToTeamNumber(r2),
						redtab2: this.project_!.tablet_mgr_!.findTabletForMatch(
							one.comp_level,
							one.set_number,
							one.match_number,
							r2
						),
						redst2: this.project_!.data_mgr_!.hasMatchScoutingResult(
							one.comp_level,
							one.set_number,
							one.match_number,
							r2
						),
						red3: this.keyToTeamNumber(r3),
						redtab3: this.project_!.tablet_mgr_!.findTabletForMatch(
							one.comp_level,
							one.set_number,
							one.match_number,
							r3
						),
						redst3: this.project_!.data_mgr_!.hasMatchScoutingResult(
							one.comp_level,
							one.set_number,
							one.match_number,
							r3
						),
						blue1: this.keyToTeamNumber(b1),
						bluetab1: this.project_!.tablet_mgr_!.findTabletForMatch(
							one.comp_level,
							one.set_number,
							one.match_number,
							b1
						),
						bluest1: this.project_!.data_mgr_!.hasMatchScoutingResult(
							one.comp_level,
							one.set_number,
							one.match_number,
							b1
						),
						blue2: this.keyToTeamNumber(b2),
						bluetab2: this.project_!.tablet_mgr_!.findTabletForMatch(
							one.comp_level,
							one.set_number,
							one.match_number,
							b2
						),
						bluest2: this.project_!.data_mgr_!.hasMatchScoutingResult(
							one.comp_level,
							one.set_number,
							one.match_number,
							b2
						),
						blue3: this.keyToTeamNumber(b3),
						bluetab3: this.project_!.tablet_mgr_!.findTabletForMatch(
							one.comp_level,
							one.set_number,
							one.match_number,
							b3
						),
						bluest3: this.project_!.data_mgr_!.hasMatchScoutingResult(
							one.comp_level,
							one.set_number,
							one.match_number,
							b3
						),
					};
					ret.push(obj);
				}
				this.sendToRenderer("send-match-status", ret);
			}
		} catch (err) {
			let errobj: Error = err as Error;
			dialog.showErrorBox(
				"Error",
				"Error retreiving match data - " + errobj.message
			);
		}
	}

	public sendTeamStatus() {
		interface data {
			number: number;
			status: string;
			tablet: string;
			teamname: string;
		}

		let ret: data[] = [];

		if (this.project_ && this.project_.tablet_mgr_!.hasTeamAssignments()) {
			for (let t of this.project_.tablet_mgr_!.getTeamAssignments()) {
				let status: string = this.project_.data_mgr_!.hasTeamScoutingResults(t.team)
					? "Y"
					: "N";
				let team: BATeam | undefined = this.project_.team_mgr_!.findTeamByNumber(t.team);
				if (team) {
					ret.push({
						number: t.team,
						status: status,
						tablet: t.tablet,
						teamname: team.nickname,
					});
				}
			}
		}

		this.sendToRenderer("send-team-status", ret);
	}


	private keyToTeamNumber(key: string) {
		let ret: number = -1;
		let m1 = /^frc[0-9]+$/;
		let m2 = /^[0-9]+$/;

		if (m1.test(key)) {
			ret = +key.substring(3);
		} else if (m2.test(key)) {
			ret = +key;
		}

		return ret;
	}

	private shortenString(str: string | undefined): string | undefined {
		let ret: string | undefined;
		let maxlen = 40;

		if (str) {
			if (str.length > maxlen) {
				ret = "..." + str.substring(str.length - maxlen);
			} else {
				ret = str;
			}
		}

		return ret;
	}

	public sendInfoData(): void {
		if (this.project_ && this.project_.isInitialized()) {
			let obj = {
				location_: this.project_.location,
				bakey_: this.project_.info!.frcev_?.key,
				name_: this.project_.info!.frcev_
					? this.project_.info!.frcev_.name
					: this.project_.info!.name_,
				teamform_: this.project_.form_mgr_?.getTeamFormFullPath(),
				matchform_: this.project_.form_mgr_?.getMatchFormFullPath(),
				tablets_: this.project_.tablet_mgr_?.getTablets(),
				tablets_valid_: this.project_.tablet_mgr_!.areTabletsValid(),
				teams_: this.project_.team_mgr_!.getTeams(),
				matches_: this.project_.match_mgr_!.getMatches(),
				locked_: this.project_.info?.locked_,
				uuid_: this.project_.info?.uuid_,
			};
			this.sendToRenderer("send-info-data", obj);
		}
	}

	public renameFormula(oldname: string, newname: string) : void {
		this.project_?.formula_mgr_?.renameFormula(oldname, newname) ;
	}	

	public updateFormula(name: string, expr: string) : void {
		this.project_?.formula_mgr_?.addFormula(name, expr) ;
	}	

	public deleteFormula(name: string) : void {
		this.project_?.formula_mgr_?.deleteFormula(name) ;
	}

	public sendFormulas() : void {
		this.sendToRenderer('send-formulas', this.project_?.formula_mgr_?.getFormulas()) ;
	}
	
	public sendTeamFieldList() : void {
		this.project_?.data_mgr_?.getTeamColumns()
			.then((cols) => {
				this.sendToRenderer("send-team-field-list", cols);
			})
			.catch((err) => {
				this.logger_.error(
					"error getting columns from database for send-team-field-list",
					err
				);
			});
	}

	public sendMatchFieldList() : void {
		this.project_?.data_mgr_?.getMatchColumns()
			.then((cols) => {
				this.sendToRenderer("send-match-field-list", cols);
			})
			.catch((err) => {
				this.logger_.error(
					"error getting columns from database for send-match-field-list",
					err
				);
			});
	}

	public sendDataSets() : void {
		this.sendToRenderer('send-datasets', this.project_?.dataset_mgr_?.getDataSets()) ;
	}

	public renameDataSet(oldname: string, newname: string) : void {
		this.project_?.dataset_mgr_?.renameDataSet(oldname, newname) ;
		this.sendDataSets() ;
	}

	public updateDataSet(ds: DataSet) : void {
		this.project_?.dataset_mgr_?.updateDataSet(ds) ;
	}

	public deleteDataSet(name: string) : void {
		this.project_?.dataset_mgr_?.deleteDataSet(name)
	}

	public sendTabletData(): void {
		if (this.project_) {
			this.sendToRenderer("send-tablet-data", this.project_.tablet_mgr_!.getTablets());
		}
	}

	public setTabletData(data: TabletData[]) {
		if (this.project_) {
			this.project_?.tablet_mgr_?.setTabletData(data);
			this.setView('info') ;
		}
	}

	public setMatchColConfig(data: ProjColConfig) {
		this.project_?.data_mgr_?.setMatchColConfig(data);
	}

	public setTeamColConfig(data:ProjColConfig) {
		this.project_?.data_mgr_?.setTeamColConfig(data);
	}

	public setTeamData(data: TeamNickNameNumber[]) {
		this.project_?.team_mgr_?.setTeamData(data);
		this.setView('info');
	}

	public setEventName(data: any) {
		this.project_?.setEventName(data);
	}

	public sendTeamData(): void {
		this.sendToRenderer("send-team-data", this.project_?.team_mgr_!.getTeams());
	}

	public setMatchData(data: ManualMatchData[]) {
		this.project_?.match_mgr_?.setMatchData(data);
		this.setView('info') ;
	}

	public sendMatchDB(): void {
		if (this.project_ && this.project_.match_mgr_!.hasMatches()) {
			this.project_.data_mgr_?.getMatchColumns()
				.then((cols) => {
					this.project_!.data_mgr_!.getAllMatchData()
						.then((data) => {
							let dataobj = {
								cols: cols,
								data: data,
							};
							this.sendToRenderer("send-match-col-config",this.project_!.data_mgr_!.getMatchColConfig()) ;
							this.sendToRenderer("send-match-db", dataobj);
						})
						.catch((err) => {});
				})
				.catch((err) => {});
		}
	}

	public sendTeamDB(): void {
		if (this.project_ && this.project_.team_mgr_!.hasTeams()) {
			this.project_.data_mgr_?.getTeamColumns()
				.then((cols) => {
					this.project_?.data_mgr_!.getAllTeamData()
						.then((data) => {
							let dataobj = {
								cols: cols,
								data: data,
							};
							this.sendToRenderer('send-team-col-config', this.project_!.data_mgr_!.getTeamColConfig()) ;
							this.sendToRenderer("send-team-db", dataobj);
						})
						.catch((err) => {
							this.logger_.error(
								"error getting data from database for send-team-db",
								err
							);
						});
				})
				.catch((err) => {
					this.logger_.error(
						"error getting columns from database for send-team-db",
						err
					);
				});
		}
	}

	public sendMatchData(): void {
		if (this.project_ && this.project_.isInitialized() && this.project_.match_mgr_!.hasMatches()) {
			this.sendMatchDataInternal(this.project_.match_mgr_!.getMatches());
		}
	}

	private sendMatchDataInternal(matches: BAMatch[] | undefined): void {
		let data = [];
		if (matches) {
			for (let t of matches) {
				let d = {
					comp_level: t.comp_level,
					set_number: t.set_number,
					match_number: t.match_number,
					red1: this.keyToTeamNumber(t.alliances.red.team_keys[0]),
					red2: this.keyToTeamNumber(t.alliances.red.team_keys[1]),
					red3: this.keyToTeamNumber(t.alliances.red.team_keys[2]),
					blue1: this.keyToTeamNumber(t.alliances.blue.team_keys[0]),
					blue2: this.keyToTeamNumber(t.alliances.blue.team_keys[1]),
					blue3: this.keyToTeamNumber(t.alliances.blue.team_keys[2]),
				};
				data.push(d);
			}
		}
		this.sendToRenderer("send-match-data", data, this.project_?.team_mgr_!.getTeams());
	}

	public sendEventData(): void {
		if (this.project_ && this.isBAAvailable()) {
			this.ba_?.getEvents()
				.then((frcevs: BAEvent[]) => {
					this.baevents_ = frcevs;
					this.sendToRenderer("send-event-data", frcevs);
				})
				.catch((err) => {
					let errobj: Error = err as Error;
					dialog.showMessageBoxSync(this.win_, {
						title: "Load Blue Alliance Event",
						message: errobj.message,
					});
					this.setView("info");
				});
		} else {
			dialog.showErrorBox(
				"Load Blue Alliance Event",
				"The Blue Alliance site is not available"
			);
			this.sendToRenderer("send-event-data", null);
		}
	}

	public async loadBaEventDataError(): Promise<void> {
		this.sendToRenderer("set-status-title", "Blue Alliance Error");
		this.sendToRenderer(
			"set-status-html",
			"Error importing data - invalid request from renderer - internal error"
		);
		this.sendToRenderer("set-status-close-button-visible", true);
		this.setView("info");
	}

	public async loadBaEventData(key: string): Promise<void> {
		if (!this.isBAAvailable()) {
			dialog.showErrorBox(
				"Load Blue Alliance Event",
				"The Blue Alliance site is not available."
			);
			return;
		}

		let fev: BAEvent | undefined = this.getEventFromKey(key);
		if (fev) {
			this.sendToRenderer("set-status-title","Loading event '" + fev.name + "'");
			this.msg_ = "";

			try {
				await this.project_!.loadBAEvent(
					this.ba_!,
					this.statbotics_!,
					fev,
					(text) => {
						this.appendStatusText(text);
					}
				);
				this.sendToRenderer("set-status-close-button-visible", true);
				this.sendNavData();
				this.setView("info");
			} catch (err) {
				let errobj = err as Error;
				this.sendToRenderer("set-status-visible", true);
				this.sendToRenderer("set-status-title", "Blue Alliance Error");
				this.sendToRenderer(
					"set-status-html",
					"Error importing data - " + errobj.message
				);
				this.sendToRenderer("set-status-close-button-visible", true);
				this.setView("info");
			}
		} else {
			this.sendToRenderer("set-status-title", "Blue Alliance Error");
			this.sendToRenderer(
				"set-status-html",
				"Error importing data - no event with key '" + key + "' was found"
			);
			this.sendToRenderer("set-status-close-button-visible", true);
			this.setView("info");
		}
	}

	private async importGraphsDefnFromFile(filename: string) {
		try {
			let proj: Project = await Project.openEvent(this.logger_, filename, this.year_!) ;
			let omitted: string = '' ;
			let count = 0 ;

			for(let gr of proj.graph_mgr_!.getGraphs()) {
				if (gr.name.length > 0) {
					if (!this.project_!.graph_mgr_!.findGraphByName(gr.name)) {
						this.project_!.graph_mgr_!.storeGraph(gr) ;
						count++ ;
					}
					else {
						if (omitted.length > 0) {
							omitted += ', ' ;
						}
						omitted += gr.name ;
					}
				}
			}

			let msg = 'Imported ' + count + ' graphs' ;
			if (omitted.length > 0) {
				msg += ' - omitted graphs ' + omitted + ' as these already exist.' ;
			}
			dialog.showMessageBoxSync(this.win_, {
				title: 'Import Graph Definitions',
				message: msg
			}) ;
		}
		catch(err) {
			let errobj = err as Error ;
			dialog.showMessageBoxSync(this.win_, {
				title: 'Error reading project file',
				message: 'count not ready project file - ' + errobj.message
			}) ;
		}
	}

	private importGraphDefinitions() {
		dialog.showOpenDialog(this.win_, {
			title: 'Open event.json file for event',
			filters: [
				{ name: 'JSON Files', extensions: ['json'] },
				{ name: 'All Files', extensions: ['*']}
			],
			properties: [
				'openFile',
			]
		}).then(result => {	
			if (!result.canceled) {
				this.importGraphsDefnFromFile(result.filePaths[0]) ;
			}
		}) ;
	}

	private importBlueAllianceData() {
		if (!this.project_) {
			let html = "Must create or open a project to import data.";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Error Importing Match Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
			return;
		}

		if (!this.isBAAvailable()) {
			let html = "The Blue Alliance site is not available.";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Error Importing Match Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
			return;
		}

		let fev: BAEvent | undefined = this.project_?.info?.frcev_;
		if (fev) {
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer(
				"set-status-title",
				"Loading match data for event '" + fev.name + "'"
			);
			this.msg_ = "";
			this.sendToRenderer(
				"set-status-html",
				"Requesting match data from the Blue Alliance ..."
			);
			this.project_!.loadExternalBAData(
				this.ba_!,
				fev,
				(text) => {
					this.appendStatusText(text);
				}
			)
			.then(() => {
				this.appendStatusText("All data loaded");
				this.sendToRenderer("set-status-close-button-visible", true);
			})
			.catch((err) => {
				this.appendStatusText("<br><br>Error loading data - " + err.message);
				this.sendToRenderer("set-status-close-button-visible", true);
			});
		} else {
			let html = "The event is not a blue alliance event";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Load Match Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
		}
	}	

	private importStatboticsData() {
		if (!this.project_) {
			let html = "Must create or open a project to import data.";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Error Importing Match Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
			return;
		}

		if (!this.isBAAvailable()) {
			let html = "The Blue Alliance site is not available.";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Error Importing Match Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
			return;
		}

		let fev: BAEvent | undefined = this.project_?.info?.frcev_;
		if (fev) {
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer(
				"set-status-title",
				"Loading match data for event '" + fev.name + "'"
			);
			this.msg_ = "";
			this.sendToRenderer(
				"set-status-html",
				"Requesting match data from the Blue Alliance ..."
			);
			this.project_!.loadExternalSTData(
				this.statbotics_!,
				fev,
				(text) => {
					this.appendStatusText(text);
				}
			)
			.then(() => {
				this.appendStatusText("All data loaded");
				this.sendToRenderer("set-status-close-button-visible", true);
			})
			.catch((err) => {
				this.appendStatusText("<br><br>Error loading data - " + err.message);
				this.sendToRenderer("set-status-close-button-visible", true);
			});
		} else {
			let html = "The event is not a blue alliance event";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Load Match Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
		}
	}

	private appendStatusText(text: string) {
		this.msg_ += text;
		this.sendToRenderer("set-status-html", this.msg_);
	}

	private getEventFromKey(key: string): BAEvent | undefined {
		let ret: BAEvent | undefined = undefined;

		if (this.baevents_) {
			ret = this.baevents_.find((element) => element.key === key);
		}

		return ret;
	}

	private isBAAvailable(): boolean {
		return this.ba_ !== undefined && !this.baloading_;
	}

	public isScoutingTablet(): boolean {
		return false;
	}

	public sendNavData(): void {
		let treedata = [];
		let dims = 40 ;

		treedata.push({ type: "separator", title: "General" });
		treedata.push({ 
			type: "icon", 
			command: SCCentral.viewHelp, 
			title: "Help",
			icon: this.getIconData('help.png'),
			width: dims,
			height: dims
		});
		treedata.push({
			type: "icon",
			command: SCCentral.viewPreviewForm,
			title: "Preview Form",
			icon: this.getIconData('preview.png'),
			width: dims,
			height: dims
		});

		if (this.project_) {
			treedata.push({
				type: "icon",
				command: SCCentral.viewInit,
				title: "Event Info",
				icon: this.getIconData('info.png'),
				width: dims,
				height: dims
			});
			treedata.push({ type: "separator", title: "Teams" });
			treedata.push({
				type: "icon",
				command: SCCentral.viewTeamForm,
				title: "Team Form",
				icon: this.getIconData('form.png'),
				width: dims,
				height: dims
			});
			if (this.project_.info?.locked_) {
				treedata.push({
					type: "icon",
					command: SCCentral.viewTeamStatus,
					title: "Team Status",
					icon: this.getIconData('status.png'),
					width: dims,
					height: dims					
				});
				treedata.push({
					type: "icon",
					command: SCCentral.viewTeamDB,
					title: "Team Data",
					icon: this.getIconData('data.png'),
					width: dims,
					height: dims					
				});
			}

			treedata.push({ type: "separator", title: "Match" });

			treedata.push({
				type: "icon",
				command: SCCentral.viewMatchForm,
				title: "MatchForm",
				icon: this.getIconData('form.png'),
				width: dims,
				height: dims
			});
			if (this.project_.info?.locked_) {
				treedata.push({
					type: "icon",
					command: SCCentral.viewMatchStatus,
					title: "Match Status",
					icon: this.getIconData('status.png'),
					width: dims,
					height: dims					
				});
				treedata.push({
					type: "icon",
					command: SCCentral.viewMatchDB,
					title: "Match Data",
					icon: this.getIconData('data.png'),
					width: dims,
					height: dims					
				});
			}

			treedata.push({ type: "separator", title: "Analysis" });
			
			if (this.project_.info?.locked_) {
				treedata.push({
					type: "icon",
					command: SCCentral.viewDataSets,
					title: "Data Sets",
					icon: this.getIconData('dataset.png'),
					width: dims,
					height: dims	
				});

				treedata.push({
					type: 'icon',
					command: SCCentral.viewPicklist,
					title: "Picklist",
					icon: this.getIconData('picklist.png'),
					width: dims,
					height: dims	
				});

				treedata.push({
					type: 'icon',
					command: SCCentral.viewSingleTeamSummary,
					title: "Single Team View",
					icon: this.getIconData('singleteam.png'),
					width: dims,
					height: dims						
				});				

				treedata.push({
					type: 'icon',
					command: SCCentral.viewMultiView,
					title: "Multiple Team View",
					icon: this.getIconData('multipleteams.png'),
					width: dims,
					height: dims	
				});
				
				treedata.push({
					type: 'icon',
					command: SCCentral.viewTeamGraph,
					title: "Team Graph",
					icon: this.getIconData('bar-graph.png'),
					width: dims,
					height: dims	
				});

				treedata.push({
					type: 'icon',
					command: SCCentral.viewSpider,
					title: "Spider Graph",
					icon: this.getIconData('spider.png'),
					width: dims,
					height: dims	
				});

				treedata.push({
					type: 'icon',
					command: SCCentral.viewFormulas,
					title: "Formulas",
					icon: this.getIconData('formula.png'),
					width: dims,
					height: dims	
				});
			}
		}

		this.sendToRenderer("send-nav-data", treedata);
	}

	public executeCommand(cmd: string): void {
		if (cmd === SCCentral.viewHelp) {
			shell.openExternal(
				"https://www.xerosw.org/doku.php?id=software:xeroscout2"
			);
		} else if (cmd === SCCentral.viewAbout) {
			this.showAbout();
		} else if (cmd === SCCentral.viewPreviewForm) {
			this.previewForm();
		} else if (cmd === SCCentral.createNewEvent) {
			this.createEvent(this.year_!);
			this.sendNavData();
		} else if (cmd === SCCentral.openExistingEvent) {
			this.openEvent(this.year_!);
			this.sendNavData();
		} else if (cmd === SCCentral.closeEvent) {
			this.closeEvent();
		} else if (cmd === SCCentral.selectMatchForm) {
			this.selectMatchForm();
		} else if (cmd === SCCentral.selectTeamForm) {
			this.selectTeamForm();
		} else if (cmd === SCCentral.loadBAEvent) {
			this.loadBAEvent();
		} else if (cmd === SCCentral.assignTablets) {
			this.setView("assign-tablets");
		} else if (cmd === SCCentral.viewInit) {
			this.setView("info");
		} else if (cmd === SCCentral.viewPicklist) {
			this.setView('picklist') ;
		} else if (cmd === SCCentral.viewDataSets) {
			this.setView('datasets') ;
		} else if (cmd === SCCentral.lockEvent) {
			this.sendToRenderer("set-status-title","Locking event");
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer('set-status-text', 'Locking event ...') ;
			this.project_!.lockEvent()
				.then(() => {
					this.startSyncServer();
					this.setView("info");
					this.sendNavData();
					this.sendToRenderer('set-status-text', 'Locking event ... done') ;
					this.sendToRenderer("set-status-close-button-visible", true);
				})
				.catch((err) => {
					let errobj = err as Error ;
					this.setView("info");
					this.sendNavData();
					this.sendToRenderer('set-status-text', 'Error: ' + errobj.message) ;
					this.sendToRenderer("set-status-close-button-visible", true) ;	
				}) ;
		} else if (cmd === SCCentral.editTeams) {
			this.setView("edit-teams");
		} else if (cmd === SCCentral.editMatches) {
			this.setView("edit-matches");
		} else if (cmd === SCCentral.importTeams) {
			this.importTeams();
		} else if (cmd === SCCentral.importMatches) {
			this.importMatches();
		} else if (cmd === SCCentral.viewTeamForm) {
			this.setFormView('team');
		} else if (cmd === SCCentral.viewMatchForm) {
			this.setFormView('match');
		} else if (cmd === SCCentral.viewTeamStatus) {
			if (!this.project_?.tablet_mgr_?.hasTeamAssignments()) {
				this.sendToRenderer(
					"update-main-window-view",
					"empty",
					"Scouting schedule not generated yet"
				);
			} else {
				this.setView("teamstatus");
			}
		} else if (cmd === SCCentral.viewMatchStatus) {
			if (!this.project_?.tablet_mgr_?.hasMatchAssignments()) {
				this.sendToRenderer(
					"update-main-window-view",
					"empty",
					"Scouting schedule not generated yet"
				);
			} else {
				this.setView('matchstatus');
			}
		} else if (cmd === SCCentral.viewMatchDB) {
			this.setView("matchdb");
		} else if (cmd === SCCentral.viewTeamDB) {
			this.setView("teamdb");
		} else if (cmd === SCCentral.viewTeamGraph) {
			this.setView("teamgraph");
		} else if (cmd === SCCentral.viewFormulas) {
			this.setView("formulas") ;
		} else if (cmd === SCCentral.viewMultiView) {
			this.setView("multiview") ;
		} else if (cmd === SCCentral.viewSpider) {
			this.setView("spiderview") ;
		} else if (cmd === SCCentral.viewSingleTeamSummary) {
			this.setView("singleteam") ;
		}
	}

	private previewForm() {
		var path = dialog.showOpenDialog({
			title: "Select Form",
			message: "Select scouting form",
			filters: [
				{
					extensions: ["json"],
					name: "JSON file for team scouting form",
				},
				{
					extensions: ["html"],
					name: "HTML file for team scouting form",
				},
			],
			properties: ["openFile"],
		});

		path.then((pathname) => {
			if (!pathname.canceled) {
				if (this.validateForm(pathname.filePaths[0], '*')) {
					this.previewfile_ = pathname.filePaths[0];
					this.setFormView('preview');
				}
			}
		});
	}

	private setFormView(view: string) {
		this.lastformview_ = view ;
		this.setView('formview', view);
	}

	private importTeams() {
		var path = dialog.showOpenDialog({
			title: "Import Teams",
			message: "Select teams CVS file",
			filters: [
				{
					extensions: ["csv"],
					name: "CSV File",
				},
			],
			properties: ["openFile"],
		});

		path
			.then((pathname) => {
				if (!pathname.canceled) {
					this.importTeamsFromFile(pathname.filePaths[0]);
				}
			})
			.catch((err) => {
				dialog.showErrorBox("Import Teams Error", err.message);
			});
	}

	private importMatches() {
		var path = dialog.showOpenDialog({
			title: "Import Matches",
			message: "Select Matches CVS file",
			filters: [
				{
					extensions: ["csv"],
					name: "CSV File",
				},
			],
			properties: ["openFile"],
		});

		path
			.then((pathname) => {
				if (!pathname.canceled) {
					this.importMatchesFromFile(pathname.filePaths[0]);
				}
			})
			.catch((err) => {
				dialog.showErrorBox("Import Matches Error", err.message);
			});
	}

	private importTeamsFromFile(filename: string) {
		interface TeamData {
			number_: Number;
			nickname_: string;
		}

		const file = fs.readFileSync(filename, "utf8");

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			transformHeader(header, index) {
				let ret = header;

				if (index == 0) {
					ret = "team_number";
				} else if (index == 1) {
					ret = "nickname";
				}

				return ret;
			},
			complete: (results) => {
				let data: BATeam[] = [];
				for (let one of results.data) {
					let entry = one as any;
					let obj: BATeam = {
						key: entry.team_number,
						team_number: +entry.team_number,
						nickname: entry.nickname,
						name: entry.nickname,
						school_name: "",
						city: "",
						state_prov: "",
						country: "",
						address: "",
						postal_code: "",
						gmaps_place_id: "",
						gmaps_url: "",
						lat: 0,
						lng: 0,
						location_name: "",
						website: "",
						rookie_year: 1962,
					};
					data.push(obj);
				}
				this.sendToRenderer("send-team-data", data);
			},
			error: (error: any) => {
				let errobj: Error = error as Error;
				dialog.showErrorBox("Error Importing Teams", errobj.message);
			},
		});
	}

	private transformData(data: any[]): any[] {
		let result: any[] = [];

		for (let entry of data) {
			let obj = {
				type_: entry.type_,
				number_: entry.number_,
				red_: [entry.r1_, entry.r2_, entry.r3_],
				blue_: [entry.b1_, entry.b2_, entry.b3_],
			};

			result.push(obj);
		}

		return result;
	}

	private importMatchesFromFile(filename: string) {
		interface TeamData {
			number_: Number;
			nickname_: string;
		}

		const file = fs.readFileSync(filename, "utf8");

		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			transformHeader(header, index) {
				let ret = header;

				if (index === 0) {
					ret = "comp_level";
				} else if (index === 1) {
					ret = "set_number";
				} else if (index === 2) {
					ret = "match_number";
				} else if (index === 3) {
					ret = "r1_";
				} else if (index === 4) {
					ret = "r2_";
				} else if (index === 5) {
					ret = "r3_";
				} else if (index === 6) {
					ret = "b1_";
				} else if (index === 7) {
					ret = "b2_";
				} else if (index === 8) {
					ret = "b3_";
				}

				return ret;
			},
			complete: (results) => {
				let matches: BAMatch[] = [];
				for (let one of results.data) {
					let oneobj = one as any;
					let obj: BAMatch = {
						key: "",
						comp_level: oneobj.comp_level,
						set_number: oneobj.set_number,
						match_number: oneobj.match_number,
						alliances: {
							red: {
								team_keys: [oneobj.r1_, oneobj.r2_, oneobj.r3_],
							},
							blue: {
								team_keys: [oneobj.b1_, oneobj.b2_, oneobj.b3_],
							},
						},
					};
					matches.push(obj);
				}
				this.sendMatchDataInternal(matches);
			},
			error: (error: any) => {
				let errobj: Error = error as Error;
				dialog.showErrorBox("Error Importing Teams", errobj.message);
			},
		});
	}

	private loadBAEvent() {
		if (this.isBAAvailable()) {
			this.ba_?.getEvents()
				.then((frcevs) => {
					this.sendToRenderer("send-event-data", frcevs);
				})
				.catch((err) => {
					let errobj: Error = err as Error;
					dialog.showMessageBoxSync(this.win_, {
						title: "Load Blue Alliance Event",
						message: errobj.message,
					});
					this.setView("info");
				});
		}
	}

	private createEvent(year: number) {
		var path = dialog.showOpenDialog({
			properties: ["openDirectory", "createDirectory"],
		});

		path
			.then((pathname) => {
				if (!pathname.canceled) {
					Project.createEvent(this.logger_, pathname.filePaths[0], year)
						.then((p) => {
							this.addRecent(p.location);
							this.project_ = p;
							this.updateMenuState(true);
							this.setView("info");
						})
						.catch((err) => {
							let errobj: Error = err as Error;
							dialog.showErrorBox("Create Project Error", errobj.message);
						});
				}
			})
			.catch((err) => {
				dialog.showErrorBox("Create Event Error", err.message);
			});
	}

	private addRecent(path: string) {
		let recents: string[] = [];

		if (this.hasSetting(SCCentral.recentFilesSetting)) {
			recents = this.getSetting(SCCentral.recentFilesSetting);
		}

		let index = recents.indexOf(path);
		if (index !== -1) {
			recents.splice(index, 1);
		}

		recents.unshift(path);
		if (recents.length > 5) {
			recents.splice(5);
		}

		this.setSetting(SCCentral.recentFilesSetting, recents);
	}

	private showError(filename: string, err: string) {
		dialog.showErrorBox("Invalid Form", filename + ": " + err);
	}

	private showSectError(filename: string, num: number, err: string) {
		dialog.showErrorBox(
			"Invalid Form",
			filename + ": section " + num + ": " + err
		);
	}

	private showItemError(
		filename: string,
		sectno: number,
		itemno: number,
		err: string
	) {
		dialog.showErrorBox(
			"Invalid Form",
			filename + ": section " + sectno + ": item " + itemno + ":" + err
		);
	}

	private validateTag(tag: string): boolean {
		return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(tag);
	}

	private validateImageItem(filename: string, sectno: number, itemno: number, item: any): boolean {
		if (item.type === 'multi') {
			if (item.datatype) {
				if (typeof item.datatype !== 'string') {
					this.showItemError(filename, sectno, itemno, "the field 'datatype' is defined but is not a string") ;
					return false ;
				}

				let dt = item.datatype.toLowerCase() ;
				if (dt !== 'integer' && dt !== 'real') {
					this.showItemError(filename, sectno, itemno, "the field 'datatype' must be 'integer' or 'real'") ;
					return false ;
				}
			}
		}
		return true ;
	}

	private validateItem(filename: string, sectno: number, itemno: number, item: any): boolean {
		if (!item.name) {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'name' is not defined"
			);
			return false;
		}

		if (typeof item.name !== "string") {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'name' is defined, but is not a string"
			);
			return false;
		}

		if (!item.type) {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'type' is not defined"
			);
			return false;
		}

		if (typeof item.type !== "string") {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'type' is defined, but is not a string"
			);
			return false;
		}

		if (
			item.type != "boolean" &&
			item.type != "text" &&
			item.type != "choice" &&
			item.type != "updown"
		) {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'type' is ${item.type} which is not valid.  Must be 'boolean', 'text', 'updown', or 'choice'"
			);
		}

		if (!item.tag) {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'tag' is not defined"
			);
			return false;
		}

		if (typeof item.tag !== "string") {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'tag' is defined, but is not a string"
			);
			return false;
		}

		if (!this.validateTag(item.tag)) {
			this.showItemError(
				filename,
				sectno,
				itemno,
				"the field 'tag' has a value '" + item.tag + "'which is not valid, must start with a letter and be composed of letters, numbers, and underscores"
			);
			return false;
		}

		if (item.type === "text") {
			if (item.maxlen === undefined) {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'maxlen' is not defined and is required for an item of type 'text'"
				);
				return false;
			}

			if (typeof item.maxlen !== "number") {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'maxlen' is defined but is not a number"
				);
				return false;
			}
		} else if (item.type === "boolean") {
			// NONE
		} else if (item.type === "updown") {
			if (item.minimum === undefined) {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'minimum' is not defined and is required for an item of type 'updown'"
				);
				return false;
			}

			if (typeof item.minimum !== "number") {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'minimum' is defined but is not a number"
				);
				return false;
			}

			if (item.maximum === undefined) {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'maximum' is not defined and is required for an item of type 'updown'"
				);
				return false;
			}

			if (typeof item.maximum !== "number") {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'maximum' is defined but is not a number"
				);
				return false;
			}

			if (item.maximum <= item.minimum) {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'maximum' is less than the field 'minimum'"
				);
				return false;
			}
		} else if (item.type === "choice") {
			if (item.choices === undefined) {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'choices' is not defined and is required for an item of type 'choice'"
				);
				return false;
			}

			if (!Array.isArray(item.choices)) {
				this.showItemError(
					filename,
					sectno,
					itemno,
					"the field 'choices' is defined but is not of type array"
				);
				return false;
			}

			let choiceno = 1;
			for (let choice of item.choices) {
				if (typeof choice !== "string" && typeof choice !== "number") {
					let msg: string =
						"choice " +
						choiceno +
						": the value is neither a 'string', nor a 'number'";
					this.showItemError(filename, sectno, itemno, msg);
					return false;
				}
				choiceno++;
			}
		}

		return true;
	}

	private validateSection(filename: string, num: number, sect: any): boolean {
		let isImage = false ;

		if (!sect.name) {
			this.showSectError(filename, num, "the field 'name' is not defined");
			return false;
		}

		if (typeof sect.name !== "string") {
			this.showSectError(
				filename,
				num,
				"the field 'name' is defined, but is not a string"
			);
			return false;
		}

		if (sect.image) {
			if (typeof sect.image !== "string") {
				this.showSectError(
					filename,
					num,
					"the field 'image' is defined, but is not a string"
				);
				return false;				
			}
			isImage = true ;
		}

		if (!sect.items) {
			this.showSectError(filename, num, "the field 'items' is not defined");
			return false;
		}

		if (!Array.isArray(sect.items)) {
			this.showSectError(
				filename,
				num,
				"the form 'items' is defined but it is not an array"
			);
			return false;
		}

		let itemnum = 1;
		for (let item of sect.items) {
			if (isImage) {
				if (!this.validateImageItem(filename, num, itemnum, item)) {
					return false;
				}								
			}
			else {
				if (!this.validateItem(filename, num, itemnum, item)) {
					return false;
				}
			}
			itemnum++;
		}

		return true;
	}

	private validateForm(filename: string, type: string) {
		let jsonstr = fs.readFileSync(filename).toLocaleString();
		let obj;

		try {
			obj = JSON.parse(jsonstr);
		} catch (err) {
			this.showError(
				filename,
				"not a valid JSON file - load the form file in VS Code to find errors"
			);
			return false;
		}

		if (!obj.form) {
			this.showError(
				filename,
				"the form is missing the 'form' field to indicate form type"
			);
			return false;
		}

		if (obj.form !== type && type !== "*") {
			this.showError(
				filename,
				"the form type is not valid, expected '" +
					type +
					"' but form '" +
					obj.form +
					"'"
			);
			return false;
		}

		if (!obj.sections) {
			this.showError(
				filename,
				"the form is missing the 'sections' field to indicate form type"
			);
			return false;
		}

		if (!Array.isArray(obj.sections)) {
			this.showError(
				filename,
				"the form has the 'sections' field but it is not an array"
			);
			return false;
		}

		let num = 1;
		for (let sect of obj.sections) {
			if (!this.validateSection(filename, num, sect)) {
				return false;
			}

			num++;
		}

		return true;
	}

	private selectTeamForm() {
		var path = dialog.showOpenDialog({
			title: "Select Team Form",
			message: "Select team scouting form",
			filters: [
				{
					extensions: ["json"],
					name: "JSON file for team scouting form",
				},
				{
					extensions: ["html"],
					name: "HTML file for team scouting form",
				},
			],
			properties: ["openFile"],
		});

		path.then((pathname) => {
			if (!pathname.canceled) {
				if (this.validateForm(pathname.filePaths[0], "team")) {
					this.project_!.setTeamForm(pathname.filePaths[0]);
				}
				this.setView("info");
			}
		});
	}

	private selectMatchForm() {
		var path = dialog.showOpenDialog({
			title: "Select Match Form",
			message: "Select match scouting form",
			filters: [
				{
					extensions: ["json"],
					name: "JSON file for match scouting form",
				},
				{
					extensions: ["html"],
					name: "HTML file for match scouting form",
				},
			],
			properties: ["openFile"],
		});

		path.then((pathname) => {
			if (!pathname.canceled) {
				if (this.validateForm(pathname.filePaths[0], "match")) {
					this.project_!.setMatchForm(pathname.filePaths[0]);
				}
				this.setView("info");
			}
		});
	}

	private closeEvent() {
		if (this.project_) {
			this.project_.closeEvent();
			this.project_ = undefined;
			this.updateMenuState(false);
			this.sendNavData();
			this.setView("empty");
		}
	}

	private openEvent(year: number) {
		var path = dialog.showOpenDialog({
			title: "Event descriptor file",
			message: "Select event descriptor file",
			filters: [
				{
					extensions: ["json"],
					name: "JSON File for event descriptor",
				},
			],
			properties: ["openFile"],
		});

		path
			.then((pathname) => {
				if (!pathname.canceled) {
					Project.openEvent(this.logger_, pathname.filePaths[0], year)
						.then((p) => {
							this.addRecent(p.location);
							this.project_ = p;
							this.updateMenuState(true);
							if (this.project_.info?.locked_) {
								this.startSyncServer();
							}
							this.setView("info");
							this.sendNavData();
						})
						.catch((err) => {
							let errobj: Error = err as Error;
							dialog.showErrorBox("Open Project Error", errobj.message);
						});
				}
			})
			.catch((err) => {
				dialog.showErrorBox("Open Event Error", err.message);
			});
	}

	private processPacket(p: PacketObj): PacketObj | undefined {
		let resp: PacketObj | undefined;

		if (p.type_ === PacketType.Hello) {
			if (p.data_.length > 0) {
				try {
					let obj = JSON.parse(p.payloadAsString());
				} catch (err) {}
			}

			let evname;

			if (this.project_?.info?.frcev_?.name) {
				evname = this.project_.info.frcev_.name;
			} else if (this.project_?.info?.name_) {
				evname = this.project_?.info?.name_;
			}
			else {
				evname = "Unknown Event" ;
			}

			let evid = {
				uuid: this.project_?.info?.uuid_,
				name: evname,
			};
			let uuidbuf = Buffer.from(JSON.stringify(evid), "utf-8");
			resp = new PacketObj(PacketType.Hello, uuidbuf);
		} else if (p.type_ === PacketType.RequestTablets) {
			let data: Uint8Array = new Uint8Array(0);
			if (this.project_ && this.project_.tablet_mgr_?.areTabletsValid()) {
				let tablets: any[] = [];

				for (let t of this.project_?.tablet_mgr_!.getTablets()) {
					if (!t.assigned) {
						tablets.push({ name: t.name, purpose: t.purpose });
					}
				}

				let msg: string = JSON.stringify(tablets);
				data = Buffer.from(msg, "utf-8");
			}
			resp = new PacketObj(PacketType.ProvideTablets, data);
		} else if (p.type_ === PacketType.RequestTeamForm) {
			if (this.project_?.form_mgr_?.hasForms()) {
				let jsonstr = fs.readFileSync(this.project_!.form_mgr_!.getTeamFormFullPath()!).toString();
				resp = new PacketObj(
					PacketType.ProvideTeamForm,
					Buffer.from(jsonstr, "utf8")
				);
			} else {
				resp = new PacketObj(
					PacketType.Error,
					Buffer.from("internal error #1 - no team form", "utf-8")
				);
				dialog.showErrorBox(
					"Internal Error #1",
					"No team form is defined but event is locked"
				);
			}
		} else if (p.type_ === PacketType.RequestMatchForm) {
			if (this.project_?.form_mgr_?.hasForms()) {
				let jsonstr = fs.readFileSync(this.project_!.form_mgr_.getMatchFormFullPath()!).toString();
				resp = new PacketObj(
					PacketType.ProvideMatchForm,
					Buffer.from(jsonstr, "utf8")
				);
			} else {
				resp = new PacketObj(
					PacketType.Error,
					Buffer.from("internal error #1 - no match form", "utf-8")
				);
				dialog.showErrorBox(
					"Internal Error #1",
					"No match form is defined but event is locked"
				);
			}
		} else if (p.type_ === PacketType.RequestTeamList) {
			if (this.project_?.tablet_mgr_?.hasTeamAssignments()) {
				let str = JSON.stringify(this.project_?.tablet_mgr_?.getTeamAssignments());
				resp = new PacketObj(PacketType.ProvideTeamList, Buffer.from(str));
			} else {
				resp = new PacketObj(
					PacketType.Error,
					Buffer.from(
						"internal error #2 - no team list generated for a locked event",
						"utf-8"
					)
				);
				dialog.showErrorBox(
					"Internal Error #2",
					"No team list has been generated for a locked event"
				);
			}
		} else if (p.type_ === PacketType.RequestMatchList) {
			if (this.project_?.tablet_mgr_?.hasMatchAssignments()) {
				let str = JSON.stringify(this.project_?.tablet_mgr_?.getMatchAssignments());
				resp = new PacketObj(PacketType.ProvideMatchList, Buffer.from(str));
			} else {
				let str = JSON.stringify([]) ;
				resp = new PacketObj(PacketType.ProvideMatchList, Buffer.from(str));
			}
		} else if (p.type_ === PacketType.ProvideResults) {
			try {
				let obj : ScoutingData = JSON.parse(p.payloadAsString()) as ScoutingData ;
				this.project_!.data_mgr_?.processResults(obj);
				resp = new PacketObj(PacketType.ReceivedResults);

				if (this.project_!.tablet_mgr_!.isTabletTeam(obj.tablet)) {
					this.setView("teamstatus");
				} else {
					this.setView("matchstatus");
				}
			} catch (err) {
				resp = new PacketObj(
					PacketType.Error,
					Buffer.from(
						"internal error #5 - invalid results json received by central host",
						"utf-8"
					)
				);
				dialog.showErrorBox(
					"Internal Error #5",
					"invalid results json received by central host"
				);
			}
		} else if (p.type_ === PacketType.Goodbye) {
			resp = undefined;
			let msg: string =
				"Tablet '" + p.payloadAsString() + "' has completed sync";

			dialog.showMessageBox(this.win_, {
				title: "Synchronization Complete",
				message: msg,
				type: "info",
			});
		} else {
			resp = new PacketObj(
				PacketType.Error,
				Buffer.from("internal error #4 - invalid packet type received")
			);
			dialog.showErrorBox("Internal Error #4", "Invalid packet type received");
		}

		return resp;
	}

	private startSyncServer() {
		if (!this.tcpsyncserver_) {
			this.tcpsyncserver_ = new TCPSyncServer(this.logger_);
			this.tcpsyncserver_
				.init()
				.then(() => {
					this.logger_.info(
						"TCPSyncServer: initialization completed sucessfully"
					);
				})
				.catch((err) => {
					let errobj: Error = err;
					dialog.showErrorBox(
						"TCP Sync",
						"Cannot start TCP sync - " + err.message
					);
				});
			this.tcpsyncserver_.on("packet", (p: PacketObj) => {
				let reply: PacketObj | undefined = this.processPacket(p);
				if (reply) {
					this.tcpsyncserver_!.send(reply).then(() => {
						if (reply.type_ === PacketType.Error) {
							this.tcpsyncserver_!.shutdownClient();
						}
					});
				} else {
					this.tcpsyncserver_?.shutdownClient();
				}
			});

			this.tcpsyncserver_.on("error", (err) => {
				this.tcpsyncserver_?.shutdownClient();
				dialog.showMessageBox(this.win_, {
					message: "Error syncing client - " + err.message,
					title: "Client Sync Error",
				});
			});
		}
	}

	public generateRandomData() {
		if (this.lastview_ && this.lastview_ === 'info') {
			if (this.project_) {
				this.project_!.generateRandomData();
				dialog.showMessageBox(this.win_, {
					title: "Generated Random Form Data",
					message: "Generated Random Form Data",
				});
			} else {
				dialog.showMessageBox(this.win_, {
					title: "Random Data Error",
					message: "You can only generate data for an opened project",
				});
			}
		}
	}

	public getTeamList() {
		let ret: number[] = this.project_?.team_mgr_?.getSortedTeamNumbers()! ;
		this.sendToRenderer('send-team-list', ret) ;
	}

	public getTeamListAndNames() {
		let ret = this.project_?.team_mgr_?.getTeamsNickNameAndNumber() ;
		this.sendToRenderer('send-team-list', ret) ;
	}

	public async saveTeamGraphSetup(desc: GraphConfig) {
		this.project_?.graph_mgr_?.storeGraph(desc) ;
	}

	//
	// request is of the form of an object
	//
	// {
	//    teams: [list of team number],
	//    data: {
	//      team: ["field1", "field2", etc.]
	//      match: ["field1", "field2", etc.]
	//    }
	// }
	//
	// Output format ...
	//
	//  let grdata =  {
	//     labels: ['Category 1', 'Category 2', 'Category 3'],
	//     datasets: [
	//       {
	//         label: 'Dataset 1',
	//         data: [12, 19, 3],
	//         backgroundColor: 'rgba(255, 99, 132, 0.2)',
	//         borderColor: 'rgba(255, 99, 132, 1)',
	//         borderWidth: 1
	//       },
	//       {
	//         label: 'Dataset 2',
	//         data: [10, 5, 8],
	//         backgroundColor: 'rgba(54, 162, 235, 0.2)',
	//         borderColor: 'rgba(54, 162, 235, 1)',
	//         borderWidth: 1
	//       }
	//     ]
	//   };
	//
	public async sendTeamGraphData(request: GraphDataRequest) {
		if (this.project_ && this.project_.isInitialized()) {
			let labels: Array<Array<string>> = [];
			let group: GraphData[] = [];

			let ds = this.project_!.dataset_mgr_!.getDataSetByName(request.ds) ;
			if (ds) {
				for (let team of ds?.teams) {
					let t = this.project_.team_mgr_!.findTeamByNumber(team) ;

					let oneteam: string[] = [] ;
					if (t) {
						oneteam.push(team.toString()) ;
						oneteam.push(t.nickname) ;
					}
					else {
						oneteam.push(team.toString());
					}
					
					labels.push(oneteam) ;
				}

				for (let tdset of request.data.leftteam) {
					let data = await this.project_!.graph_mgr_!.createTeamDataset(ds.teams, tdset, 'y');
					if (data) {
						group.push(data);
					}
				}

				for (let tdset of request.data.leftmatch) {
					let data = await this.project_!.graph_mgr_!.createMatchDataset(ds.teams, tdset, 'y');
					if (data) {
						group.push(data);
					}
				}

				for (let tdset of request.data.rightteam) {
					let data = await this.project_!.graph_mgr_!.createTeamDataset(ds.teams, tdset, 'y2');
					if (data) {
						group.push(data);
					}
				}

				for (let tdset of request.data.rightmatch) {
					let data = await this.project_!.graph_mgr_!.createMatchDataset(ds.teams, tdset, 'y2');
					if (data) {
						group.push(data);
					}
				}

				//
				// TODO: fix graphs
				//
				// let grdata : GraphData = {
				// 	labels: labels,
				// 	datasets: group,
				// };
				// this.sendToRenderer('send-team-graph-data', grdata);
			}
		}
	}

	private getTeamNumbersFromKeys(keys: string[]) : number[] {
		let ret: number[] = [] ;

		for(let key of keys) {
			ret.push(+key.substring(3)) ;
		}

		return ret;
	}

	public getMatchList() {
		let data = [] ;

		for(let match of this.project_!.match_mgr_!.getMatches()) {
			let one = {
				comp_level: match.comp_level,
				set_number: match.set_number,
				match_number: match.match_number,
				red: this.getTeamNumbersFromKeys(match.alliances.red.team_keys),
				blue: this.getTeamNumbersFromKeys(match.alliances.blue.team_keys),
			}

			data.push(one) ;
		}
		
		data.sort((a, b) => { return this.sortCompFun(a, b) ;}) ;

		this.sendToRenderer('send-match-list', data) ;
	}

	public getStoredGraphList() {
		if (this.project_ && this.project_!.isInitialized()) {
			this.sendToRenderer('send-stored-graph-list', this.project_!.graph_mgr_!.getGraphs()) ;
		}
	}

	public deleteStoredGraph(name: string) {
		if (this.project_ && this.project_!.isInitialized()) {
			this.project_!.graph_mgr_!.deleteGraph(name) ;
			this.getStoredGraphList() ;
		}
	}

	private async doExportPicklist() {
		if (this.project_ && this.project_.isInitialized()) {
			if (this.project_.picklist_mgr_!.getPicklists().length > 0) {
				for(let picklist of this.project_.picklist_mgr_!.getPicklists()) {
					let name = '' ;
					let regex = /[A-Za-z0-9_]/;
					for(let ch of picklist.name) {
						if (!ch.match(regex)) {
							name += '_' ;
						}
						else {
							name += ch ;
						}
					}
					let filename = path.join(this.project_.location, 'picklist-' + name + '.csv') ;
					await this.project_!.picklist_mgr_!.exportPicklist(picklist.name, filename) ;
				}
				dialog.showMessageBox(this.win_, {
					title: 'Export Picklist As CSV',
					message: 'All picklists have been exported into the directory \'' + this.project_.location + '\'',
				}) ;
			}
			else {
				dialog.showMessageBox(this.win_, {
					title: 'Export Picklist As CSV',
					message: 'There are not picklist defined'
				}) ;
			}
		}
	}

	public deletePicklist(name: string) {
		if (this.project_ && this.project_.isInitialized()) {
			if (!this.project_!.picklist_mgr_!.deletePicklist(name)) {
				dialog.showMessageBox(this.win_, {
					title: 'Error Deleting Picklist',
					message: 'There was a request to delete picklist \'' + name + '\' which does not exist'
				});
			}

			this.sendPicklistList(false) ;
		}
	}

	public createNewPicklist(name: string, dataset: string) {
		if (this.project_) {
			let picklist = this.project_.picklist_mgr_!.findPicklistByName(name) ;
			if (picklist) {
				dialog.showMessageBox(this.win_, {
					title: 'Error Creating New Picklist',
					message: 'There is already a picklist named \'' + name + '\''
				});
			}
			else {
				this.project_.picklist_mgr_?.addPicklist(name, dataset) ;
			}
		}
	}

	public sendPicklistList(senddef: boolean) {
		interface MyObject {
			[key: string]: any; // Allows any property with a string key
		}

		let data: string[] = [] ;

		if (this.project_ && this.project_.isInitialized()) {
			for(let picklist of this.project_!.picklist_mgr_!.getPicklists()) {
				data.push(picklist.name) ;
			}
			let obj: MyObject = {} ;
			obj.list = data ;
			if (senddef) {
				obj.default = this.project_!.picklist_mgr_!.getLastPicklistUsed() ;
			}

			this.sendToRenderer('send-picklist-list', obj) ;
		}
	}

	public sendPicklistData(name: string) {
        let data : any[] = [] ;
        if (this.project_ && this.project_.isInitialized()) {
			if (!name) {
				if (this.project_.picklist_mgr_!.getPicklists().length === 0) {
					return ;
				}

				if (this.project_!.picklist_mgr_!.getLastPicklistUsed()) {
					name = this.project_!.picklist_mgr_!.getLastPicklistUsed() ;
				}
				else {
					name = this.project_!.picklist_mgr_!.getPicklists()[0].name ;
				}
			}

			this.project_!.picklist_mgr_!.setLastPicklistUsed(name) ;
			let picklist = this.project_!.picklist_mgr_!.findPicklistByName(name) ;
			if (picklist) {
				let ds = this.project_.dataset_mgr_!.getDataSetByName(picklist.dataset) ;
				if (ds) {
					let rank = 1 ;
					for(let team of ds.teams) {
						let t = this.project_.team_mgr_?.findTeamByNumber(team) ;
						let obj = {
							rank: rank++,
							teamnumber: team,
							nickname: t ? t.nickname : team.toString(),
						};
						data.push(obj) ;
					}
				}
			}
        }
		let obj = {
			name: name,
			data: data
		} ;
        this.sendToRenderer('send-picklist-data', obj) ;
	}

	public async sendPicklistColData(m:MatchSet, field: string) {
		let values: (number|string|Error)[] = [];
		let teams: number[] = [] ;

		if (this.project_ && this.project_.isInitialized()) {
			for(let t of this.project_!.team_mgr_!.getTeams()) {
				let v = await this.project_!.data_mgr_!.getData(m, field, t.team_number) ;
				values.push(v) ;
				teams.push(t.team_number) ;
			}

			let data : PickListColData = {
				field: field,
				data: values,
				teams: teams	
			}
			this.sendToRenderer('send-picklist-col-data', data) ;
		}
	}

	public async sendPicklistNotes(name: string) {
		if (this.project_ && this.project_.isInitialized()) {
			let picklist = this.project_?.picklist_mgr_!.findPicklistByName(name) ;
			if (picklist) {
				let data = {
					name: name,
					notes: picklist.notes
				}
				this.sendToRenderer('send-picklist-notes', data) ;
			}
		}
	}

	public updatePicklistNotes(name: string, notes: ProjPicklistNotes[]) {
		if (this.project_ && this.project_.isInitialized()) {
			this.project_.picklist_mgr_!.setPicklistNotes(name, notes) ;
		}
	}

	public async getSingleTeamData(ds: string, team: number) {
		interface MyObject {
			[key: string]: any; // Allows any property with a string key
		}
		let retdata : MyObject = {} ;

		if (this.project_ && this.project_.isInitialized()) {
			retdata.matches = this.project_.match_mgr_!.getMatchResults(+team) ;
			retdata.teamdata = await this.project_.dataset_mgr_!.getDataSetData(ds) ;
		}

		this.sendToRenderer('send-single-team-data', retdata) ;
	}

	private importFormulasFromFileWithPath(path: string) {
		if (this.project_ && this.project_.isInitialized()) {
			try {
				let data = fs.readFileSync(path, 'utf-8') ;
				const obj = JSON.parse(data) ;
				this.project_!.formula_mgr_!.importFormulas(obj) ;
			}
			catch(err) {
				let errobj = err as Error ;
				dialog.showErrorBox("Coule not import formulas", errobj.message);
			}
		}
	}

	private importFormulasFromFile() {
		dialog.showOpenDialog(this.win_, {
			title: 'Import formulas from file',
			filters: [
				{ name: 'JSON Files', extensions: ['json'] },
				{ name: 'All Files', extensions: ['*']}
			],
			properties: [
				'openFile',
			]
		}).then(result => {	
			if (!result.canceled) {
				this.importFormulasFromFileWithPath(result.filePaths[0]) ;
			}
		}) ;
	}

	private getIconData(iconname: string) {
		let datafile = path.join(this.content_dir_, 'images', 'icons', iconname) ;
		let data: string  = fs.readFileSync(datafile).toString('base64');
		return data ;
	}
}

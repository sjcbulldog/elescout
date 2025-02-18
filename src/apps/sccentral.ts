import { SCBase, XeroAppType, XeroVersion } from "./scbase";
import { BlueAlliance } from "../extnet/ba";
import { NamedGraphDataRequest, Project } from "../project/project";
import { BrowserWindow, dialog, Menu, MenuItem, shell } from "electron";
import { TCPSyncServer } from "../sync/tcpserver";
import { PacketObj } from "../sync/packetobj";
import { PacketType } from "../sync/packettypes";
import { MatchDataModel } from "../model/matchmodel";
import { BAEvent, BAMatch, BATeam } from "../extnet/badata";
import { TeamDataModel } from "../model/teammodel";
import Papa from "papaparse";
import * as fs from "fs";
import * as path from "path";
import { StatBotics } from "../extnet/statbotics";
import { FormInfo } from "../comms/formifc";
import { GraphData, GraphDataset } from "../comms/graphifc";
import { ScoutingData } from "../comms/resultsifc";

interface GraphDataRequest {
	teams: number[];
	data: {
		leftteam: string[];
		leftmatch: string[];
		rightteam: string[];
		rightmatch: string[];
	};
}

interface PickListColData {
	field: string,
	teams: number[],
	data: number[]
};

interface ZebraStatus {
	comp_level: string,
	set_number: number,
	match_number: number,
	red1: number,
	redst1: boolean
	red2: number,
	redst2: boolean
	red3: number,
	redst3: boolean
	blue1: number,
	bluest1: boolean
	blue2: number,
	bluest2: boolean
	blue3: number,
	bluest3: boolean

}

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
	private static readonly viewZebraData: string = "view-zebra-data";
	private static readonly viewZebraStatus: string = "view-zebra-status";
	private static readonly viewTeamGraph: string = "view-team-graph";
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

		if (this.project_?.teamDB) {
			if (!this.project_.teamDB.close()) {
				ret = false;
			}

			if (!this.project_.matchDB.close()) {
				ret = false;
			}
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
								if (this.project_.info.locked_) {
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

		let downloadMatchData: MenuItem = new MenuItem({
			type: "normal",
			label: "Import Data From Blue Alliance/Statbotics",
			enabled: false,
			click: () => {
				this.importBlueAllianceStatboticsData();
			},
		});
		datamenu.submenu?.append(downloadMatchData);
		this.menuitems_.set("data/loadmatchdata", downloadMatchData);

		let downloadZebraData: MenuItem = new MenuItem({
			type: "normal",
			label: "Import Zebra Tag Data",
			enabled: false,
			click: () => {
				this.importZebraTagData();
			},
		});
		datamenu.submenu?.append(downloadZebraData);
		this.menuitems_.set("data/zebra", downloadZebraData);

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
			"data/loadmatchdata",
			"data/exportpicklist",
			"data/zebra",
			"data/graphdefn",
			"file/close",
		];
		for (let item of items) {
			this.enableMenuItem(item, hasEvent);
		}
	}

	private doExportData(table: string) {
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
				if (table === TeamDataModel.TeamTableName) {
					this.project_?.teamDB.exportToCSV(pathname.filePath, table);
				} else {
					this.project_?.matchDB.exportToCSV(pathname.filePath, table);
				}
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
			if (this.project_!.info.teamform_) {
				filename = this.project_!.info.teamform_! ;
				title = 'Team Form' ;
			}
			else {
				good = false ;
				ret.message = 'No team form has been defined yet.' ;
			}
		}
		else if (arg === 'match') {
			if (this.project_!.info.matchform_) {
				filename = this.project_!.info.matchform_! ;
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

			for (let one of this.project_?.info.matches_!) {
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
					redtab1: this.project_!.findTabletForMatch(
						one.comp_level,
						one.set_number,
						one.match_number,
						r1
					),
					redst1: this.project_!.hasMatchScoutingResult(
						one.comp_level,
						one.set_number,
						one.match_number,
						r1
					),
					red2: this.keyToTeamNumber(r2),
					redtab2: this.project_!.findTabletForMatch(
						one.comp_level,
						one.set_number,
						one.match_number,
						r2
					),
					redst2: this.project_!.hasMatchScoutingResult(
						one.comp_level,
						one.set_number,
						one.match_number,
						r2
					),
					red3: this.keyToTeamNumber(r3),
					redtab3: this.project_!.findTabletForMatch(
						one.comp_level,
						one.set_number,
						one.match_number,
						r3
					),
					redst3: this.project_!.hasMatchScoutingResult(
						one.comp_level,
						one.set_number,
						one.match_number,
						r3
					),
					blue1: this.keyToTeamNumber(b1),
					bluetab1: this.project_!.findTabletForMatch(
						one.comp_level,
						one.set_number,
						one.match_number,
						b1
					),
					bluest1: this.project_!.hasMatchScoutingResult(
						one.comp_level,
						one.set_number,
						one.match_number,
						b1
					),
					blue2: this.keyToTeamNumber(b2),
					bluetab2: this.project_!.findTabletForMatch(
						one.comp_level,
						one.set_number,
						one.match_number,
						b2
					),
					bluest2: this.project_!.hasMatchScoutingResult(
						one.comp_level,
						one.set_number,
						one.match_number,
						b2
					),
					blue3: this.keyToTeamNumber(b3),
					bluetab3: this.project_!.findTabletForMatch(
						one.comp_level,
						one.set_number,
						one.match_number,
						b3
					),
					bluest3: this.project_!.hasMatchScoutingResult(
						one.comp_level,
						one.set_number,
						one.match_number,
						b3
					),
				};
				ret.push(obj);
			}
			this.sendToRenderer("send-match-status", ret);
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

		if (this.project_ && this.project_.info.teamassignments_) {
			for (let t of this.project_.info.teamassignments_) {
				let status: string = this.project_.hasTeamScoutingResults(t.team)
					? "Y"
					: "N";
				let team: BATeam | undefined = this.project_.findTeamByNumber(t.team);
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
		if (this.project_) {
			let obj = {
				location_: this.project_.location,
				bakey_: this.project_.info.frcev_?.key,
				name_: this.project_.info.frcev_
					? this.project_.info.frcev_.name
					: this.project_.info.name_,
				teamform_: this.shortenString(this.project_.info.teamform_),
				teamformfull_: this.project_.info.teamform_,
				matchform_: this.shortenString(this.project_.info.matchform_),
				matchformfull_: this.project_.info.matchform_,
				tablets_: this.project_.info.tablets_,
				tablets_valid_: this.project_.areTabletsValid(),
				teams_: this.project_.info.teams_,
				matches_: this.project_.info.matches_,
				locked_: this.project_.info.locked_,
				uuid_: this.project_.info.uuid_,
			};
			this.sendToRenderer("send-info-data", obj);
		}
	}

	public sendTabletData(): void {
		if (this.project_) {
			this.sendToRenderer("send-tablet-data", this.project_.info.tablets_);
		}
	}

	public setTabletData(data: any[]) {
		if (this.project_) {
			this.project_.setTabletData(data);
			this.setView('info') ;
		}
	}

	public setMatchColConfig(data: any[]) {
		this.project_!.setMatchColConfig(data);
	}

	public setTeamColConfig(data: any[]) {
		this.project_!.setTeamColConfig(data);
	}

	private async createTeamDataset(teams: number[], data: string, yaxis: string): Promise<any> {
		let ret = new Promise<any>(async (resolve, reject) => {
			try {
				let values = await this.project_!.teamDB.getData(
					TeamDataModel.TeamTableName,
					"team_number",
					teams,
					[data]
				);
				//
				// Should be one record per team
				//
				let dvals = [];
				for (let record of values) {
					dvals.push(record[data]);
				}

				let dset = {
					label: data,
					data: dvals,
					yAxisID: yaxis,
				};
				resolve(dset);
			} catch (err) {
				reject(err);
			}
		});
		return ret;
	}

	private createMatchDataset(teams: number[], data: string, yaxis: string): any {
		let ret = new Promise<any>(async (resolve, reject) => {
			let tdata = [];
			for (let team of teams) {
				let tkey = "frc" + team;
				let values = await this.project_!.matchDB.getData(
					MatchDataModel.MatchTableName,
					"team_key",
					[tkey],
					[data]
				);
				let sum = 0.0;
				for (let dval of values) {
					sum += dval[data];
				}
				tdata.push(sum / values.length);
			}

			let dset = {
				label: data,
				data: tdata,
				yAxisID: yaxis,
			};
			resolve(dset);
		});
		return ret;
	}

	public setTeamData(data: any[]) {
		if (this.project_) {
			this.project_.setTeamData(data);
			this.setView('info');
		}
	}

	public setEventName(data: any) {
		if (this.project_) {
			this.project_.setEventName(data);
		}
	}

	public sendTeamData(): void {
		if (this.project_) {
			this.sendToRenderer("send-team-data", this.project_.info.teams_);
		}
	}

	public setMatchData(data: any[]) {
		if (this.project_) {
			this.project_.setMatchData(data);
			this.setView('info') ;
		}
	}

	public sendMatchDB(): void {
		if (this.project_) {
			this.project_.matchDB
				.getColumns()
				.then((cols) => {
					this.project_?.matchDB
						.getAllData(MatchDataModel.MatchTableName)
						.then((data) => {
							let dataobj = {
								cols: cols,
								data: data,
							};
							this.sendToRenderer("send-match-col-config",this.project_!.info.matchdb_col_config_);
							this.sendToRenderer("send-match-db", dataobj);
						})
						.catch((err) => {});
				})
				.catch((err) => {});
		}
	}

	public sendTeamDB(): void {
		if (this.project_) {
			this.project_.teamDB
				.getColumns()
				.then((cols) => {
					this.project_?.teamDB
						.getAllData(TeamDataModel.TeamTableName)
						.then((data) => {
							let dataobj = {
								cols: cols,
								data: data,
							};
							this.sendToRenderer(
								"send-team-col-config",
								this.project_!.info.teamdb_col_config_
							);
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
		if (this.project_) {
			this.sendMatchDataInternal(this.project_.info.matches_);
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
		this.sendToRenderer("send-match-data", data, this.project_!.info.teams_);
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

	public async loadBaEventData(args: any[]): Promise<void> {
		if (!this.isBAAvailable()) {
			dialog.showErrorBox(
				"Load Blue Alliance Event",
				"The Blue Alliance site is not available."
			);
			return;
		}

		let fev: BAEvent | undefined = this.getEventFromKey(args[0]);
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
				this.sendToRenderer("set-status-title", "Error Importing Match Data");
				this.sendToRenderer(
					"set-status-html",
					"Error importing data - " + errobj.message
				);
				this.sendToRenderer("set-status-close-button-visible", true);
				this.setView("info");
			}
		} else {
			dialog.showErrorBox(
				"Load Blue Alliance Event",
				"Event with key '" + args[0] + "' was not found.<br>No event was loaded"
			);
		}
	}

	private async importGraphsDefnFromFile(filename: string) {
		try {
			let proj: Project = await Project.openEvent(this.logger_, filename, this.year_!) ;
			let omitted: string = '' ;
			let count = 0 ;

			for(let gr of proj.info.team_graph_data_) {
				if (gr.name.length > 0) {
					if (!this.project_!.findGraphByName(gr.name)) {
						this.project_!.storeGraph(gr) ;
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

	private importZebraTagData() {
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

		let fev: BAEvent | undefined = this.project_?.info.frcev_;
		if (fev) {
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer(
				"set-status-title",
				"Loading zebra tag data for event '" + fev.name + "'"
			);
			this.msg_ = "";
			this.sendToRenderer(
				"set-status-html",
				"Requesting zebra tag data from the Blue Alliance ..."
			);
			this.project_!.loadZebraTagData(this.ba_!, (text) => {
				this.appendStatusText(text);
			})
				.then(([yes, no]) => {
					this.appendStatusText(
						"Zebra tag data loaded for " +
							yes +
							" events, missing data for " +
							no +
							" events."
					);
					this.sendToRenderer("set-status-close-button-visible", true);
					this.sendNavData();
				})
				.catch((err) => {
					this.appendStatusText("<br><br>Error loading data - " + err.message);
					this.sendToRenderer("set-status-close-button-visible", true);
				});
		} else {
			let html = "The event is not a blue alliance event";
			this.sendToRenderer("set-status-visible", true);
			this.sendToRenderer("set-status-title", "Load Zebra Tag Data");
			this.sendToRenderer("set-status-html", html);
			this.sendToRenderer("set-status-close-button-visible", true);
		}
	}

	private importBlueAllianceStatboticsData() {
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

		let fev: BAEvent | undefined = this.project_?.info.frcev_;
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
			this.project_!.loadExternalData(
				this.ba_!,
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

		treedata.push({ type: "separator", title: "General" });

		treedata.push({ type: "item", command: SCCentral.viewHelp, title: "Help" });
		treedata.push({
			type: "item",
			command: SCCentral.viewPreviewForm,
			title: "Preview Form",
		});

		if (this.project_) {
			treedata.push({
				type: "item",
				command: SCCentral.viewInit,
				title: "Event Info",
			});
			treedata.push({ type: "separator", title: "Teams" });
			treedata.push({
				type: "item",
				command: SCCentral.viewTeamForm,
				title: "Form",
			});
			if (this.project_.info.locked_) {
				treedata.push({
					type: "item",
					command: SCCentral.viewTeamStatus,
					title: "Status",
				});
				treedata.push({
					type: "item",
					command: SCCentral.viewTeamDB,
					title: "Data",
				});
			}

			treedata.push({ type: "separator", title: "Match" });
			treedata.push({
				type: "item",
				command: SCCentral.viewMatchForm,
				title: "Form",
			});
			if (this.project_.info.locked_) {
				treedata.push({
					type: "item",
					command: SCCentral.viewMatchStatus,
					title: "Status",
				});
				treedata.push({
					type: "item",
					command: SCCentral.viewMatchDB,
					title: "Data",
				});
			}


			if (this.project_.info.zebra_tag_data_) {
				treedata.push({ type: "separator", title: "Zebra Tag" });

				treedata.push({
					type: "item",
					command: SCCentral.viewZebraStatus,
					title: "Status",
				});

				treedata.push({
					type: "item",
					command: SCCentral.viewZebraData,
					title: "Plots",
				});
			}

			treedata.push({ type: "separator", title: "Analysis" });
			
			if (this.project_.info.locked_) {
				treedata.push({
					type: "item",
					command: SCCentral.viewPicklist,
					title: "Picklist",
				});

				treedata.push({
					type: "item",
					command: SCCentral.viewSingleTeamSummary,
					title: "Single Team",
				});				
				
				treedata.push({
					type: "item",
					command: SCCentral.viewTeamGraph,
					title: "Team Graph",
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
			if (!this.project_?.info.teamassignments_) {
				this.sendToRenderer(
					"update-main-window-view",
					"empty",
					"Scouting schedule not generated yet"
				);
			} else {
				this.setView("teamstatus");
			}
		} else if (cmd === SCCentral.viewMatchStatus) {
			if (!this.project_?.info.matchassignements_) {
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
		} else if (cmd === SCCentral.viewZebraData) {
			this.setView("zebraview");
		} else if (cmd === SCCentral.viewZebraStatus) {
			this.setView("zebrastatus");
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
							if (this.project_.info.locked_) {
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

			if (this.project_?.info.frcev_?.name) {
				evname = this.project_.info.frcev_.name;
			} else {
				evname = this.project_?.info.name_;
			}

			let evid = {
				uuid: this.project_!.info.uuid_,
				name: evname,
			};
			let uuidbuf = Buffer.from(JSON.stringify(evid), "utf-8");
			resp = new PacketObj(PacketType.Hello, uuidbuf);
		} else if (p.type_ === PacketType.RequestTablets) {
			let data: Uint8Array = new Uint8Array(0);
			if (this.project_ && this.project_.info.tablets_) {
				let tablets: any[] = [];

				for (let t of this.project_?.info.tablets_) {
					if (!t.assigned) {
						tablets.push({ name: t.name, purpose: t.purpose });
					}
				}

				let msg: string = JSON.stringify(tablets);
				data = Buffer.from(msg, "utf-8");
			}
			resp = new PacketObj(PacketType.ProvideTablets, data);
		} else if (p.type_ === PacketType.RequestTeamForm) {
			if (this.project_?.info.teamform_) {
				let jsonstr = fs.readFileSync(this.project_.info.teamform_).toString();
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
			if (this.project_?.info.matchform_) {
				let jsonstr = fs.readFileSync(this.project_.info.matchform_).toString();
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
			if (this.project_?.info.teamassignments_) {
				let str = JSON.stringify(this.project_?.info.teamassignments_);
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
			if (this.project_?.info.matchassignements_) {
				let str = JSON.stringify(this.project_?.info.matchassignements_);
				resp = new PacketObj(PacketType.ProvideMatchList, Buffer.from(str));
			} else {
				resp = new PacketObj(
					PacketType.Error,
					Buffer.from(
						"internal error #3 - no match list has been generated for a locked event",
						"utf-8"
					)
				);
				dialog.showErrorBox(
					"Internal Error #3",
					"No match list has been generated for a locked event"
				);
			}
		} else if (p.type_ === PacketType.ProvideResults) {
			try {
				let obj : ScoutingData = JSON.parse(p.payloadAsString()) as ScoutingData ;
				this.project_!.processResults(obj);
				resp = new PacketObj(PacketType.ReceivedResults);

				if (this.project_!.isTabletTeam(obj.tablet)) {
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

	public sendZebraData() {
		let imname = this.searchForImage('field2024') ;
		if (imname) {
			let desc = this.getImageFromJson('field2024', imname) ;
			let obj = {
				images: [desc],
				data: this.project_?.info.zebra_tag_data_
			};

			this.sendToRenderer('send-zebra-data', obj) ;
		}
	}

	public getTeamList() {
		let ret: number[] = [];
		for(let team of this.project_?.info.teams_!) {
			ret.push(team.team_number);
		}

		ret.sort((a, b) => (a - b)) ;
		this.sendToRenderer('send-team-list', ret) ;
	}

	public async getTeamFieldList() {
		let balist = ['ba_opr', 'ba_dpr'] ;

		let cols = await this.project_?.teamDB.getColumnNames(TeamDataModel.TeamTableName) ;
		let formcols = this.project_!.getFormItemNames(this.project_?.info.teamform_!) ;

		if (!cols) {
			cols = [] ;
		}

		if (!(formcols instanceof Error)) {
			for(let col of formcols) {
				if (!cols!.includes(col.name)) {
					cols.push(col.name) ;
				}
			}
		}

		for(let one of balist) {
			if (!cols.includes(one)) {
				cols.push(one) ;
			}
		}

		this.sendToRenderer('send-team-field-list', cols) ;
	}

	public async getMatchFieldList() {
		let cols = await this.project_?.matchDB.getColumnNames(MatchDataModel.MatchTableName) ;
		let formcols = this.project_!.getFormItemNames(this.project_?.info.matchform_!) ;

		if (!cols) {
			cols = [] ;
		}

		if (!(formcols instanceof Error)) {
			for(let col of formcols) {
				if (!cols!.includes(col.name)) {
					cols.push(col.name) ;
				}
			}}

		cols.sort() ;
		this.sendToRenderer('send-match-field-list', cols) ;
	}

	public async saveTeamGraphSetup(desc: NamedGraphDataRequest) {
		this.project_!.storeGraph(desc) ;
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
		if (this.project_) {
			let labels: Array<Array<string>> = [];
			let datasets: GraphDataset[] = [];

			for (let team of request.teams) {
				let t = this.project_.findTeamByNumber(team) ;

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
				let ds = await this.createTeamDataset(request.teams, tdset, 'y');
				if (ds) {
					datasets.push(ds);
				}
			}

			for (let tdset of request.data.leftmatch) {
				let ds = await this.createMatchDataset(request.teams, tdset, 'y');
				if (ds) {
					datasets.push(ds);
				}
			}

			for (let tdset of request.data.rightteam) {
				let ds = await this.createTeamDataset(request.teams, tdset, 'y2');
				if (ds) {
					datasets.push(ds);
				}
			}

			for (let tdset of request.data.rightmatch) {
				let ds = await this.createMatchDataset(request.teams, tdset, 'y2');
				if (ds) {
					datasets.push(ds);
				}
			}

			let grdata : GraphData = {
				labels: labels,
				datasets: datasets,
			};
			this.sendToRenderer('send-team-graph-data', grdata);
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

		for(let match of this.project_!.info.matches_!) {
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
		this.sendToRenderer('send-stored-graph-list', this.project_!.info.team_graph_data_) ;
	}

	public deleteStoredGraph(name: string) {
		this.project_!.deleteStoredGraph(name) ;
		this.sendToRenderer('send-stored-graph-list', this.project_!.info.team_graph_data_) ;
	}

	private getNickNameFromTeamNumber(team: number) : string {
		for(let t of this.project_?.info.teams_!) {
			if (t.team_number === team) {
				return t.nickname ;
			}
		}

		return 'UNKNOWN';
	}

	public sendPicklistColumns(name: string) {
		if (this.project_) {
			let picklist = this.project_.findPicklistByName(name) ;
			if (picklist) {
				let obj = {
					name: name,
					columns: picklist.columns
				}
				this.sendToRenderer('send-picklist-columns', obj) ;
			}
		}
	}

	private async doExportPicklist() {
		if (this.project_) {
			if (this.project_.info.picklist_.length > 0) {
				for(let picklist of this.project_?.info.picklist_) {
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
					await this.project_!.exportPicklist(picklist.name, filename) ;
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
		if (this.project_) {
			let picklist = this.project_.findPicklistByName(name) ;
			if (picklist) {
				this.project_.deletePicklist(name) ;
			}
			else {
				dialog.showMessageBox(this.win_, {
					title: 'Error Deleting Picklist',
					message: 'There was a request to delete picklist \'' + name + '\' which does not exist'
				});
			}

			this.sendPicklistList(false) ;
		}
	}

	public createNewPicklist(name: string) {
		if (this.project_) {
			let picklist = this.project_.findPicklistByName(name) ;
			if (picklist) {
				dialog.showMessageBox(this.win_, {
					title: 'Error Creating New Picklist',
					message: 'There is already a picklist named \'' + name + '\''
				});
			}
			else {
				this.project_.addPicklist(name) ;
				this.sendPicklistData(name) ;
				this.sendPicklistColumns(name) ;
				this.sendPicklistList(false) ;
			}
		}
	}

	public sendPicklistList(senddef: boolean) {
		interface MyObject {
			[key: string]: any; // Allows any property with a string key
		}

		let data: string[] = [] ;

		if (this.project_) {
			for(let picklist of this.project_?.info.picklist_) {
				data.push(picklist.name) ;
			}
		}

		let obj: MyObject = {} ;
		obj.list = data ;
		if (senddef) {
			obj.default = this.project_?.info.last_picklist_
		}

		this.sendToRenderer('send-picklist-list', obj) ;
	}

	public sendPicklistData(name: string) {
        let data : any[] = [] ;
        if (this.project_ && this.project_.info.teams_) {
			if (!name) {
				if (this.project_.info.picklist_.length === 0) {
					return ;
				}

				if (this.project_.info.last_picklist_) {
					name = this.project_.info.last_picklist_ ;
				}
				else {
					name = this.project_.info.picklist_[0].name ;
				}
			}

			this.project_.setLastPicklistUsed(name) ;
			let picklist = this.project_.findPicklistByName(name) ;
			if (picklist) {
				if (picklist.teams.length === 0) {
					for(let team of this.project_.info.teams_) {
						picklist.teams.push(team.team_number) ;
					}
				}

				let rank = 1 ;
				for(let team of picklist.teams) {
					let name = this.getNickNameFromTeamNumber(team) ;
					let obj = {
						rank: rank++,
						teamnumber: team,
						nickname: name
					};
					data.push(obj) ;
				}
			}
        }
		let obj = {
			name: name,
			data: data
		} ;
        this.sendToRenderer('send-picklist-data', obj) ;
	}

	public async sendPicklistColData(field: string) {
		let values: number[] = [];
		let teams: number[] = [] ;

		for(let t of this.project_!.info.teams_!) {
			let v = await this.project_!.getData(field, t.team_number) ;
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

	public updatePicklistColumns(obj: any) {
		this.project_!.setPicklistCols(obj.name, obj.cols);
	}

	public updatePicklistData(obj: any) {
		this.project_!.setPicklistData(obj.name, obj.teams) ;
	}

	public async sendPicklistNotes(name: string) {
		if (this.project_) {
			let picklist = this.project_?.findPicklistByName(name) ;
			if (picklist) {
				let data = {
					name: name,
					notes: picklist.notes
				}
				this.sendToRenderer('send-picklist-notes', data) ;
			}
		}
	}

	public updatePicklistNotes(obj: any) {
		this.project_!.setPicklistNotes(obj.name, obj.notes) ;
	}

	private async getSingleTeamIndividualData(team: number) : Promise<any> {
		interface MyObject {
			[key: string]: any; // Allows any property with a string key
		}

		let ret = new Promise<any>(async (resolve, reject) => {
			let values : MyObject = {} ;
			for(let field of [...this.project_!.info.single_team_match_, ... this.project_!.info.single_team_team_]) {
				let v = await this.project_!.getData(field, team) ;
				values[field] = v ;
			}
			resolve(values) ;
		}) ;

		return ret;
	}

	public async getSingleTeamData(obj: any) {
		interface MyObject {
			[key: string]: any; // Allows any property with a string key
		}
		let retdata : MyObject = {} ;

		if (this.project_) {
			retdata.matches = this.project_.getMatchResults(obj) ;
			retdata.teamdata = await this.getSingleTeamIndividualData(obj) ;
		}

		this.sendToRenderer('send-single-team-data', retdata) ;
	}

	public updateSingleTeamData(obj: any) {
		this.project_!.setSingleTeamFields(obj.team, obj.match) ;
		this.getSingleTeamData(obj) ;
	}

	public getSingleTeamFields() {
		let obj = {
			team: this.project_!.info.single_team_team_,
			match: this.project_!.info.single_team_match_
		} ;
		this.sendToRenderer('send-single-team-fields', obj) ;
	}

	private findZebraData(comp: string, setno: number, matchno: number) : any | undefined {
		for(let zdata of this.project_!.info.zebra_tag_data_) {
			if (zdata && zdata.comp_level === comp && zdata.match_number === matchno && zdata.set_number === setno) {
				return zdata ;
			}
		}

		return undefined ;
	}

	private getDataStatus(alliances: any[], tkey: string) : boolean {
		let ret = false ;

		for(let data of alliances) {
			if (data.team_key === tkey) {
				//
				// So the team is in the zebra data, but sometimes the data is all null
				//
				if (data.xs.length !== data.ys.length) {
					break ;
				}

				for(let i = 0 ; i < data.xs.length ; i++) {
					if (data.xs[i] === null || data.ys[i] === null) {
						break ;
					}
				}
				ret = true ;
				break ;
			}
		}
		return ret ;
	}

	public getZebraStatus() {
		let data : ZebraStatus[] = [] ;
		if (this.project_ && this.project_.info.matches_) {
			for(let m of this.project_!.info.matches_!) {
				let zdata = this.findZebraData(m.comp_level, m.set_number, m.match_number) ;
				let obj: ZebraStatus = {
					comp_level: m.comp_level,
					set_number: m.set_number,
					match_number: m.match_number,
					red1: this.keyToTeamNumber(m.alliances.red.team_keys[0]),
					redst1: false,
					red2: this.keyToTeamNumber(m.alliances.red.team_keys[1]),
					redst2: false,
					red3: this.keyToTeamNumber(m.alliances.red.team_keys[2]),
					redst3: false,
					blue1: this.keyToTeamNumber(m.alliances.blue.team_keys[0]),
					bluest1: false,
					blue2: this.keyToTeamNumber(m.alliances.blue.team_keys[1]),
					bluest2: false,
					blue3: this.keyToTeamNumber(m.alliances.blue.team_keys[2]),
					bluest3: false
				} ;

				if (zdata) {
					obj.redst1 = this.getDataStatus(zdata.alliances.red, m.alliances.red.team_keys[0]) ;
					obj.redst2 = this.getDataStatus(zdata.alliances.red, m.alliances.red.team_keys[1]) ;
					obj.redst3 = this.getDataStatus(zdata.alliances.red, m.alliances.red.team_keys[2]) ;
					obj.bluest1 = this.getDataStatus(zdata.alliances.blue, m.alliances.blue.team_keys[0]) ;
					obj.bluest2 = this.getDataStatus(zdata.alliances.blue, m.alliances.blue.team_keys[1]) ;
					obj.bluest3 = this.getDataStatus(zdata.alliances.blue, m.alliances.blue.team_keys[2]) ;
				}

				data.push(obj) ;
			}
		}

		this.sendToRenderer('send-zebra-status', data) ;
	}
}

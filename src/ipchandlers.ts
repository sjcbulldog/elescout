import { scappbase } from "./main";
import { SCCentral } from "./apps/sccentral";
import { SCScout } from "./apps/scscout";
import { SCCoach } from "./apps/sccoach";
import { XeroAppType } from "./apps/scbase";

export async function executeCommand(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        scappbase.executeCommand(args[0] as string) ;
    }
}

export async function loadBaEventData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.loadBaEventData(args) ;
    }
}

export async function getTreeData(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        scappbase.sendNavData() ;
    }
}

export async function getInfoData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendInfoData() ;
    }
}

export async function getSelectEventData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendEventData() ;
    } 
}

export async function getTabletData(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        if (scappbase.applicationType === XeroAppType.Central) {
            let central : SCCentral = scappbase as SCCentral ;
            central.sendTabletData() ;
        }
        else {
            let scout: SCScout = scappbase as SCScout ;
            scout.sendTabletData() ;
        }
    } 
}

export async function setTabletData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setTabletData(args[0]) ;
    } 
}

export async function getTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamData() ;
    } 
}

export async function setEventName(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setEventName(args[0]) ;
    }
}

export async function generateRandomData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.generateRandomData() ;
    }
}

export async function setTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setTeamData(args[0]) ;
    } 
}


export async function sendMatchColConfig(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setMatchColConfig(args[0]) ;
    } 
}

export async function sendTeamColConfig(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setTeamColConfig(args[0]) ;
    } 
}

export async function getTeamGraphData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamGraphData(args[0]) ;
    } 
}

export async function setTabletNamePurpose(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;
        scout.setTabletNamePurpose(args[0].name, args[0].purpose) ;
    } 
}

export async function provideResult(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;
        scout.provideResults(args[0]) ;
    } 
}


export async function getMatchDB(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendMatchDB() ;
    } 
}

export async function getTeamDB(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamDB() ;
    } 
}

export async function getMatchData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendMatchData() ;
    } 
}

export async function setMatchData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setMatchData(args[0]) ;
    } 
}

export async function getForm(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        if (scappbase.applicationType === XeroAppType.Central) {
            scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
            let central : SCCentral = scappbase as SCCentral ;
            central.sendForm(args[0]) ;
        } 
        else if (scappbase.applicationType === XeroAppType.Scouter) {
            let scout: SCScout = scappbase as SCScout ;
            scout.sendForm(args[0]) ;
        }
    }
}

export async function getTeamStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamStatus() ;
    } 
}

export async function getMatchStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendMatchStatus() ;
    } 
}

export async function getZebraMatchList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getZebraMatchList() ;
    } 
}

export async function getZebraMatchData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getZebraMatchData(args[0]) ;
    } 
}

export async function getTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getTeamList() ;
    } 
}

export async function getTeamFieldList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getTeamFieldList() ;
    } 
}

export async function getMatchFieldList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getMatchFieldList() ;
    } 
}

export async function saveTeamGraphSetup(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.saveTeamGraphSetup(args[0]) ;
    } 
}

export async function getMatchList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getMatchList() ;
    } 
}

export async function getStoredGraphList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getStoredGraphList() ;
    } 
}
export async function deleteStoredGraph(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.deleteStoredGraph(args[0]) ;
    } 
}

import { SCCentral } from "./central/sccentral";
import { scappbase } from "./main";
import { SCScout } from "./scout/scscout";

export async function executeCommand(...args: any[]) {
    if (scappbase) {
        scappbase.executeCommand(args[0] as string) ;
    }
}

export async function loadBaEventData(...args: any[]) {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.loadBaEventData(args) ;
    }
}

export async function getTreeData() {
    if (scappbase) {
        scappbase.sendNavData() ;
    }
}

export async function getInfoData() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendInfoData() ;
    }
}

export async function getSelectEventData() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendEventData() ;
    } 
}

export async function getTabletData() {
    if (scappbase) {
        if (!scappbase.isScoutingTablet()) {
            let central : SCCentral = scappbase as SCCentral ;
            central.sendTabletData() ;
        }
        else {
            let scout: SCScout = scappbase as SCScout ;
            scout.sendTabletData() ;
        }
    } 
}

export async function setTabletData(...args: any[]) {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.setTabletData(args[0]) ;
    } 
}

export async function getTeamData() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamData() ;
    } 
}

export async function setTeamData(...args: any[]) {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.setTeamData(args[0]) ;
    } 
}

export async function setTabletNamePurpose(...args: any[]) {
    if (scappbase && scappbase.isScoutingTablet()) {
        let scout : SCScout = scappbase as SCScout ;
        scout.setTabletNamePurpose(args[0], args[1]) ;
    } 
}

export async function getMatchData() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendMatchData() ;
    } 
}

export async function setMatchData(...args: any[]) {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.setMatchData(args[0]) ;
    } 
}

export async function getTeamForm() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamForm() ;
    } 
}

export async function getPreviewForm() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPreviewForm() ;
    } 
}

export async function getMatchForm() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendMatchForm() ;
    } 
}

export async function getTeamStatus() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendTeamStatus() ;
    } 
}

export async function getMatchStatus() {
    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendMatchStatus() ;
    } 
}
import { SCCentral } from "./central/sccentral";
import { scappbase } from "./main";

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
        scappbase.sendTreeData() ;
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
        central.sendSelectEventData() ;
    } 
}

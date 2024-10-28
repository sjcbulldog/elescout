import { SCCentral } from "./central/sccentral";
import { scappbase } from "./main";

export async function executeCommand(...args: any[]) {
    if (scappbase) {
        scappbase.executeCommand(args[0] as string) ;
    }
}

export async function getTreeData() {
    let obj ;

    if (scappbase) {
        scappbase.sendTreeData() ;
    }
}

export async function getInfoData() {
    let obj ;

    if (scappbase && !scappbase.isScoutingTablet()) {
        let central : SCCentral = scappbase as SCCentral ;
        central.sendInfoData() ;
    }
}


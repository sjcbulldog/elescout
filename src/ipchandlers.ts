import { scappbase } from "./main";
import { SCCentral } from "./apps/sccentral";
import { SCScout } from "./apps/scscout";
import { SCCoach } from "./apps/sccoach";
import { XeroAppType } from "./apps/scbase";
import { TabletData } from "./project/project";

export async function executeCommand(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 1 && typeof args[0][0] === 'string') {
            scappbase.executeCommand(args[0][0] as unknown as string) ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    }
}

export async function loadBaEventData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 1 && typeof args[0][0] === 'string') {
            central.loadBaEventData(args[0][0] as unknown as string) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
            central.loadBaEventDataError() ;
        }
    }
}

export async function getTreeData(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            scappbase.sendNavData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }
    }
}

export async function getInfoData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendInfoData() ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }
    }
}

export async function getFormulas(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendFormulas() ;
        } else {

        }        
    }
}

export async function getSelectEventData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendEventData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }             
    } 
}

export async function getTabletData(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});

        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            if (scappbase.applicationType === XeroAppType.Central) {
                let central : SCCentral = scappbase as SCCentral ;
                central.sendTabletData() ;
            }
            else {
                let scout: SCScout = scappbase as SCScout ;
                scout.sendTabletData() ;
            }
        }
        else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});            
        }
    } 
}

export async function setTabletData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 1) {
            central.setTabletData(args[0][0] as unknown as TabletData[]) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});            
        }
    } 
}

export async function getTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendTeamData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }              
    } 
}

export async function getMatchDB(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendMatchDB() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    } 
}

export async function getTeamDB(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendTeamDB() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    } 
}
export async function getMatchData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendMatchData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

export async function getTeamStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendTeamStatus() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }         
    } 
}

export async function getMatchStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendMatchStatus() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }         
    } 
}

export async function generateRandomData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.generateRandomData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }          
    }
}

export async function getZebraData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.sendZebraData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           

    } 
}

export async function getTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getTeamList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           

    } 
}

export async function getMultiTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getMultiTeamList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    } 
}

export async function getTeamFieldList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getTeamFieldList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            

    } 
}

export async function getMatchFieldList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getMatchFieldList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            

    } 
}

export async function getSingleTeamFormulas(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getSingleTeamFormulas() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function getMatchList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getSingleTeamFormulas() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
        central.getMatchList() ;
    } 
}

export async function getStoredGraphList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getStoredGraphList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            

    }
}

export async function getPreferences(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            scout.sendPreferences() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

export async function getZebraStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0]) && (args[0]).length === 0) {
            central.getZebraStatus() ;
        } else {
            scappbase.logger_.error({ message: 'renderer ->main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function setEventName(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setEventName(args[0]) ;
    }
}

export async function deleteFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.deleteFormula(args) ;
    }
}

export async function addFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.addFormula(args) ;
    }
}

export async function renameFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.renameFormula(args) ;
    }
}

export async function updateFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updateFormula(args) ;
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

export async function setMultiTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setMultiTeamList(args) ;
    } 
}

export async function getMultiTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getMultiTeamData(args[0], args[1]) ;
    } 
}

export async function saveTeamGraphSetup(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.saveTeamGraphSetup(args[0]) ;
    } 
}

export async function deleteStoredGraph(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.deleteStoredGraph(args[0]) ;
    } 
}

export async function getPicklistData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistData(args[0]) ;
    } 
}

export async function getPicklistList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistList(true) ;
    } 
}

export async function createNewPicklist(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.createNewPicklist(args[0]) ;
    } 
}

export async function deletePicklist(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.deletePicklist(args[0]) ;
    } 
}

export async function getPicklistColumns(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistColumns(args[0]) ;
    } 
}

export async function getPicklistColData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistColData(args[0]) ;
    } 
}

export async function updatePicklistColumns(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updatePicklistColumns(args[0]) ;
    } 
}

export async function updatePicklistData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updatePicklistData(args[0]) ;
    } 
}

export async function updatePicklistNotes(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updatePicklistNotes(args[0]) ;
    } 
}

export async function getPicklistNotes(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistNotes(args[0]) ;
    } 
}

export async function updatePreferences(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;
        scout.updatePreferences(args[0]) ;
    } 
}

export async function clientLog(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logClientMessage(args[0]) ;
    }
}

export async function getSingleTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getSingleTeamData(args[0]) ;
    } 
}

export async function updateSingleTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updateSingleTeamData(args[0]) ;
    } 
}

export async function getSingleTeamFields(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer ->main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getSingleTeamFields() ;
    } 
}


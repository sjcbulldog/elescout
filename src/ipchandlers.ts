import { scappbase } from "./main";
import { SCCentral } from "./apps/sccentral";
import { SCScout } from "./apps/scscout";
import { SCCoach } from "./apps/sccoach";
import { XeroAppType } from "./apps/scbase";
import { ProjColConfig, TabletData } from "./project/project";
import { OneScoutField } from "./comms/resultsifc";
import { GraphDataRequest } from "./apps/sccentral";

// get-info-data
export async function getInfoData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendInfoData() ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }
    }
}

// get-nav-data
export async function getNavData(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        if (args.length === 0) {
            scappbase.sendNavData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }
    }
}

// get-formulas
export async function getFormulas(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendFormulas() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }        
    }
}

// get-event-data
export async function getSelectEventData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendEventData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }             
    } 
}

// get-tablet-data
export async function getTabletData(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});

        if (args.length === 0) {
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
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});            
        }
    } 
}

// generate-random-data
export async function generateRandomData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.generateRandomData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }          
    }
}

// get-team-data
export async function getTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendTeamData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }              
    } 
}

// get-match-data
export async function getMatchData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendMatchData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

// get-match-db
export async function getMatchDB(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendMatchDB() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    } 
}

// get-team-db
export async function getTeamDB(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendTeamDB() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    } 
}

// get-team-status
export async function getTeamStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendTeamStatus() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }         
    } 
}

// get-match-status
export async function getMatchStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendMatchStatus() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }         
    } 
}   

// get-zebra-data
export async function getZebraData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.sendZebraData() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           

    } 
}

// get-team-list
export async function getTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getTeamList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           

    } 
}

// get-multi-selected-teams
export async function getMultiTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getMultiTeamList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    } 
}

// get-team-field-list
export async function getTeamFieldList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getTeamFieldList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            

    } 
}

// get-match-field-list
export async function getMatchFieldList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getMatchFieldList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

// get-single-team-formulas
export async function getSingleTeamFormulas(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getSingleTeamFormulas() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

// get-zebra-status
export async function getZebraStatus(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getZebraStatus() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

// get-preferences
export async function getPreferences(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;
        if (args.length === 0) {
            scout.sendPreferences() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

// get-stored-graph-list
export async function getStoredGraphList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getStoredGraphList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            

    }
}

// get-match-list
export async function getMatchList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 0) {
            central.getMatchList() ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }            
    } 
}

// load-ba-event-data evkey:string
export async function loadBaEventData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && typeof args[0] === 'string') {
            central.loadBaEventData(args[0] as string) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
            central.loadBaEventDataError() ;
        }
    }
}

// execute-command cmd:string
export async function executeCommand(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        if (args.length === 1 && typeof args[0] === 'string') {
            scappbase.executeCommand(args[0] as unknown as string) ;
        } else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }           
    }
}

// set-tablet-data data:TabletData[]
export async function setTabletData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1) {
            central.setTabletData(args[0] as TabletData[]) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});            
        }
    } 
}

// delete-formula formula_name:string
export async function deleteFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && typeof args[0] === 'string') {
            central.deleteFormula(args[0] as string) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});            
        }
    }
}

// update-formula [formula_name:string, formula:string]
export async function updateFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0])) {
            let data = args[0] as any[] ;
            if (data.length === 2 && typeof data[0] === 'string' && typeof data[1] === 'string') {
                central.updateFormula(data[0] as string, data[1] as string) ;
            }
            else {
                scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});                 
            }
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }
    }
}

// rename-formula [old_name:string, new_name:string]
export async function renameFormula(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0])) {
            let data = args[0] as any[] ;
            if (data.length === 2 && typeof data[0] === 'string' && typeof data[1] === 'string') {
                central.renameFormula(data[0] as string, data[1] as string) ;
            }
            else {
                scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});                 
            }
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }
    }
}

// set-event-name event_name:string
export async function setEventName(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && typeof args[0] === 'string') {
            central.setEventName(args[0]) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }
    }
}

// get-form form_name:string
export async function getForm(cmd: string, ...args: any[]) {
    if (scappbase) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        if (args.length === 1 && typeof args[0] === 'string') {
            if (scappbase.applicationType === XeroAppType.Central) {
                scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
                let central : SCCentral = scappbase as SCCentral ;
                central.sendForm(args[0]) ;
            } 
            else if (scappbase.applicationType === XeroAppType.Scouter) {
                let scout: SCScout = scappbase as SCScout ;
                scout.sendForm(args[0]) ;
            }
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }
    }
}

// set-match-data data:object[]
export async function setMatchData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && Array.isArray(args[0])) {
            central.setMatchData(args[0]) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }        
    } 
}

// set-tablet-name-purpose { name: string, purpose: string }
export async function setTabletNamePurpose(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;       
        if (args.length === 1 && typeof args[0] === 'object') {
            let obj = args[0] ;
            if (obj.hasOwnProperty('name') && obj.hasOwnProperty('purpose')) {
                scout.setTabletNamePurpose(obj.name, obj.purpose) ;
            }
            else {
                scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});                     
            }
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }        
    } 
}

// provide-result data:object[]
export async function provideResult(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let scout : SCScout = scappbase as SCScout ;
        if (args.length === 1 && typeof args[0] === 'object') {
            scout.provideResults(args[0] as OneScoutField[]) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});             
        }
    } 
}

// set-team-data data:ProjColConfig
export async function sendMatchColConfig(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && typeof args[0] === 'object') {
            central.setMatchColConfig(args[0] as ProjColConfig) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});     
        }
    } 
}

// set-team-col-config data:ProjColConfig
export async function sendTeamColConfig(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && typeof args[0] === 'object') {
            central.setTeamColConfig(args[0] as ProjColConfig) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});     
        }
    } 
}

// get-team-graph-data
export async function getTeamGraphData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        if (args.length === 1 && typeof args[0] === 'object') {
            central.sendTeamGraphData(args[0] as GraphDataRequest) ;
        }
        else {
            scappbase.logger_.error({ message: 'renderer -> main invalid args', args: {cmd: cmd, cmdargs: args}});
        }
    } 
}

// set-multi-selected-teams data:string[]
export async function setMultiTeamList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setMultiTeamList(args) ;
    } 
}

/////////////////////////////////////////////////////////////////////////////////////////

export async function setTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.setTeamData(args[0]) ;
    } 
}

export async function getMultiTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getMultiTeamData(args[0], args[1]) ;
    } 
}

export async function saveTeamGraphSetup(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.saveTeamGraphSetup(args[0]) ;
    } 
}

export async function deleteStoredGraph(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.deleteStoredGraph(args[0]) ;
    } 
}

export async function getPicklistData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistData(args[0]) ;
    } 
}

export async function getPicklistList(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistList(true) ;
    } 
}

export async function createNewPicklist(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.createNewPicklist(args[0]) ;
    } 
}

export async function deletePicklist(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.deletePicklist(args[0]) ;
    } 
}

export async function getPicklistColumns(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistColumns(args[0]) ;
    } 
}

export async function getPicklistColData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistColData(args[0]) ;
    } 
}

export async function updatePicklistColumns(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updatePicklistColumns(args[0]) ;
    } 
}

export async function updatePicklistData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updatePicklistData(args[0]) ;
    } 
}

export async function updatePicklistNotes(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updatePicklistNotes(args[0]) ;
    } 
}

export async function getPicklistNotes(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.sendPicklistNotes(args[0]) ;
    } 
}

export async function updatePreferences(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Scouter) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
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
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getSingleTeamData(args[0]) ;
    } 
}

export async function updateSingleTeamData(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.updateSingleTeamData(args[0]) ;
    } 
}

export async function getSingleTeamFields(cmd: string, ...args: any[]) {
    if (scappbase && scappbase.applicationType === XeroAppType.Central) {
        scappbase.logger_.silly({ message: 'renderer -> main', args: {cmd: cmd, cmdargs: args}});
        let central : SCCentral = scappbase as SCCentral ;
        central.getSingleTeamFields() ;
    } 
}


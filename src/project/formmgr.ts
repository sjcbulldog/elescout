import { FieldAndType } from "../model/datamodel";
import { Manager } from "./manager";
import winston from "winston";
import fs from "fs";
import path from "path";
import { DataManager } from "./datamgr";

export class FormInfo {
    public teamform_? : string ;                                              // The path to the form for team scouting
    public matchform_? : string ;                                             // The path to the form for match scouting    
    public team_form_columns_ : FieldAndType[] = [] ;                         // The list of columns that came from the team form
    public match_form_columns_ : FieldAndType[] = [] ;                        // The list of columns that came from the match form
}

export class FormManager extends Manager {
    private location_ : string ;
    private info_: FormInfo ;
    private data_mgr_: DataManager;

    constructor(logger: winston.Logger, writer: () => void, info: FormInfo, dir: string, datamgr: DataManager) {
        super(logger, writer) ;
        this.info_ = info ;
        this.location_ = dir ;
        this.data_mgr_ = datamgr ;
    }

    public setTeamForm(filename: string) : boolean {
        let target = path.join(this.location_, path.basename(filename)) ;
        fs.copyFileSync(filename, target) ;

        this.info_.teamform_ = path.basename(filename) ;

        let result = this.extractTeamFormFields() ;
        if (result instanceof Error) {
            this.logger_.error("Error getting team form fields: " + result.message) ;
            this.info_.teamform_ = undefined ;
            return false ;
        }

        this.info_.team_form_columns_ = result as FieldAndType[] ;
        this.write() ;
        return true ;
    }

    public getTeamFormFullPath() : string | undefined {
        if (this.info_.teamform_ && this.info_.teamform_.length > 0) {
            return path.join(this.location_, this.info_.teamform_) ;
        }
        return undefined ;
    }

    public getTeamFormFields() : FieldAndType[] {
        return this.info_.team_form_columns_ ;
    }
    
    public getTeamFormFieldNames() : string[] {
        let ret: string[] = [] ;
        for(let field of this.info_.team_form_columns_) {
            ret.push(field.name) ;
        }

        return ret ;
    }

    public setMatchForm(filename: string) : boolean {
        let target = path.join(this.location_, path.basename(filename)) ;
        fs.copyFileSync(filename, target) ;
        
        this.info_.matchform_ = path.basename(filename) ;

        let result = this.extractMatchFormFields() ;
        if (result instanceof Error) {
            this.logger_.error("Error getting match form fields: " + result.message) ;
            this.info_.matchform_ = undefined ;
            return false ;
        }

        this.info_.match_form_columns_ = result as FieldAndType[] ;
        this.write() ;
        return true ;
    }

    public getMatchFormFullPath() : string | undefined {
        if (this.info_.matchform_ && this.info_.matchform_.length > 0) {
            return path.join(this.location_, this.info_.matchform_) ;
        }
        return undefined ;
    }

    public getMatchFormFields() : FieldAndType[] {
        return this.info_.match_form_columns_ ;
    }

    public getMatchFormFieldNames() : string[] {
        let ret: string[] = [] ;
        for(let field of this.info_.match_form_columns_) {
            ret.push(field.name) ;
        }

        return ret ;
    }

    public hasTeamForm() : boolean {
        if (this.info_.teamform_ && this.info_.teamform_.length > 0) {
            return true ;
        }

        return false ;
    }

    public hasMatchForm() : boolean {
        if (this.info_.matchform_ && this.info_.matchform_.length > 0) {
            return true ;
        }

        return false ;
    }

    public hasForms() : boolean {
        return this.hasTeamForm() || this.hasMatchForm() ;
    }

    public extractTeamFormFields() : FieldAndType[] | Error {
        if (this.info_.teamform_ && this.info_.teamform_.length > 0) {
            return this.getFormItemNames(this.info_.teamform_) ;
        }

        return new Error("No team form found") ;
    }

    public extractMatchFormFields() : FieldAndType[] | Error {
        if (this.info_.matchform_ && this.info_.matchform_.length > 0) {
            return this.getFormItemNames(this.info_.matchform_) ;
        }

        return new Error("No match form found") ;
    }
    
    public populateDBWithForms() : Promise<void> {
        let ret = new Promise<void>((resolve, reject) => {
            if (!this.hasForms()) {
                reject(new Error('missing forms for event')) ;
                return ;
            }

            // Remove any old columns from an old team scouting form
            this.data_mgr_!.removeFormColumns()
                .then(() => {
                    this.write() ;
                    this.data_mgr_!.createFormColumns(this.getTeamFormFields(), this.getMatchFormFields())
                    .then(() => {
                        resolve() ;
                    })
                .catch((err) => {
                    reject(err) ;
                })                    
            })
            .catch((err) => {
                reject(err) ;
            }) ;
        }) ;

        return ret;
    }
    
    private getFormItemNames(filename: string) : FieldAndType[] | Error {
        let ret: FieldAndType[] = [] ;

        let formfile = path.join(this.location_, filename) ;

        try {
            let jsonstr = fs.readFileSync(formfile).toString();
            let jsonobj = JSON.parse(jsonstr);
            for(let section of jsonobj.sections) {
                for(let item of section.items) {
                    let obj = {
                        name: item.tag,
                        type: item.type
                    } ;

                    if (item.type === 'multi' && item.datatype && item.datatype === 'number') {
                        obj.type = 'number' ;
                    }
                    ret.push(obj) ;
                }
            }
        }
        catch(err) {
            return err as Error ;
        }

        return ret ;
    }
}
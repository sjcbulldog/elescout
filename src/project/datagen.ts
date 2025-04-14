import * as fs from 'fs' ;
import { OneScoutResult, ScoutingData } from '../comms/resultsifc';

export class DataGenerator
{
    public formtype: string | undefined ;
    private formpath_ : string ;
    private desc_: Object | undefined ;
    private items_ : any[] = [] ;

    private static randomStrings = [
        'error code xero',
        'grond',
        'data',
        'robot',
        'swimmy',
        'allegro',
        'wilsonville',
        'hotwire',
        'tbd',
        'jesuit',
        'flaming chickens'
    ] ;

    constructor(formpath: string, desc: Object) {
        this.formpath_ = formpath;
        this.desc_ = desc ;
    }

    public generateData(ids: string[]) : ScoutingData | null {
        let results = [] ;
        if (!this.parseForm()) {
            return null ;
        }

        let resarr = [] ;
        for(let id of ids) {
            let obj = this.generateDataForForm() ;
            resarr.push({
                item: id,
                data: obj
            }) ;
        }
        return {
            tablet: "",
            purpose: "",
            results: resarr
        } ;
    }

    protected generateDataForForm() : any {
        let result = [] ;
        for(let item of this.items_) {
            let value = this.generateItemValue(item) ;
            let obj = {
                tag: item.tag,
                value: value
            }
            result.push(obj) ;
        }
        return result ;
    }

    private getRandomInt(max: number) : number {
        return Math.floor(Math.random() * max);
    }

    private generateItemValue(item: any) : any {
        let value = undefined ;

        if (item.type === 'text') {
            let descf : any = this.desc_?.[item.tag as keyof typeof this.desc_] ;
            if (descf !== undefined) {
                let choices = descf.choices ;
                let i = this.getRandomInt(choices.length) ;
                value = choices[i] ;
            }
            else {
                let index = this.getRandomInt(DataGenerator.randomStrings.length) ;
                value = DataGenerator.randomStrings[index] ;
            }
        }
        else if (item.type === 'choice') {
            let i = this.getRandomInt(item.choices.length) ;
            value = item.choices[i] ;
        }
        else if (item.type === 'multi') {
            let i = this.getRandomInt(item.choices.length) ;
            value = item.choices[i].value ;
        }
        else if (item.type === 'boolean') {
            value = true ;
            if (this.getRandomInt(100) < 50) {
                value = false ;
            }
        }
        else if (item.type === 'updown') {
            value = this.getRandomInt(item.maximum  - item.minimum) + item.minimum ;
        }

        return value ;
    }

    protected parseForm() : boolean {
        let ret = true ;
        let text = fs.readFileSync(this.formpath_).toString() ;
        try {
            let obj = JSON.parse(text) ;
            this.formtype = obj.form ;
            for(let sect of obj.sections) {
                for(let item of sect.items) {
                    this.items_.push(item) ;
                }
            }
        }
        catch(err) {
            ret = false ;
        }

        return ret ;
    }

}
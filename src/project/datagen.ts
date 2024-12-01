import * as fs from 'fs' ;

export class DataGenerator
{
    public formtype: string | undefined ;
    private formpath_ : string ;
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

    constructor(formpath: string) {
        this.formpath_ = formpath;
    }

    public generateData(ids: string[]) : any {
        let results = [] ;
        if (!this.parseForm()) {
            return null ;
        }

        for(let id of ids) {
            let obj = this.generateDataForForm() ;
            results.push(id) ;
            results.push(obj) ;
        }

        return results ;
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
            let index = this.getRandomInt(DataGenerator.randomStrings.length) ;
            value = DataGenerator.randomStrings[index] ;
        }
        else if (item.type === 'choice') {
            let i = this.getRandomInt(item.choices.length) ;
            value = item.choices[i] ;
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
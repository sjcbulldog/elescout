
export class XeroTableDataModel {
    private data_ : any[] ;
    private filtered_data_ : any[] = [] ;

    public constructor(data: any[]) {
        this.data_ = data ;
        this.filtered_data_ = data ;
    }

    public rowCount(): number {
        return this.filtered_data_.length;
    }

    public getRowData(rowIndex: number): any {
        if (rowIndex < 0 || rowIndex >= this.filtered_data_.length) {
            throw new Error(`Row index ${rowIndex} is out of bounds.`);
        }
        return this.filtered_data_[rowIndex];
    }

    public filter(filter: (data: any) => boolean): void {
        this.filtered_data_ = this.data_.filter(filter);
    }

    private sortFunc(field: string, up: boolean, sort: ((a: any, b: any) => number) | undefined, a: any, b: any): number {
        let ret = 0 ;
        
        let aval = this.getFieldValue(a, field) ;
        let bval = this.getFieldValue(b, field) ;

        if (sort) {
            ret = sort(aval, bval) ;
        }
        else {
            if (aval === undefined || aval === null) {
                ret = 1 ;
            }
            else if (bval === undefined || bval === null) {
                ret = -1 ;
            }
            else if (aval < bval) {
                ret = -1 ;
            }
            else if (aval > bval) {
                ret = 1 ;
            }
            else {
                ret = 0 ;
            }
        }

        if (!up) {
            ret = -ret ;
        }

        console.log(`sort ${field} '${aval}' '${bval}' ${ret}`) ;

        return ret ;
    }

    public sort(field: string, up: boolean, sort?: (a: any, b: any) => number): void {
        this.filtered_data_.sort(this.sortFunc.bind(this, field, up, sort)) ;
    }

    private getFieldValue(obj: any, field: string): any {
        let fieldParts = field.split('.');
        let index = 0 ;
        while (index < fieldParts.length) {
            if (!(fieldParts[index] in obj)) {
                return undefined ;
            }
            obj = obj[fieldParts[index++]] ;
            if (obj === undefined || obj === null) {
                return undefined ;
            }
        }
        return obj ;
    }

    public getData(rowIndex: number, field: string): any {
        const rowData = this.getRowData(rowIndex);
        return this.getFieldValue(rowData, field) ;
    }
}
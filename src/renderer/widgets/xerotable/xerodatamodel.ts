
export class XeroTableDataModel {
    private data_ : any[] ;
    private filtered_data_ : any[] = [] ;
    private id_: number = 0 ;

    public constructor(data: any[]) {
        // We keep our own copy of the data
        this.data_ = [] ;
        this.filtered_data_ = [] ;
        for(let one of data) {
            one.id = this.id_++ ;
            this.data_.push(JSON.parse(JSON.stringify(one))) ;
            this.filtered_data_.push(JSON.parse(JSON.stringify(one))) ;
        }
    }

    public rowCount(): number {
        return this.filtered_data_.length;
    }

    public addRow(rowData: any): void {
        rowData.id = this.id_++ ;
        this.data_.push(rowData);
        this.filtered_data_.push(rowData);
    }

    public removeRow(rowIndex: number): void {
        if (rowIndex < 0 || rowIndex >= this.data_.length) {
            throw new Error(`Row index ${rowIndex} is out of bounds.`);
        }
        let id = this.filtered_data_[rowIndex].id ;
        this.filtered_data_.splice(rowIndex, 1);
        let index = this.data_.findIndex((row) => row.id === id);
        if (index !== -1) {
            this.data_.splice(index, 1);
        }
    }

    public getRowData(rowIndex: number): any {
        if (rowIndex < 0 || rowIndex >= this.filtered_data_.length) {
            throw new Error(`Row index ${rowIndex} is out of bounds.`);
        }
        return this.filtered_data_[rowIndex];
    }

    public getColData(field: string) {
        let colData = [] ;
        for (let i = 0; i < this.filtered_data_.length; i++) {
            let rowData = this.filtered_data_[i];
            let fieldParts = field.split('.');
            let obj = rowData;
            for (let j = 0; j < fieldParts.length; j++) {
                if (!(fieldParts[j] in obj)) {
                    throw new Error(`Field ${field} does not exist.`);
                }
                obj = obj[fieldParts[j]];
                if (obj === undefined || obj === null) {
                    break;
                }
            }
            colData.push(obj);
        }
        return colData;
    }

    public filter(filter: (data: any) => boolean): void {
        this.filtered_data_ = this.data_.filter(filter);
    }

    public setData(row: number, field: string, value: any): void {
        if (row < 0 || row >= this.filtered_data_.length) {
            throw new Error(`Row index ${row} is out of bounds.`);
        }
        let rowData = this.filtered_data_[row];
        let fieldParts = field.split('.');
        let obj = rowData;
        for (let i = 0; i < fieldParts.length - 1; i++) {
            if (!(fieldParts[i] in obj)) {
                throw new Error(`Field ${field} does not exist.`);
            }
            obj = obj[fieldParts[i]];
        }
        obj[fieldParts[fieldParts.length - 1]] = value;

        // Update the original data as well
        for(let i = 0; i < this.data_.length; i++) {
            if (this.data_[i].id === rowData.id) {
                this.data_[i] = rowData;
            }
        }
    }   

    private sortFunc(field: string, record: boolean, up: boolean, sort: ((a: any, b: any) => number) | undefined, a: any, b: any): number {
        let ret = 0 ;
        
        let aval = record ? a : this.getFieldValue(a, field) ;
        let bval = record ? b : this.getFieldValue(b, field) ;

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

        return ret ;
    }

    public sort(field: string, record: boolean, up: boolean, sort?: (a: any, b: any) => number): void {
        this.filtered_data_.sort(this.sortFunc.bind(this, field, record, up, sort)) ;
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
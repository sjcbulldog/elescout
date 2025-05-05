
export class XeroTableDataModel {
    private data_ : any[] ;

    public constructor(data: any[]) {
        this.data_ = data ;
    }

    public getRowData(rowIndex: number): any {
        if (rowIndex < 0 || rowIndex >= this.data_.length) {
            throw new Error(`Row index ${rowIndex} is out of bounds.`);
        }
        return this.data_[rowIndex];
    }
}
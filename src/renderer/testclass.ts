
export class TestClass {
    private test_: string ;

    public constructor(test: string) {
        this.test_ = test ;
    }

    public getTest() : string {
        return this.test_ ;
    }

    public setTest(test: string) : void {
        this.test_ = test ;
    }
}
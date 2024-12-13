
class XeroBaseSection {
    constructor(name, isimage, div) {
        this.name_ = name ;
        this.top_ = div ;
        this.isimage_ = isimage ;
        this.tags_ = [] ;
    }

    getValues() {
        return [] ;
    }

    setValue(name, type, value) {
    }

    static formViewNormalizeName(name) { 
        let ret = '' ;
    
        for(let ch of name) {
            if (ch.match(/[a-z]/i)) {
                ret += ch ;
            }
            else {
                ret += '_' ;
            }
        }
    
        return ret ;
    }
}
import * as path from 'path' ;

export class ContentManager {
    getStaticPage(name: string) : string {
        let ret: string = path.join(__dirname, name) ;
        return ret ;
    }
}
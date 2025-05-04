import { XeroLogger } from "../utils/xerologger";
import { XeroMainProcessInterface } from "../widgets/xerocbtarget";
import { XeroWidget } from "../widgets/xerowidget";

export class XeroNav  extends XeroWidget {
    private navelems_ : HTMLElement[] = [] ;

    public constructor() {
        super('div', 'xero-nav-list');

        this.registerCallback('send-nav-data', this.onNavData.bind(this)) ;
        this.registerCallback('send-nav-highlight', this.onNavHighlight.bind(this)) ;
        this.request('get-nav-data') ;
    }

    private onNavData(data: any) {
        let logger = XeroLogger.getInstance() ;
        logger.debug(`XeroNav.onNavData: data=${data}`) ;

        for(let item of data) {
            let navItem = document.createElement('div') ;
            navItem.className = 'xero-nav-item' ;
            navItem.xerodata = item.command ;

            if (item.type === 'item') {
                navItem.textContent = item.title ;
                navItem.className = 'xero-nav-list-item' ;
                this.navelems_.push(navItem) ;

                navItem.addEventListener('click', this.navItemClicked.bind(this)) ;
            }
            else if (item.type === 'icon') {
                navItem.className = 'xero-nav-list-icon' ;
                let icon = document.createElement('img') ;
                icon.src = `data:image/jpg;base64,${item.icon}`
                icon.alt = item.title;
                icon.title = item.title;
                icon.width = item.width ;
                icon.height = item.height;         
                icon.xerodata = item.command ;      
                navItem.appendChild(icon) ;
                this.navelems_.push(navItem) ;

                navItem.addEventListener('click', this.navItemClicked.bind(this)) ;
            }
            else if (item.type === 'separator') {
                navItem.className = 'xero-nav-list-separator' ;
                navItem.textContent = item.title ;
            }

            this.elem.appendChild(navItem) ;
        }
    }

    private onNavHighlight(data: any) {
        let logger = XeroLogger.getInstance() ;
        logger.debug(`XeroNav.onNavHighlight: data=${data}`) ;
    }

    private navItemClicked(event: Event) {
        let logger = XeroLogger.getInstance() ;
        let target = event.target as HTMLElement ;
        if (target && target.xerodata) {
            logger.debug(`XeroNav.navItemClicked: command=${target.xerodata}`) ;
            this.request('execute-command', target.xerodata) ;
        }
        else {
            logger.debug(`XeroNav.navItemClicked: no command found`) ;
        }
    }
}

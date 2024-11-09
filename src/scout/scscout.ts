import { BrowserWindow, Menu, MenuItem } from "electron";
import { SCBase } from "../base/scbase";
import { SyncClient } from "../sync/syncclient";
import { TCPClient } from "../sync/tcpclient";
import { Packet } from "../sync/packet";
import { PacketTypeError, PacketTypeHello, PacketTypeProvideMatchForm, PacketTypeProvideMatchList, PacketTypeProvideTablets, PacketTypeProvideTeamForm, PacketTypeProvideTeamList, PacketTypeRequestMatchForm, PacketTypeRequestMatchList, PacketTypeRequestTablets, PacketTypeRequestTeamForm, PacketTypeRequestTeamList } from "../sync/packettypes";
import * as path from 'path' ;
import * as fs from 'fs' ;
import { USBClient } from "../sync/usbclient";

export class MatchInfo {
    public type_? : string ;
    public set_? : number ;
    public number_? : number ;
} ;

export class SCScoutInfo {
    public tablet_? : string ;
    public purpose_? : string ;
    public uuid_? : string ;
    public teamform_? : string ;
    public matchform_? : string ;
    public teamlist_? : string[] ;
    public matchlist_? : MatchInfo[] ;
}

export class SCScout extends SCBase {
    private static readonly last_event_file = "lastevent" ;

    private static readonly viewHelp: string = "view-help" ;
    private static readonly syncEventTCP: string = "sync-event-tcp" ;
    private static readonly syncEventUSB: string = "sync-event-usb" ;

    private info_ : SCScoutInfo = new SCScoutInfo() ;

    private tcpHost_: string = "127.0.0.1" ;
    private tablets_?: any[] ;
    private conn_?: SyncClient ;

    public constructor(win: BrowserWindow) {
        super(win, 'scout') ;

        this.checkLastEvent() ;
    }
    
    public basePage() : string  {
        return "content/scscouter/scouter.html"
    }

    public sendNavData() : any {
        let treedata = [] ;

        treedata.push({type: 'item', command: SCScout.viewHelp, 'title' : 'Help'}) ;
        this.sendToRenderer('send-nav-data', treedata);
    }   

    public executeCommand(cmd: string) : void {   
        if (cmd === SCScout.viewHelp) {
        }
        else if (cmd === SCScout.syncEventTCP) {
            this.syncClient(new TCPClient(this.logger_, this.tcpHost_)) ;
        }
        else if (cmd === SCScout.syncEventUSB) {
            this.syncClient(new USBClient(this.logger_, [4, 3])) ;
        }
    }

    private syncClient(conn: SyncClient) {
        this.conn_ = conn ;
        conn.connect()
            .then(async ()=> {
                this.logger_.info('ScouterSync: connected to server \'' + conn.name() + '\'') ;
                let p: Packet = new Packet(PacketTypeHello) ;
                await this.conn_!.send(p) ;

                this.conn_!.on('close', () => {
                    this.conn_ = undefined ;
                }) ;

                this.conn_!.on('error', (err: Error) => {
                    let msg: string = "" ;
                    let a: any = err as any ;
                    if (a.errors) {
                        for(let cerror of a.errors) {
                            this.logger_.info('ScouterSync: error from connection \'' + conn.name() + '\' - ' + cerror.message) ;
                            msg += cerror.message + '\n' ;
                        }
                    }
                    else {
                        this.logger_.info('ScouterSync: error from connection \'' + conn.name() + '\' - ' + err.message) ;
                        msg = err.message ;
                    }

                    this.sendToRenderer('set-status-title', 'Error Connecting To XeroScout Central') ;
                    this.sendToRenderer('set-status-visible', true) ;
                    this.sendToRenderer('set-status-text', msg) ;
                    this.sendToRenderer('set-status-close-button-visible', true) ;
                }) ;

                this.conn_!.on('packet', (p: Packet) => {
                    this.syncTablet(p) ;
                }) ;
            })
            .catch((err) => {
                console.log(err) ;
            }) ;
    }

    private uuidToFileName(uuid: string) : string {
        return uuid ;
    }

    private syncTablet(p: Packet) {
        let ret = true ;

        if (p.type_ === PacketTypeHello) {
            let uuid = p.data_.toString() ;
            if (this.info_.uuid_ && this.info_.uuid_ !== uuid) {
                //
                // We have an event loaded and it does not match
                //
                this.sendToRenderer('set-status-title', 'Error Connecting To XeroScout Central') ;
                this.sendToRenderer('set-status-visible', true) ;
                this.sendToRenderer('set-status-text', 'The loaded event does not match event being synced - reset the tablet to sync to this new event.') ;
                this.sendToRenderer('set-status-close-button-visible', true) ;
                this.conn_!.close() ;
            }
            else {

                if (this.info_.tablet_) {
                    //
                    // The current tablet already has an identity.  See if we are missing things ...
                    //
                    this.getMissingData() ;
                }
                else {
                    this.info_.uuid_ = uuid ;
                    let p: Packet = new Packet(PacketTypeRequestTablets) ;
                    this.conn_!.send(p) ;
                }
            }
        }
        else if (p.type_ === PacketTypeProvideTablets) {
            this.tablets_ = JSON.parse(p.data_.toString()) ;
            this.setView('select-tablet') ;
        }
        else if (p.type_ === PacketTypeProvideTeamForm) {
            this.info_.teamform_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;            
        }
        else if (p.type_ === PacketTypeProvideMatchForm) {
            this.info_.matchform_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;  
        }
        else if (p.type_ === PacketTypeProvideTeamList) {
            this.info_.teamlist_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;  
        }
        else if (p.type_ === PacketTypeProvideMatchList) {
            this.info_.matchlist_ = JSON.parse(p.payloadAsString()) ;
            this.writeEventFile() ;
            ret = this.getMissingData() ;  
        }
        else if (p.type_ === PacketTypeError) {
            this.sendToRenderer('set-status-title', 'Error Syncing With XeroScout Central') ;
            this.sendToRenderer('set-status-visible', true) ;
            this.sendToRenderer('set-status-text', p.payloadAsString()) ;
            this.sendToRenderer('set-status-close-button-visible', true) ;
        }

        if (!ret) {
            this.sendScoutingData() ;
        }
    }

    private sendScoutingData() {
    }

    private getMissingData() : boolean {
        let ret: boolean = false ;

        if (!this.info_.teamform_) {
            this.conn_?.send(new Packet(PacketTypeRequestTeamForm)) ;
            ret = true ;
        }
        else if (!this.info_.matchform_) {
            this.conn_?.send(new Packet(PacketTypeRequestMatchForm)) ;
            ret = true ;
        }
        else if (!this.info_.matchlist_) {
            this.conn_?.send(new Packet(PacketTypeRequestMatchList)) ;
            ret = true ;
        }
        else if (!this.info_.teamlist_) {
            this.conn_?.send(new Packet(PacketTypeRequestTeamList)) ;
            ret = true ;
        }

        return ret ;
    }

    public createMenu() : Menu | null {
        let ret: Menu | null = new Menu() ;

        let filemenu: MenuItem = new MenuItem( {
            type: 'submenu',
            label: 'File',
            role: 'fileMenu'
        }) ;

        let synctcpitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Sync Event (TCP)',
            id: 'sync-event',
            click: () => { this.executeCommand(SCScout.syncEventTCP)}
        }) ;
        filemenu.submenu?.insert(0, synctcpitem) ;

        let syncusbitem: MenuItem = new MenuItem( {
            type: 'normal',
            label: 'Sync Event (USB)',
            id: 'sync-event',
            click: () => { this.executeCommand(SCScout.syncEventUSB)}
        }) ;
        filemenu.submenu?.insert(1, syncusbitem) ;
        filemenu.submenu?.insert(2, new MenuItem({type: 'separator'}));

        ret.append(filemenu) ;
        
        let viewmenu: MenuItem = new MenuItem( {
            type: 'submenu',
            role: 'viewMenu'
        }) ;
        ret.append(viewmenu) ;

        return ret;
    }    

    public sendTabletData() : void {
        if (this.tablets_) {
            this.sendToRenderer('send-tablet-data', this.tablets_) ;
        }
    }

    public setTabletNamePurpose(name: string, purpose: string) : void {
        this.tablets_ = undefined ;
        this.info_.tablet_ = name ;
        this.info_.purpose_ = purpose ;

        let p: Packet ;

        this.writeEventFile() ;
        this.getMissingData() ;
    }

    private checkLastEvent() {
        let lastfile: string = path.join(this.appdir_, SCScout.last_event_file) ;
        if (fs.existsSync(lastfile)) {
            const rawData = fs.readFileSync(lastfile, 'utf-8');
            let obj = JSON.parse(rawData) ;
            if (obj && obj.lastevent) {
                let fname: string = this.uuidToFileName(obj.lastevent) ;
                let fullpath: string = path.join(this.appdir_, fname) ;
                this.readEventFile(fullpath) ;
            }
        }
    }

    private readEventFile(fullpath: string) : Error | undefined {
        let ret : Error | undefined = undefined ;

        const rawData = fs.readFileSync(fullpath, 'utf-8');
        this.info_ = JSON.parse(rawData) as SCScoutInfo ;
        
        return ret ;
    }

    private writeEventFile() : Error | undefined {
        let ret: Error | undefined = undefined ;
        let lastfile: string = path.join(this.appdir_, SCScout.last_event_file) ;

        let obj = {
            lastevent: this.info_.uuid_
        } ;
        const lastFileJson = JSON.stringify(obj) ;
        fs.writeFile(lastfile, lastFileJson, (err) => {
            if (err) {
                fs.rmSync(lastfile) ;   
                ret = err ;
            }
        });

        if (!ret) {

            const jsonString = JSON.stringify(this.info_);

            // Write the string to a file
            let filename = this.uuidToFileName(this.info_.uuid_!) ;
            let projfile = path.join(this.appdir_, filename) ;
            fs.writeFile(projfile, jsonString, (err) => {
                if (err) {
                    fs.rmSync(lastfile) ;
                    fs.rmSync(projfile) ;   
                    ret = err ;
                }
            });
        }
        
        return ret;
    } 

}
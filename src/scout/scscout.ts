import { BrowserWindow, Menu, MenuItem } from "electron";
import { SCBase } from "../base/scbase";
import { SyncClient } from "../sync/syncclient";
import { TCPClient } from "../sync/tcpclient";
import { Packet } from "../sync/Packet";
import { PacketTypeHello } from "../sync/packettypes";

export class SCScout extends SCBase {
    private static viewHelp: string = "view-help" ;
    private static syncEventTCP: string = "sync-event-tcp" ;
    private static syncEventUSB: string = "sync-event-usb" ;

    private tcpHost: string = "127.0.0.1" ;
    private tablet?: string ;

    public constructor(win: BrowserWindow) {
        super(win, 'scout') ;
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
            this.syncClient(new TCPClient(this.logger_, this.tcpHost)) ;
        }
        else if (cmd === SCScout.syncEventUSB) {
        }
    }

    private syncClient(conn: SyncClient) {
        conn.connect()
            .then(()=> {

                conn.on('connected', () => {
                    this.logger_.info('ScouterSync: connected to server \'' + conn.name() + '\'') ;
                    let p: Packet = new Packet(PacketTypeHello, new Uint8Array(0)) ;
                    conn.send(p) ;
                }) ;

                conn.on('close', () => {

                }) ;

                conn.on('error', (err: Error) => {
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

                conn.on('packet', (p: Packet) => {
                    this.syncTablet(conn, p) ;
                }) ;
            })
            .catch((err) => {
            }) ;
    }

    private syncTablet(conn: SyncClient, p: Packet) {

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
}
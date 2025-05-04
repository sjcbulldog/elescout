import { XeroLogger } from "../utils/xerologger";

type XeroCBCallback = (arg: any) => void ;

interface XeroCBRegistered {
    name: string ;
    callback: XeroCBCallback ;
};

declare global {
    interface Window {
      scoutingAPI: {
        send(name: string, arg?: any): void;
        receive(name: string, callback: (arg: any) => void): void;
        receiveOff(name: string, callback: (arg: any) => void): void;
      };
    }
  }

export class XeroMainProcessInterface {
    private static verbose_ : boolean = true ;
    private callbacks_: XeroCBRegistered[] = [] ;

    constructor() {
    }

    unregisterAllCallbacks() {
        for (let i = 0; i < this.callbacks_.length; i++) {
            const cb = this.callbacks_[i] ;
            this.unregisterCallback(cb.name, cb.callback) ;
        }
    }

    request(name: string, arg?: any) {
        if (XeroMainProcessInterface.verbose_) {
            let logger = XeroLogger.getInstance() ;
            logger.debug(`XeroCBTarget.request: , name=${name}, arg=${arg}`) ;
        }

        window.scoutingAPI.send(name, arg);
    }

    registerCallback(name: string, callback: XeroCBCallback) {
        let XeroCBRegistered = { name: name, callback: callback } ;
        this.callbacks_.push(XeroCBRegistered) ;
        window.scoutingAPI.receive(name, callback) ;
    }

    unregisterCallback(name: string, callback: XeroCBCallback) {
        window.scoutingAPI.receiveOff(name, callback) ;
        const index = this.callbacks_.findIndex(cb => cb.name === name && cb.callback === callback);
        if (index !== -1) {
            this.callbacks_.splice(index, 1);
        }
    }
}

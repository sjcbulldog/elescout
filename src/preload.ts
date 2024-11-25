import { contextBridge, ipcRenderer,  } from 'electron';

// Create a type that should contain all the data we need to expose in the
// renderer process using `contextBridge`.

// export type scoutingAPI = {
// }

//
// Expose our functions in the `api` namespace of the renderer `Window`.
//
contextBridge.exposeInMainWorld( 'scoutingAPI', {
  //
  // These go from the render process to the main process
  //
  send: (channel: string, data: any) => {
      let validChannels = [
        'get-zebra-match-list',
        'get-zebra-match-data',
        'get-nav-data', 
        'get-info-data',
        'generate-random-data',
        'set-event-name',
        'get-event-data',
        'get-tablet-data',
        'set-tablet-data',
        'get-team-data',
        'set-team-data',
        'get-match-data',
        'set-match-data',
        'load-ba-event-data',
        'execute-command',
        'get-form',
        'get-match-db',
        'send-match-col-config',
        'send-team-col-config',
        'get-team-db',
        'get-team-status',
        'get-match-status',
        'set-tablet-name-purpose',
        'provide-result',
        'get-team-graph-data',
        'get-team-list',
        'get-team-field-list',
        'get-match-field-list',
        'save-team-graph-setup',
        'get-match-list',
        'get-stored-graph-list',
        'delete-stored-graph',
        'get-picklist-data',
        'get-picklist-columns',
        'get-picklist-col-data',
        'get-preferences',
        'update-preferences',
        'update-picklist-columns'
      ];
      if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, data);
      }
  },

  //
  // These go from the main process to the renderer process
  //
  receive: (channel: string, func:any) => {
      let validChannels = [
        'send-zebra-match-list',
        'send-zebra-match-data',
        'update-main-window-view',
        'event-name',
        'send-nav-data', 
        'send-nav-highlight',
        'send-info-data',
        'send-event-data',
        'send-tablet-data',
        'send-team-data',
        'send-match-data',
        'send-form',
        'send-initial-values',
        'send-team-status',
        'send-match-status',
        'send-match-db',
        'send-team-db',
        'send-team-col-config',
        'send-match-col-config',
        'set-status-text',
        'set-status-html',
        'set-status-title',
        'set-status-visible',
        'set-status-close-button-visible',
        'set-status-bar-message',
        'request-results',
        'send-team-graph-data',
        'send-team-list',
        'send-team-field-list',
        'send-match-field-list',
        'send-match-list',
        'send-stored-graph-list',
        'tablet-title',
        'send-picklist-data',
        'send-picklist-columns',
        'send-picklist-col-data',
        'send-preferences'
      ];
      if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
  }
}) ;

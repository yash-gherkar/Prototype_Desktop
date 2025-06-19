const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
  // Future safe API bridges can go here
});

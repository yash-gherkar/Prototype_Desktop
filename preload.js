const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pandasAPI', {
  runCommand: (command, args) => ipcRenderer.invoke('run-pandas-command', command, args),
  sendFile: (name, content) => ipcRenderer.invoke('save-uploaded-file', name, content)
});

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let uploadedFilePath = null; // To store path

ipcMain.handle('run-pandas-command', async (event, command, args) => {
  return new Promise((resolve) => {
    if (!uploadedFilePath) {
      resolve({ error: 'No file uploaded.' });
      return;
    }

    const py = spawn('python', [path.join(__dirname, 'pandas_server.py')]);

    const payload = {
      filePath: uploadedFilePath,
      command,
      args
    };

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    let data = '';
    py.stdout.on('data', chunk => (data += chunk));
    py.stdout.on('end', () => resolve(JSON.parse(data)));
  });
});

ipcMain.handle('save-uploaded-file', async (event, name, content) => {
  const tempPath = path.join(app.getPath('temp'), name);
  fs.writeFileSync(tempPath, content, 'utf-8');
  uploadedFilePath = tempPath;
  return { saved: true, path: tempPath };
});


function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#121212",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
       webSecurity: false, // allow local file path
       sandbox: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

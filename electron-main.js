const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 440,
        height: 860,
        minWidth: 360,
        minHeight: 640,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        show: true,
        title: 'Agro Vision'
    });
    win.setMenuBarVisibility(false);
    win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

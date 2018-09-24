const {app, BrowserWindow, Tray, process, Menu} = require('electron');
const path = require('path');

let mainWindow, tray;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        frame: false,
        resizable: true,
        backgroundColor: "#263238",
        webPreferences: {
            zoomFactor: 1
        },
        icon: path.join(__dirname, 'assets/logo.png')
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');
    //mainWindow.webContents.openDevTools({
    //    mode:"undocked"
    //});

    /*tray = new Tray('assets/tray.png');
    tray.setToolTip('Click to open Discord in a minimal window.');
    const trayContextMenu = Menu.buildFromTemplate([
        {type: "normal", label: `TaskbarCord v${app.getVersion()}`, enabled: false},
        {type: "separator"},
        {type: "normal", label: "Quit Application", role: "quit"}
    ]);
    tray.setContextMenu(trayContextMenu);*/
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

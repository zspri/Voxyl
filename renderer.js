const {remote} = require('electron');
const {Menu, MenuItem} = remote;
const fs = require('fs');
const path = require('path');
var rpc = require("discord-rpc");
var bot = new rpc.Client({transport:"ipc"});

var activeDir = null;
var codemirror = new CodeMirror($(".editor")[0], {
    lineNumbers: true,
    lineWrapping: true,
    autofocus: true
});

function changeActiveDir() {
    if (activeDir == null) {
        $(".sidebar").html("<div class='file'><i class='fas fa-ban'></i> No files to display</div>");
        return;
    }
    fs.readdir(activeDir, (err, data) => {
        if (err) throw err;
        $(".sidebar").html(`<div class="proj-dir">${activeDir.split(path.sep).slice(-1)[0]}</div><div class="dir-contents"></div>`);
        for (var i = 0; i < data.length; i++) {
            var stats = fs.statSync(data[i]);
            if (stats.isFile()) {
                $(".sidebar .dir-contents").append(`<div class="file"><i class="far fa-file"></i> ${path.basename(data[i])}</div>`);
            } else {
                $(".sidebar .dir-contents").append(`<div class="folder"><i class="far fa-folder"></i> ${path.basename(data[i])}</div>`);
            }
        }
    });
}

function openFile() {
    var filesToOpen = remote.dialog.showOpenDialog({
        title: "Open a file",
        properties: ["openFile"]
    });
    if (filesToOpen.length == 0) {
        return;
    }
    fs.readFile(filesToOpen[0], (err, data) => {
        if (err) throw err;
        codemirror.setValue(data.toString());
        activeDir = path.dirname(filesToOpen[0]);
        changeActiveDir();
    });
}

$(".action.cls").click(function() {
    remote.app.quit();
});

$(".action.max").click(function() {
    var window = remote.getCurrentWindow();
    if (window.isMaximized()) {
        window.unmaximize();
    } else {
        window.maximize();
    }
});

$(".action.min").click(function() {
    remote.getCurrentWindow().minimize();
});

$("#title-ctx-menu").click(function() {
    var ctxMenu = new Menu();
    ctxMenu.append(new MenuItem({
        label: "Open",
        click: openFile
    }));
    ctxMenu.append(new MenuItem({
        label: "Save"
    }));
    ctxMenu.append(new MenuItem({
        label: "Save As"
    }));
    ctxMenu.popup({});
});

bot.on("ready",function(){
    bot.setActivity({
        details: "Editing some code",
        state: "Working on a project",
        largeImageKey: "generic_file",
        largeImageText: "Editing a file",
        smallImageKey: "logo",
        smallImageText: "Voxyl Editor"
    }).catch((reason)=>console.error(reason));
});

bot.login({clientId:"493464313739214858",clientSecret:""}).catch((reason)=>console.error(reason));

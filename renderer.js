const {remote} = require('electron');
const {Menu, MenuItem} = remote;
const fs = require('fs');
const path = require('path');
var rpc = require("discord-rpc");
var bot = new rpc.Client({transport:"ipc"});

var activeDir = null;
var activeFile = null;
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
            var stats = fs.statSync(path.join(activeDir, data[i]));
            if (stats.isFile()) {
                $(".sidebar .dir-contents").append(`<div class="file"><i class="far fa-file"></i> ${path.basename(data[i])}</div>`);
            } else {
                $(".sidebar .dir-contents").append(`<div class="folder"><i class="far fa-folder"></i> ${path.basename(data[i])}</div>`);
            }
        }
    });
}

function openFile() {
    if (activeFile != null) {
        var wantToSave = remote.dialog.showMessageBox({
            title: "Save changes",
            message: "Do you want to save changes to the current file?",
            buttons: ["Save", "Don't save", "Cancel"]
        });
        if (wantToSave == 0) {
            saveFile();
        } else if (wantToSave == 2) {
            return;
        }
    }
    var filesToOpen = remote.dialog.showOpenDialog({
        title: "Open a file",
        properties: ["openFile"]
    });
    if (filesToOpen.length == 0) {
        return;
    }
    fs.readFile(filesToOpen[0], (err, data) => {
        if (err) throw err;
        addTab(path.basename(filesToOpen[0]));
        codemirror.setValue(data.toString());
        activeDir = path.dirname(filesToOpen[0]);
        activeFile = filesToOpen[0];
        updateRPC();
        changeActiveDir();
    });
}

function saveFileAs() {
    var fileToSave = remote.dialog.showSaveDialog({
        title: "Save as",
        buttonLabel: "Save as",
        defaultPath: activeDir
    });
    if (fileToSave.length == 0) {
        return;
    }
    var data = Buffer.from(codemirror.getValue());
    fs.writeFile(fileToSave, data, (err) => {
        if (err) throw err;
    });
}

function saveFile() {
    if (activeFile == null) {
        return saveFileAs();
    }
    var data = Buffer.from(codemirror.getValue());
    fs.writeFile(activeFile, data, (err) => {
        if (err) throw err;
    });
}

function newFile() {
    addTab("Untitled");
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
        label: "New File",
        click: newFile,
        accelerator: "CommandOrControl+N"
    }));
    ctxMenu.append(new MenuItem({
        label: "Open File...",
        click: openFile,
        accelerator: "CommandOrControl+O"
    }));
    ctxMenu.append(new MenuItem({
        label: "Open Folder..."
    }));
    ctxMenu.append(new MenuItem({type: "separator"}));
    ctxMenu.append(new MenuItem({
        label: "Save",
        click: saveFile,
        accelerator: "CommandOrControl+S"
    }));
    ctxMenu.append(new MenuItem({
        label: "Save As",
        click: saveFileAs,
        accelerator: "CommandOrControl+Shift+S"
    }));
    ctxMenu.append(new MenuItem({type: "separator"}));
    ctxMenu.append(new MenuItem({
        label: "Settings",
        accelerator: "CommandOrControl+,"
    }));
    ctxMenu.popup({});
});

function addTab(name) {
    $(".title .tabs .tab").removeClass("active");
    $('.title .tabs').append(`<div class="tab active"><div class="name">${name}</div><div class="close"><i class="fas fa-times"></i></div></div>`);
}

$(document).on("click", ".title .tabs .tab .name", function() {
    $(".title .tabs .tab").removeClass("active");
    $(this).parent().addClass("active");
});

$(document).on("click", ".title .tabs .tab .close", function() {
    var tab = $(this).parent();
    if (tab.hasClass("active")) {
        tab.remove();
        $(".title .tabs").children(":first").addClass("active");
    } else {
        tab.remove();
    }
    if ($(".title .tabs").children().length == 0) {

    }
});

function updateRPC() {
    bot.setActivity({
        details: activeFile ? `Editing ${path.basename(activeFile)}` : "Idle",
        state: activeDir ? `Working on ${activeDir.split(path.sep).slice(-1)[0]}` : "No project",
        largeImageKey: activeFile ? "generic_file" : "idle",
        largeImageText: activeFile ? `Editing ${path.basename(activeFile)}` : "Idle",
        smallImageKey: "logo",
        smallImageText: "Voxyl Editor",
        startTimestamp: new Date()
    }).catch((reason)=>console.error(reason));
}

bot.on("ready",function(){
    updateRPC();
});

module.exports = {addTab}
bot.login({clientId:"493464313739214858",clientSecret:""}).catch((reason)=>console.error(reason));

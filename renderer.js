const {remote} = require('electron');
const {Menu, MenuItem} = remote;
const fs = require('fs');
const path = require('path');
var rpc = require("discord-rpc");
var bot = new rpc.Client({transport:"ipc"});

var activeDir = null;
var activeFile = null;
var editors = {};
var nToAssignTab = 0;

function changeActiveDir() {
    if (activeDir == null) {
        $(".sidebar").html("<div class='file'><i class='fas fa-ban'></i> No files to display</div>");
        return;
    }
    fs.readdir(activeDir, (err, data) => {
        if (err) throw err;
        $(".sidebar").html(`<div class="proj-dir">${activeDir.split(path.sep).slice(-1)[0]}</div><div class="dir-contents"></div>`);
        var files = "", dirs = "";
        for (var i = 0; i < data.length; i++) {
            var stats = fs.statSync(path.join(activeDir, data[i]));
            if (stats.isFile()) {
                files += `<div class="file"><i class="far fa-file"></i> <span>${path.basename(data[i])}</span></div>`
            } else {
                dirs += `<div class="folder"><i class="far fa-folder"></i> <span>${path.basename(data[i])}</span></div>`
            }
        }
        $(".sidebar .dir-contents").append(`<div class="dirs">${dirs}</div><div class="files">${files}</div>`);
    });
}

function openFile() {
    /*if (activeFile != null) {
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
    }*/
    var filesToOpen = remote.dialog.showOpenDialog({
        title: "Open a file",
        properties: ["openFile"]
    });
    if (filesToOpen.length == 0) {
        return;
    }
    fs.readFile(filesToOpen[0], (err, data) => {
        if (err) throw err;
        var editor = addTab(path.basename(filesToOpen[0]));
        editor.editor.setValue(data.toString());
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
    if (fileToSave === undefined) {
        return;
    }
    var editor = editors[$(".tabs .tab.active").attr("id")];
    var data = Buffer.from(editor.editor.getValue());
    fs.writeFile(fileToSave, data, (err) => {
        if (err) throw err;
        activeFile = fileToSave;
    });
}

function saveFile() {
    if (activeFile == null) {
        return saveFileAs();
    }
    var editor = editors[$(".tabs .tab.active").attr("id")];
    console.log(editor);
    console.log($(".tabs .tab.active").attr("id"));
    console.log(activeFile);
    var data = Buffer.from(editor.editor.getValue());
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
    $('.title .tabs').append(`<div class="tab active" id="tab-${nToAssignTab}"><div class="name">${name}</div><div class="close"><i class="fas fa-times"></i></div></div>`);
    $(".editor").removeClass("active");
    $(".editor-container").append(`<div class="editor active" data-for="tab-${nToAssignTab}"></div>`);
    var editorForTab = {
        "object": $(`.editor[data-for='tab-${nToAssignTab}']`),
        "editor": new CodeMirror($(".editor.active")[0], {
            lineNumbers: true,
            lineWrapping: true,
            autofocus: true
        })
    }
    editors[`tab-${nToAssignTab}`] = editorForTab;
    nToAssignTab += 1;
    return editorForTab;
}

$(document).on("click", ".title .tabs .tab .name", function() {
    var tab = $(this).parent();
    $(".title .tabs .tab").removeClass("active");
    tab.addClass("active");
    $(".editor").removeClass("active");
    $(`.editor[data-for='${tab.attr("id")}']`).addClass("active");
    activeFile = $(this).html();
    updateRPC();
});

$(document).on("click", ".title .tabs .tab .close", function() {
    var tab = $(this).parent();
    var oldEditor = editors[tab.attr("id")];
    if (tab.hasClass("active")) {
        tab.remove();
        var newTab = $(".title .tabs").children(":first");
        if (newTab.attr("id") === undefined) {
        } else {
            newTab.addClass("active");
            editors[newTab.attr("id")].object.addClass("active");
        }
    } else {
        tab.remove();
    }
    oldEditor.object.remove();
    delete oldEditor;
    updateRPC();
    if ($(".title .tabs").children().length == 0) {

    }
});

function updateRPC() {
    var rpcObj = {
        details: activeFile ? `Editing ${path.basename(activeFile)}` : "Idle",
        state: activeDir ? `Working on ${activeDir.split(path.sep).slice(-1)[0]}` : "No project",
        largeImageKey: activeFile ? "generic_file" : "idle",
        largeImageText: activeFile ? `Editing ${path.basename(activeFile)}` : "Idle",
        smallImageKey: "logo",
        smallImageText: "Voxyl Editor",
        startTimestamp: new Date()
    };
    console.debug("%cRPC Emit", "font-weight: bold;", rpcObj);
    bot.setActivity(rpcObj).catch((reason)=>console.error(reason));
}

bot.on("ready",function(){
    updateRPC();
});

addTab("Untitled");
module.exports = {addTab, editors, activeFile, activeDir};
bot.login({clientId:"493464313739214858",clientSecret:""}).catch((reason)=>console.error(reason));

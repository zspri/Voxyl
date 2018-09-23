const remote = require('electron').remote;
var rpc = require("discord-rpc");
var bot = new rpc.Client({transport:"ipc"});

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

var codemirror = new CodeMirror($(".editor")[0], {
    lineNumbers: true,
    lineWrapping: true,
    autofocus: true
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

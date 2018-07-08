const electron = require('electron')
const {app,Menu,dialog,ipcMain} = require ('electron')

module.exports = {
    exitCommand: function (cmdWin) {
        console.log(cmdWin)
        app.quit();
    },
    openCommand: function (cmdWin) {
        dialog.showOpenDialog ({
                title:'Select Photos',
                properties:['openFile','multiSelections'],
                filters:[{name:'photos',extensions:['jpg','jpeg']}]
            },
            function (filenames) {
                if (!filenames){
                    return
                }
                if ( filenames.length>0){
                    console.log ( filenames.length)
                    cmdWin.webContents.send('files-selected-channel', filenames)
                }
            })
    },
    openFolderCommand: function (cmdWin) {
        dialog.showOpenDialog ({
                title:'Select Folder with Photos',
                properties:['openDirectory','multiSelections'],
                filters:[]
            },
            function (folders) {
                if (!folders)
                {
                    return
                }
                if ( folders.length>0){
                    console.log ( folders.length)
                    cmdWin.webContents.send('folders-selected-channel', folders)
                }
            })
    },
    renameSelectedCommand: function () {

    },
    renameAllCommand: function (){

    },
    commandMenuFactory: function (win){
        var commandWindow = win
        var thisref = this
        var commandDispatcher = function ( command_function)
        {
            command_function(commandWindow)
        }

        var menu = Menu.buildFromTemplate (
            [{
                label:'File',
                submenu:[
                    {label:'Open...',
                     click:function () { commandDispatcher(thisref.openCommand) }
                    },
                    {label:'Open Folder...',
                     click:function () { commandDispatcher(thisref.openCommand) }
                    },                    
                    {label:'Exit',
                     click:() => commandDispatcher(thisref.exitCommand)
                    }
                ]
            },
            {   label:'View'
            },
            {   label:'Help',
                submenu:[{label:'About'}]
            }            
        ]
        )
        Menu.setApplicationMenu(menu)
    }

}
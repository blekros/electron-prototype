
const fs = require('fs')
const path = require('path') 
const electron = require('electron')
const exif = require('exif')
const {ExifImage} = require('exif')
const maincommands = electron.remote.getGlobal("maincommands")
var ipcreceivedlist = []
var sectionhistory = []

// sort of a klugy template for picking off metadata properties in folder mode
const emptyexifobj = {
    image: {
      Make: '[camera make]',
      Model: '[camera model]',
      Orientation: '[Orientation]',
      XResolution: '[XResolution]',
      YResolution: '[YResolution]',
      ResolutionUnit: '[ResolutionUnit]',
      Software: '[Software]',
      ModifyDate: '[ModifyDate]',
      YCbCrPositioning: '[YCbCrPositioning]',
      Copyright: '[copyright]',
      ExifOffset: '[ExifOffset]'
    },
    thumbnail: {
      Compression: '[Compression]',
      Orientation: '[Orientation]',
      XResolution: '[XResolution]',
      YResolution: '[YResolution]',
      ResolutionUnit: '[ResolutionUnit]',
      ThumbnailOffset: '[ThumbnailOffset]',
      ThumbnailLength: '[ThumbnailLength]',
      YCbCrPositioning: '[YCbCrPositioning]'
    },
    exif: {
      FNumber:'[FNumber]',
      ExposureProgram: '[ExposureProgram]',
      ISO: '[ISO]',
      ExifVersion: '[ExifVersion]',
      DateTimeOriginal: '[DateTimeOriginal]',
      CreateDate: '[CreateDate]',
      ComponentsConfiguration: '[ComponentsConfiguration]',
      CompressedBitsPerPixel: '[CompressedBitsPerPixel]',
      ShutterSpeedValue: '[ShutterSpeedValue]',
      ApertureValue: '[ApertureValue]',
      BrightnessValue: '[BrightnessValue]',
      ExposureCompensation: '[BrightnessValue]',
      MaxApertureValue: '[MaxApertureValue]',
      MeteringMode: '[MeteringMode]',
      Flash: '[Flash]',
      FocalLength: '[FocalLength]',
      MakerNote: '[MakerNote]',
      ColorSpace: '[ColorSpace]',
      ExifImageWidth: '[ExifImageWidth]',
      ExifImageHeight: '[ExifImageHeight]',
      InteropOffset: '[InteropOffset]',
      FocalPlaneXResolution: '[FocalPlaneXResolution]',
      FocalPlaneYResolution: '[FocalPlaneYResolution]',
      FocalPlaneResolutionUnit: '[FocalPlaneResolutionUnit]',
      SensingMethod: '[SensingMethod]',
      FileSource: '[FileSource]',
      SceneType: '[SceneType]'
    },
    gps: {
        GPSVersionID:'[GPSVersionID]',
        GPSLatitude:'[GPSLatitude]',
        GPSLatitudeRef:'[GPSLatitudeRef]',
        GPSLongitude:'[GPSLongitude]',
        GPSLongitudeRef:'[GPSLongitudeRef]',
        GPSAltitude:'[GPSAltitude]',
        GPSAltitudeRef:'[GPSAltitudeRef]',
        GPSSatellites:'[GPSSatellites]',
        GPSStatus:'[GPSStatus]',
        GPSMeasureMode:'[GPSMeasureMode]',
        GPSDOP:'[GPSDOP]',
        GPSSpeedRef:'[GPSSpeedRef]',
        GPSSpeed:'[GPSSpeed]',
        GPSTrackRef:'[GPSTrackRef]',
        GPSTrack:'[GPSTrack]',
        GPSDirectionRef:'[GPSDirectionRef]',
        GPSDirection:'[GPSDirection]',
        GPSMapDatum:'[GPSMapDatum]',
        GPSDateStamp:'[GPSMapDatum]'
    },
    interoperability: {
      InteropIndex: '[InteropIndex]',
      InteropVersion: '[InteropVersion]'
    },
    makernote: {
      Version: '[Version]',
      Quality: '[Quality]',
      Sharpness: '[Sharpness]',
      WhiteBalance: '[WhiteBalance]',
      FujiFlashMode: '[FujiFlashMode]',
      FlashExposureComp: '[FlashExposureComp]',
      Macro: '[Macro]',
      FocusMode: '[FocusMode]',
      SlowSync: '[SlowSync]',
      AutoBracketing: '[AutoBracketing]',
      BlurWarning: '[BlurWarning]',
      FocusWarning: '[FocusWarning]',
      ExposureWarning: '[ExposureWarning]'
    }
  }

function updateBusyList (isbusy){
    var sectionelement = document.querySelector("section.is-shown")
    if (sectionelement){
        var busydiv = isbusy? sectionelement.querySelector(".busylist"):sectionelement.querySelector(".busylist.is-shown")
        if (busydiv){
            if (isbusy) {
                busydiv.classList.add('is-shown')
            }
            else {
                busydiv.classList.remove('is-shown')
            }
        }
    }
}

function clearAllNavSelections () {
    const selectedbuttons = document.querySelectorAll('.nav.is-shown .nav-button.is-selected')
    if (selectedbuttons && selectedbuttons.length>0){
        selectedbuttons.forEach( (button) => {
            button.classList.remove('is-selected')
        })
    }
}

function hideAllSpaSections()
{
    const sections = document.querySelectorAll('.spa-section.is-shown')
    if (sections && sections.length>0){
        sections.forEach( (section) => {
            section.classList.remove('is-shown')
        })
    }
}
function showSpaSection (sectionid) {
    hideAllSpaSections ()
    document.getElementById(sectionid).classList.add('is-shown')
}

function handleSpaNavigation(navelement) {
    // ---"dataset.section" means it's a spa section control. Skip and update the navs if not present
    if (navelement.dataset && navelement.dataset.section ) {
         var sectionid = navelement.dataset.section      // --- got a spa section to activate
        // --- erase all currently shown sections
        hideAllSpaSections()
        // --- Show the current section and record the history
        document.getElementById(sectionid).classList.add('is-shown')
        sectionhistory.push(sectionid)
    }
    // --- Sync the nav selections
    clearAllNavSelections ()
    handleElementSelection(navelement)  // --- clicked element
}

function handleListSelection (selectid){
    const selectedItem = document.getElementById(selectid)
    if (selectedItem)
    {
        const listContainer = selectedItem.parentElement
        if (listContainer) {
            const selected = listContainer.querySelectorAll('.is-selected')
            if (selected && selected.length>0){
                selected.forEach( (selection) => {
                    selection.classList.remove('is-selected')
                })
            }
        }
        // --- Tag the selected element
        selectedItem.classList.add('is-selected')
    }
}

function handleElementSelection (element){
    if (element)
    {
        const listContainer = element.parentElement
        if (listContainer) {
            const selected = listContainer.querySelectorAll('.is-selected')
            if (selected && selected.length>0){
                selected.forEach( (selection) => {
                    selection.classList.remove('is-selected')
                })
            }
        }
        // --- Tag the current element
        element.classList.add('is-selected')
    }
}
window.onload = function (){
    
    //--- main ViewModel object for the app div
    var app = new Vue ({
        el:'#mainapp',
        data: {
            pathtemplate:'@root@DateTimeOriginal@sep@name@ext', //'@dir@sep@name@ext',
            pathmode:'',    // --- folder || file
            pathlist:[],
            selectedindex:-1,
            imagecategory:['structure','drainage','pavement','soil'],
            validation: {
                valid:false
            }
        },
        computed: {
            selectedpath: function(){
                if ( this.selectedindex >-1 && this.selectedindex < this.pathlist.length){
                    return this.pathlist[this.selectedindex].path
                }  
                else{
                    return ''
                }              
            },
            selectedurl: function (){
                var filepath = this.selectedpath
                var url =  path.sep === '\\' ? 'file:///'.concat (filepath.replace(/\\/g,'/')):
                                            'file://'.concat(filepath)
                console.log (url)
                return encodeURI(url)
            },
            selectedmetadata:function (){
                mergedmeta = {}
                if ( this.pathmode==='file' && this.selectedindex >-1 && this.selectedindex < this.pathlist.length){
                    var metadata = this.pathlist[this.selectedindex].metadata

                    // merge the image, exif, gps, and other sections into one giant metadata object
                    for (metaobj in metadata) {
                        if ( metadata[metaobj]) {
                            mergedmeta = Object.assign(mergedmeta, this.pathlist[this.selectedindex].metadata[metaobj])
                        }
                    }
                }
                console.log(mergedmeta)
                return mergedmeta                 
            },
            renderedpath: function ()
            {
                var rendered = this.pathtemplate 
                if ( this.selectedindex >-1 && this.selectedindex < this.pathlist.length){
                    var selectedpath = (this.pathmode == 'folder') ? path.join (this.pathlist[this.selectedindex].path, 'name.ext' ) :
                                                                this.pathlist[this.selectedindex].path
                    
                    //--- replace file tokens @root @dir @base @name @ext to render a derived filename
                    var pathobj = path.parse (selectedpath)
                    for (var property in pathobj) {
                        propertyvalue = pathobj[property]
                        var token = '@' + property
                        rendered = rendered.replace(token, propertyvalue)
                    }
                    // --- check for platform specific directory separator
                    rendered = rendered.replace(/@sep/g, path.sep)

                    //--- replace other @tokens by searching metadata properties if a file is selected
                    if ( this.pathmode==='file' ) {                
                        var metadata = this.selectedmetadata
                        for (var metaprop in metadata) {
                            var token = '@' + metaprop
                            if (rendered.includes (token))
                            {
                                var metaval = metadata[metaprop].toString()
                                if (metaprop.includes('Date')){
                                    metaval = metaval.split(' ')[0]
                                    metaval = metaval.replace(/:/g, '-')
                                }
                                rendered = rendered.replace(new RegExp(token,'g'), metaval) // replace all occurences
                            }
                        }
                    }
                }
                return rendered
            }
        },
        methods: {
            pathclick: function (id, event){
                console.log (id)    // array index 0-to-length-1
                if ( id > -1 && id<app.pathlist.length) {
                    app.selectedindex = id
                    var elementid = app.pathmode + '-' + id
                    handleListSelection ( elementid )
                }
            },
            openClick: function(event) {
                handleSpaNavigation(event.target)
                maincommands.openCommand(electron.remote.getCurrentWindow())    // call back into main process to show the open file dialog
            },
            openFolderClick: function(event) {
                handleSpaNavigation(event.target)
                maincommands.openFolderCommand(electron.remote.getCurrentWindow())      // call back into main process to show the open file dialog   
            },
            navClick: function (event) {
                handleSpaNavigation(event.target)
            },
            backClick: function(event){
                if (sectionhistory.length >0) {
                    var sectionid = sectionhistory.pop()    // --- current section
                    if (sectionhistory.length>0){
                        sectionid= sectionhistory[sectionhistory.length-1]  // top of stack is previous section
                    }
                    else {
                        sectionid="aboutsection"                            // send them somewhere
                    }
                    showSpaSection(sectionid)
                }
            },
            confirmCopyOk : function (event) {
                if (this.renderedpath === this.selectedpath) {
                    alert ("source and destination file are the same!")
                }
                else {
                    alert ("do a real copy here")
                }
            },
            renderPathItem(pathitem) {
                var rendered = this.pathtemplate 

                if (pathitem.id >-1 &&  pathitem.id < this.pathlist.length){  

                    // --- get the component chunks of the input file path and extract template references into the rendered output path
                    var pathobj = path.parse (pathitem.path)                
                    for (var property in pathobj){
                        propertyvalue = pathobj[property]
                        var token = '@' + property
                        rendered = rendered.replace(token, propertyvalue)
                    }
                    // --- check for platform specific directory separator
                    rendered = rendered.replace(/@sep/g, path.sep)

                    //--- replace other @tokens by searching metadata properties if an image is selected
                    
                    if (pathitem.metadata ) {
                        var mergedmeta = {}

                        // TODO: cache the merged stuff in the object so every list change doesn't require all this horsing around 
                        //  Merge the image, exif, gps, and other sections into one giant metadata object
                        for (metaobj in pathitem.metadata) {
                            if ( pathitem.metadata[metaobj]) {
                                mergedmeta = Object.assign(mergedmeta, pathitem.metadata[metaobj])
                            }
                        }
                        for (var metaprop in mergedmeta) {
                            var token = '@' + metaprop
                            if (rendered.includes (token))
                            {
                                var metaval = mergedmeta[metaprop].toString()
                                if (metaprop.includes('Date')){
                                    metaval = metaval.split(' ')[0]
                                    metaval = metaval.replace(/:/g, '-')
                                }
                                rendered = rendered.replace(new RegExp(token,'g'), metaval) // replace all occurences
                            }
                        }
                    }
                }
                return rendered
            },
            showDataSection: function(event){
                handleSpaNavigation(event.target)
            },
            insertValue: function (event) {
                if (event.target){
                    var selectele = event.target.parentElement.querySelector("select")
                    var parentEditor = event.target.closest("div.edit")
                    if (parentEditor && selectele){
                        var txtele = parentEditor.querySelector ( "input[type='text']")
                        var before = txtele.value.substr(0,txtele.selectionStart)
                        var after = txtele.value.substr(txtele.selectionEnd)
                        this.pathtemplate = before.concat(selectele.value,after) 
                    }
                }                  
            }
        }
    })

    electron.ipcRenderer.on ('files-selected-channel', function (event, files){
        if (!files) {
            return
        }
        ipcreceivedlist = files;
        updateBusyList(true)
        // --- clear existing paths if changing modes between folder and file
        if (app.pathmode!=='file'){
            app.pathlist.length=0
            app.selectedindex=-1
        }
        app.pathmode = 'file'
        var baseindex = app.pathlist.length
        files.forEach ( function (file,index){
            console.log (file)
            new ExifImage( {image:file}, function(error,metadata){ 
                var newIndex = baseindex + index
                app.pathlist.splice(newIndex,0,{ 'id':newIndex, 'path':file, 'metadata':metadata} )
                if ( index+1 >= ipcreceivedlist.length) {
                    updateBusyList(false)
                }
            })
        })
    })

    electron.ipcRenderer.on ('folders-selected-channel', function (event, folders){
        if (!folders){
            return
        }
        ipcreceivedlist = folders
        // --- clear existing paths if changing modes between folder and file
        if (app.pathmode!=='folder'){
            app.pathlist.length=0
            app.selectedindex = -1
        }
        app.pathmode='folder'
        var baseindex = app.pathlist.length
        folders.forEach ( function (folder,index){
            console.log (folder)
            var newIndex = baseindex + index
            app.pathlist.splice(newIndex,0,{ 'id':newIndex, 'path':folder} )
        })
    })
}
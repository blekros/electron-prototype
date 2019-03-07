# electron-prototype

Simple example of using electron to create a desktop app using HTML for the GUI components and nodejs for the native tier.

The original intent was to create a simple jpg file manager app to demonstrate the node file system object and exercise the communication between the main application and embedded javascript in the GUI and learn how to build it for a Mac.

It then became an exercise to try to extract EXIF metadata from the images and use it as part of a file renaming and/or moving process.

The eventual goal is to run it through tensorflowjs image classifiers and provide an option to add those to the metadata tags.

## Install

>>git clone the repo or copy the zip file and extract
>>cd extract location - contains package.json
>>npm install
>>npm start
or
>>npm build

npm start will show the GUI and npm build will make a windows binary in ../build

### Currently Non-functional
Currently, it doesn't do any of the proposed operations, just manipulates lists of filenames, so it won't do anything to files on your hard drive yet.   It will in the next update.

const fs = require("fs");
const PhpFileImporter = require("./PhpFileImporter");
const CreatorClassesUml = require("./CreatorClassesUml");


class SavnePhpImporter {

    constructor() {
        this.classesFiles= [];
        this.path_origin= '';
        this.importVendor= '';
    }

    importerFromCode(){
        this.path_origin = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported', null, null,
            {properties: ['openFile', 'openDirectory']}
        )[0];

        var options = [
            { text: "No", value: false },
            { text: "Yes", value: true },
        ]
        let self = this
        app.dialogs.showSelectRadioDialog("Do you want to import Vendor?", options).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                self.importVendor = returnValue
                self.listFiles(self.path_origin);
                let creatorClassesUml= CreatorClassesUml.new(
                    self.classesFiles
                );
                creatorClassesUml.exec();
            }
        })
    }

    importerFromClass(){
        this.path_origin = app.dialogs.showOpenDialog(
            'Select the class to import', null, null,
            {name: "Text Files", extensions: [ "php" ]}
        )[0];

        this.processFile(this.path_origin);
        let creatorClassesUml= CreatorClassesUml.new(
            this.classesFiles
        );
        creatorClassesUml.exec();
    }

    listFiles(path){
        const elements= fs.readdirSync(path);

        elements.forEach(element=> {
            const pathElement = path+'/'+element;
            const attributes = fs.statSync(pathElement);
            if (attributes.isDirectory()) {
                if(this.importVendor==="true")
                    this.listFiles(pathElement)
                else if(pathElement !== this.path_origin+'/vendor'){
                    this.listFiles(pathElement);
                }
            } else if (attributes.isFile() && element.endsWith('.php')) {
                this.processFile(pathElement);
            }
        });
    }

    processFile(pathFile){
        try {
            let filePhp= PhpFileImporter.new(pathFile);
            filePhp.process();
            if(filePhp.isValidPhp()) {
                this.classesFiles.push(filePhp);
            }
        } catch (err) {
            console.log(err);
            alert(`Error while reading the file: ${err}`);
        }
    }


    init() {
        app.commands.register("Savne-PhpImporter:FromCode", this.importerFromCode.bind(this));
        app.commands.register("Savne-PhpImporter:FromClass", this.importerFromClass.bind(this));
    }
}

exports.new = function(...args) {
    return new SavnePhpImporter(...args);
};

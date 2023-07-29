const fs = require("fs");
const PhpFileImporter = require("./PhpFileImporter");
const CreatorClassesUml = require("./CreatorClassesUml");


class SavnePhpImporter {

    constructor() {
        this.classesFiles= [];
        this.path_origin= '';
    }

    importerFromCode(){
        this.path_origin = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported', null, null,
            {properties: ['openFile', 'openDirectory']}
        )[0];
        this.listFiles(this.path_origin);
        console.log(this.classesFiles);
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
                if(pathElement !== this.path_origin+'/vendor') {
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
    }
}

exports.new = function(...args) {
    return new SavnePhpImporter(...args);
};

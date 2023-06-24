const fs = require("fs");
const PhpFileImporter = require("./PhpFileImporter");

class SavnePhpImporter {

    constructor() {
    }

    importerFromCode(){
        let path_origin = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported', null, null,
            {properties: ['openFile', 'openDirectory']}
        )[0];
        this.listFiles(path_origin);
    }

    listFiles(path){
        const elements= fs.readdirSync(path);

        elements.forEach(element=> {
            const pathElement = path+'/'+element;
            const attributes = fs.statSync(pathElement);
            if (attributes.isDirectory()) {
                //leerDirectorioRecursivo(rutaElemento);
            } else if (attributes.isFile() && element.endsWith('.php')) {
                this.processFile(pathElement);
            }
        });
    }

    processFile(pathFile){
        try {
            let filePhp= PhpFileImporter.new(pathFile);
            filePhp.process();
        } catch (err) {
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

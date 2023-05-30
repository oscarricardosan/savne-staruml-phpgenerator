const fs = require("fs");
const DirectoryClasses = require("./DirectoryClasses");
const FileClass = require("./FileClass");


class SavnePhpGenerator {

    constructor() {
        this.classes= [];
        this.containerMain= undefined;

        this.directoryClasses= DirectoryClasses.new();

        Object.defineProperty(String.prototype, 'decapitalizeFirstLetter', {
            value: function() {
                return this.charAt(0).toLowerCase() + this.slice(1);
            },
            enumerable: false
        });

        Object.defineProperty(Array.prototype, 'unique', {
            value: function() {
                return this.filter(function (value, index, array) {
                    return array.indexOf(value) === index;
                })
            },
            enumerable: false
        });
    }

    getPreferencesSetup() {
        return {
            id: "savne.phpGenerator",
            name: "Savne PHP Generator",
            schema: {
                "savne.phpGenerator": {
                    text: "Savne PHP Generator",
                    type: "section"
                },
                "savne.phpGenerator.indentSpaces": {
                    text: "Indent Spaces",
                    description: "Number of spaces for indentation",
                    type: "number",
                    default: 4
                },
                "savne.phpGenerator.typeConstruct": {
                    text: "Dependency injection type",
                    description: "Specifies the type of dependency injection to use in the class",
                    type: "dropdown",
                    default: 'PARAMETERS-CONSTRUCTOR',
                    options: [
                        {value: 'PARAMETERS-CONSTRUCTOR', text: 'Constructor parameters'},
                        {value: 'BODY-CONSTRUCTOR', text: "Constructor body"},
                        {value: 'NO', text: 'Not inject'},
                    ],
                },
                "savne.phpGenerator.useSpecification": {
                    text: "Use specification as method code",
                    description: "",
                    type: "dropdown",
                    default: 0,
                    options: [
                        {value: 1, text: "Yes"},
                        {value: 0, text: 'No'},
                    ],
                },
                "savne.phpGenerator.useDocumentation": {
                    text: "Use documentation as comment code",
                    description: "",
                    type: "dropdown",
                    default: 0,
                    options: [
                        {value: 1, text: "Yes"},
                        {value: 0, text: 'No'},
                    ],
                },
                "savne.phpGenerator.generatePhpDoc": {
                    text: "Generate PHPDoc",
                    description: "",
                    type: "dropdown",
                    default: 0,
                    options: [
                        {value: 1, text: "Yes"},
                        {value: 0, text: 'No'},
                    ],
                },
            }
        };
    }

    generateCodeFromPackage() {
        this.getPackage();
    }

    getPackage() {
        const self= this;
        app.elementPickerDialog.showDialog(
            "Select route to process, once you choose the route, " +
            "the generator will look for all the classes present to generate the php code",
            null,
            type.UMLPackage
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                self.containerMain= returnValue
                self.mapClasses(returnValue);
                self.determineRoutes();
                self.exportFiles();
            }
        });
    }

    mapClasses(pakg) {
        let ownedElements= pakg.ownedElements;
        ownedElements.forEach(element => {
            if(element.constructor.name === type.UMLClass.name || element.constructor.name === type.UMLInterface.name) {
                this.classes.push(element);
            }
            if(element.constructor.name === type.UMLPackage.name) {
                this.mapClasses(element);
            }
        })
    }


    determineRoutes() {
        this.classes.forEach(class_ => {
            this.resolvePath(class_);
        });
    }

    resolvePath(class_) {
        let path= [];
        let parent= class_._parent;
        while (parent._id !== this.containerMain._parent._id){
            let directoryPath= this.directoryClasses.findPathByParent_id(parent._id);
            if(directoryPath === undefined) {
                path.push(parent.name);
                parent = parent._parent;
            }else{
                path.push(directoryPath.path);
                break;
            }
        }
        if(this.directoryClasses.findPathByParent_id(parent._id) === undefined) {
            this.directoryClasses.addDirectoryPath(path, class_._parent);
        }
    }

    exportFiles(){
        let path_destination = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported'
        );
        if(path_destination === undefined)return false;
        path_destination= path_destination[0];

        this.classes.forEach(class_ => {
            this.createFile(path_destination, class_)
        });
        app.toast.info("Code successfully exported in "+path_destination);
    }

    createFile(path_destination, class_){
        let path_class= this.directoryClasses.findPathByParent_id(class_._parent._id);
        path_class= path_destination + '/' + path_class.str_path;
        if (!fs.existsSync(path_class)) {
            fs.mkdirSync(path_class, { recursive: true });
        }

        let fileClass= FileClass.new(class_, this.directoryClasses);
        fs.writeFile(
            path_class+'/'+class_.name+'.php',
            fileClass.getContent(),
            'utf8',
            function(err) {
                if(err) {
                    return alert(err);
                }
            }
        );
    }

    generateCodeFromClass() {
        this.getClass();
    }

    getClass() {
        const self= this;
        app.elementPickerDialog.showDialog(
            "Select the class to process, once you choose the class, generate the php code",
            null,
            type.UMLClass
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                let class_= returnValue
                self.exportClass(class_);
            }
        });
    }

    generateCodeFromInterface() {
        this.getInterface();
    }

    getInterface() {
        const self= this;
        app.elementPickerDialog.showDialog(
            "Select the interface to process, once you choose the interface, generate the php code",
            null,
            type.UMLInterface
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                let interface_= returnValue
                self.exportClass(interface_);
            }
        });
    }

    exportClass(class_){
        let path_destination = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported'
        );
        if(path_destination === undefined)return false;
        path_destination= path_destination[0];
        this.createFile(path_destination, class_)
        app.toast.info("Code successfully exported in "+path_destination);
    }


    configure() {
        app.commands.execute("application:preferences", "savne.phpGenerator");
    }

    init() {
        app.commands.register('Savne-PhpGenerator:CodeFromPackage',  this.generateCodeFromPackage.bind(this));
        app.commands.register('Savne-PhpGenerator:CodeFromClass',  this.generateCodeFromClass.bind(this));
        app.commands.register('Savne-PhpGenerator:CodeFromInterface',  this.generateCodeFromInterface.bind(this));
        app.commands.register("Savne-PhpGenerator:Configure", this.configure.bind(this));
        app.preferences.register(this.getPreferencesSetup());
    }
}

exports.new = function(...args) {
    return new SavnePhpGenerator(...args);
};

const fs = require("fs");
const DirectoryParentClasses = require("./DirectoryParentClasses");
const FileClass = require("./FileClass");


class SavnePhpGenerator {

    constructor() {
        this.classes= [];
        this.containerMain= undefined;

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

    generateCodeFromPackage() {
        this.directoryParentClasses= DirectoryParentClasses.new();
        this.getPackage();
    }

    getPackage() {
        const self= this;
        app.elementPickerDialog.showDialog(
            "Select root package",
            null,
            type.UMLPackage
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                self.containerMain= returnValue
                self.clearMapClasses();
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
            if(element.constructor.name === type.UMLPackage.name || element.constructor.name === type.UMLModel.name) {
                this.mapClasses(element);
            }
        })
    }

    clearMapClasses() {
        this.classes= [];
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
            let directoryPath= this.directoryParentClasses.findPathByParent_id(parent._id);
            if(directoryPath === undefined) {
                if(parent.visibility !== "private") path.push(parent.name);

                parent = parent._parent;
            }else{
                path.push(directoryPath.path);
                break;
            }
        }
        if(this.directoryParentClasses.findPathByParent_id(parent._id) === undefined) {
            this.directoryParentClasses.addDirectoryPath(path, class_._parent);
        }
    }

    exportFiles(){
        let path_destination = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported', null, null,
            {properties: ['openFile', 'openDirectory']}
        );
        if(path_destination === undefined)return false;
        path_destination= path_destination[0];

        this.classes.forEach(class_ => {
            this.createFile(path_destination, class_)
        });
        app.toast.info("Code successfully exported in "+path_destination);
    }

    createFile(path_destination, class_){
        let path_class= this.directoryParentClasses.findPathByParent_id(class_._parent._id);
        path_class= path_destination + '/' + path_class.str_path;
        if (!fs.existsSync(path_class)) {
            fs.mkdirSync(path_class, { recursive: true });
        }

        let fileClass= FileClass.new(class_, this.directoryParentClasses);
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
        this.directoryParentClasses= DirectoryParentClasses.new();
        this.getClass();
    }

    getClass() {
        const self= this;

        app.elementPickerDialog.showDialog(
            "Select root package",
            null,
            type.UMLPackage
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                self.containerMain= returnValue
                self.clearMapClasses();
                self.mapClasses(self.containerMain);
                self.determineRoutes();
                app.elementPickerDialog.showDialog(
                    "Select the class to process, once you choose the class, generate the php code",
                    null,
                    type.UMLClass
                ).then(function ({buttonId, returnValue}) {
                    if (buttonId === 'ok') {
                        let class_= returnValue
                        self.classes= [class_];
                        self.exportClass(class_);
                    }
                });
            }
        });
    }

    generateCodeFromInterface() {
        this.directoryParentClasses= DirectoryParentClasses.new();
        this.getInterface();
    }

    getInterface() {
        const self= this;

        app.elementPickerDialog.showDialog(
            "Select root package",
            null,
            type.UMLPackage
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                self.containerMain= returnValue;
                self.clearMapClasses();
                self.mapClasses(self.containerMain);
                self.determineRoutes();
                app.elementPickerDialog.showDialog(
                    "Select the interface to process, once you choose the interface, generate the php code",
                    null,
                    type.UMLInterface
                ).then(function ({buttonId, returnValue}) {
                    if (buttonId === 'ok') {
                        let interface_= returnValue
                        self.classes= [interface_];
                        self.exportClass(interface_);
                    }
                });
            }
        });

    }

    exportClass(class_){
        let path_destination = app.dialogs.showOpenDialog(
            'Select the folder where your php files will be exported', null, null,
            {properties: ['openFile', 'openDirectory']}
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
    }
}

exports.new = function(...args) {
    return new SavnePhpGenerator(...args);
};

const fs = require("fs");
const DirectoryPackages = require("./DirectoryPackages");
const DirectoryClasses = require("./DirectoryClasses");
class CreatorClassesUml {

    constructor(classesFiles) {
        this.classesFiles = classesFiles;
        this.directoryClasses;
        this.packageDestination;
        this.processedClasses= [];
    }

    exec(){
        let self= this;
        app.elementPickerDialog.showDialog(
            "Select package to create classes",
            null,
            type.UMLPackage
        ).then(function ({buttonId, returnValue}) {
            if (buttonId === 'ok') {
                self.packageDestination= returnValue;
                self.createPackages();
                self.createClasses();

                app.toast.info("Proceso finalizado")
            }
        });
    }

    createPackages(){
        this.directoryPackages= DirectoryPackages.new();
        let packgesRoutes= [];
        this.classesFiles.forEach(classFile=> {
            packgesRoutes.push(classFile.namespace);
        });
        this.directoryPackages.createPackagesFromStringArray(
            this.packageDestination,
            packgesRoutes
        );
    }

    createClasses() {
        this.directoryClasses= DirectoryClasses.new();
        this.directoryClasses.scanClasses(this.packageDestination, '');
        this.classesFiles.forEach(classFile=> {
            this.createClass(classFile);
        });
    }

    createClass(classFile) {

        if(this.processedClasses.includes(classFile.namespace+'\\'+classFile.name)){
            this.processedClasses.push(classFile.namespace + '\\' + classFile.name);
            let classResult= this.directoryClasses.findByPath(classFile.namespace+'\\'+classFile.name);
            return classResult.class_;
        }

        let parent_= this.directoryPackages.findByPath(classFile.namespace);
        let classResult= this.directoryClasses.findByPath(classFile.namespace+'\\'+classFile.name);

        let classUml= undefined;
        if(classResult !== undefined){
            classUml= classResult.class_;
            app.engine.deleteElements(classResult.class_.attributes, []);
            app.engine.deleteElements(classResult.class_.operations, []);
        }else{
            if(classFile.typeClass === 'Interface') classUml= "UMLInterface";
            else classUml= "UMLClass";

            let parent
            if(parent_ !== undefined)
                parent = parent_.element
            else{
                parent = app.repository.select("@Project")[0].ownedElements[0]

                let searchClass = parent.ownedElements.find(element => element.name === classFile.name)
                if(searchClass !== undefined) return searchClass
            }

            classUml= app.factory.createModel({
                id: classUml,
                parent: parent,
                modelInitializer: function (elem) {
                    elem.name = classFile.name;
                    elem.isAbstract = classFile.isAbstract;
                    elem.visibility = classFile.visibility;
                    elem.documentation = classFile.comments;
                }
            });
            this.directoryClasses.addClass(classFile.namespace, classUml);
        }

        // StarUml no permite crear relaciones atráves de la factoria
        // let self= this;
        // classFile.extends.forEach(function(extendClassFilePath){
        //     let fileClass= self.findInClassesFilesByNamespaceAndClass(extendClassFilePath)
        //     let extendClass;
        //     if(fileClass !== undefined) {
        //         extendClass= self.createClass(fileClass);
        //     }
        //
        //     app.factory.createModel({
        //         id: "UMLGeneralization",
        //         parent: classUml,
        //         field: 'ownedElements',
        //         modelInitializer: function (elem) {
        //             elem.source= classUml;
        //             elem.target= extendClass;
        //         }
        //     });
        //
        // });

        classFile.properties.forEach(property=> {
            app.factory.createModel({
                id: "UMLAttribute",
                parent: classUml,
                field: 'attributes',
                modelInitializer: function (elem) {
                    elem.name= property.name;
                    elem.visibility= property.visibility;
                    elem.documentation= property.comments;
                    elem.defaultValue= property.defaultValue;
                    elem.multiplicity= property.multiplicity;
                    elem.isStatic= property.isStatic;
                    elem.type= property.type;
                }
            });
        })

        classFile.methods.forEach(method=> {
            let methodUml= app.factory.createModel({
                id: "UMLOperation",
                parent: classUml,
                field: 'operations',
                modelInitializer: function (elem) {
                    elem.name= method.name;
                    elem.visibility= method.visibility;
                    elem.documentation= method.comments;
                    elem.isStatic= method.isStatic;
                }
            });

            method.parameters.forEach(parameter=>{
                let parameterClass
                if(parameter.namespace)
                    parameterClass= this.findInClassesFilesByNamespaceAndClass(parameter.namespace, parameter.type)
                app.factory.createModel({
                    id: "UMLParameter",
                    field: 'parameters',
                    parent: methodUml,
                    modelInitializer: function (elem) {
                        elem.name = parameter.name;
                        elem.direction = parameter.direction;
                        elem.type = parameterClass ?? parameter.type;
                        elem.multiplicity = parameter.multiplicity;
                    }
                });
            });

            if(method.return !== undefined) {
                let returnClass
                if(method.return.namespace)
                    returnClass= this.findInClassesFilesByNamespaceAndClass(method.return.namespace, method.return.type)
                app.factory.createModel({
                    id: "UMLParameter",
                    parent: methodUml,
                    field: 'parameters',
                    modelInitializer: function (elem) {
                        elem.name = method.return.name;
                        elem.direction = method.return.direction;
                        elem.type = returnClass ?? method.return.type;
                        elem.multiplicity = method.return.multiplicity;
                    }
                });
            }
        });



        return classUml;
    }

    findInClassesFilesByNamespaceAndClass(namespace, className){
        let returnClass = this.directoryClasses.findByPath(namespace+'\\'+className);
        if(returnClass === undefined) {
            let classFile = {
                isValidPhp_ : true,
                pathFile : '',
                name : className,
                namespace : namespace,
                typeClass : 'public',
                implements : [],
                properties : [],
                methods : [],
            }
            returnClass = this.createClass(classFile)
        }else{
            returnClass = returnClass.class_
        }
        return returnClass
    }

}

exports.new = function(...args) {
    return new CreatorClassesUml(...args);
};


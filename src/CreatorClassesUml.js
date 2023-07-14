const fs = require("fs");
class CreatorClassesUml {

    constructor(classesFiles) {
        this.classesFiles = classesFiles;
        this.packageDestination;
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
                self.createClasses();
            }
        });
    }

    createClasses() {
        this.classesFiles.forEach(classFile=> {
            this.createClass(classFile);
        });
    }

    createClass(classFile) {
        console.log(this.packageDestination);
        console.log(classFile);

        let attributes=[];
        classFile.properties.forEach(property=> {
            let attribute= new type.UMLAttribute();
            attribute.name= property.name;
            attribute.visibility= property.visibility;
            attribute.documentation= property.comments;
            attribute.defaultValue= property.defaultValue;
            attribute.multiplicity= property.multiplicity;
            attribute.isStatic= property.isStatic;
            attribute.type= property.type;
            attributes.push(attribute)
        })

        let operations=[];
        classFile.methods.forEach(method=> {
            let operation= new type.UMLOperation();
            operation.name= method.name;
            operation.visibility= method.visibility;
            operation.documentation= method.comments;
            operation.isStatic= method.isStatic;

            let parameters= [];
            method.parameters.forEach(parameter=>{
                let parameterUml= new type.UMLParameter();
                parameterUml.name = parameter.name;
                parameterUml.direction = parameter.direction;
                parameterUml.type = parameter.type;
                parameterUml.multiplicity = parameter.multiplicity;
                parameters.push(parameterUml);
            });

            if(method.return !== undefined) {
                let parameterUml = new type.UMLParameter();
                parameterUml.name = method.return.name;
                parameterUml.direction = method.return.direction;
                parameterUml.type = method.return.type;
                parameterUml.multiplicity = method.return.multiplicity;
                parameters.push(parameterUml);
            }

            operation.parameters= parameters;
            operations.push(operation)
        })

        let options = {
            id: "UMLClass",
            parent: this.packageDestination,
            modelInitializer: function (elem) {
                elem.name = classFile.name;
                elem.isAbstract = classFile.isAbstract;
                elem.visibility = classFile.visibility;
                elem.documentation = classFile.comments;
                elem.attributes= attributes;
                elem.operations= operations;
            }
        }
        let class2 = app.factory.createModel(options);
        console.log(class2);
    }

}

exports.new = function(...args) {
    return new CreatorClassesUml(...args);
};


/***
 * TODO: Ya se crean clases ahora se deben crear los paquetes.
 */
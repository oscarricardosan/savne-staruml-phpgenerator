class DirectoryClasses {

    constructor() {
        this.directoryClasses= [];
    }

    addClass(path, class_){
        if(path.startsWith('\\')) path= path.substring(1);

        if(path === '') path= class_.name;
        else path= path+'\\'+class_.name

        if(this.findByPath(path) === undefined) {
            this.directoryClasses.push({
                path: path,
                class_: class_
            })
        }
    }

    findByPath(path){
        path= this.polishPath(path);
        return this.directoryClasses.find(class_ => {
            return class_.path === path;
        });
    }

    scanClasses(parentElement, path){
        let ownedElements= parentElement.ownedElements;
        ownedElements.forEach(element => {
            if(element.constructor.name === type.UMLClass.name || element.constructor.name === type.UMLInterface.name) {
                this.addClass(path, element);
            }
            if(element.constructor.name === type.UMLPackage.name || element.constructor.name === type.UMLModel.name) {
                this.scanClasses(element, path+'\\'+element.name);
            }
        })
    }

    getDirectory(){
        return this.directoryClasses;
    }

    polishPath(path){
        if(path.endsWith('\\')) return path.substring(0, path.length-1)
        return path;
    }

}

exports.new = function(...args) {
    return new DirectoryClasses(...args);
};

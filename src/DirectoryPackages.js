class DirectoryPackages {

    constructor() {
        this.directoryPackages= [];
        this.parentContainer= undefined;
    }

    createPackagesFromStringArray(parentContainer, packageRoutes){
        this.parentContainer= parentContainer;

        this.scanPackages('', this.parentContainer);


        packageRoutes = Array.from(new Set(packageRoutes)) // Elimina duplicados
            .map(item => item.trim()) // Aplica trim a cada elemento
            .sort((a, b) => a.length - b.length); // Ordena de más corto a más largo


        packageRoutes.forEach(packageRoute=> {

            if(packageRoute === '\\'){
                this.addPackages('\\', parentContainer);
            }else{
                let pathParts= packageRoute.split('\\');
                let pathCurrent= '';
                let parentContainer= this.parentContainer;
                while (pathParts.length>0){
                    if(pathParts.length === 1) pathCurrent+= pathParts[0];
                    else pathCurrent+= pathParts[0]+'\\';
                    let package_= this.findByPath(pathCurrent);

                    if(package_ === undefined) {
                        parentContainer = app.factory.createModel({
                            id: "UMLPackage",
                            parent: parentContainer,
                            modelInitializer: function (elem) {
                                elem.name = pathParts[0];
                            }
                        });
                        this.addPackages(pathCurrent, parentContainer);
                    }else{
                        parentContainer= package_.element;
                    }
                    pathParts.splice(0, 1);
                }
            }
        });
    }

    addPackages(path, packageElement){
        if(this.findByPath(path) === undefined) {
            path = this.polishPath(path);
            this.directoryPackages.push({
                'path': path,
                'element': packageElement
            });
        }
    }

    scanPackages(path, parent){
        let ownedElements= parent.ownedElements;
        ownedElements.forEach(element => {
            if(element.constructor.name === type.UMLPackage.name) {
                this.addPackages(path+'\\'+element.name, element);
                this.scanPackages(path+'\\'+element.name, element);
            }
        });
    }

    findByPath(path){
        path= this.polishPath(path);
        return this.directoryPackages.find(package_ => {
            return package_.path === path;
        });
    }

    polishPath(path){
        path= path.trim();
        if(path.endsWith('\\')) return path.substring(0, path.length-1)
        if(path.startsWith('\\')) return path.substring(1)
        return path;
    }


}

exports.new = function(...args) {
    return new DirectoryPackages(...args);
};

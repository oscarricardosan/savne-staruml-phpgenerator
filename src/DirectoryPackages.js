class DirectoryPackages {

    constructor() {
        this.directoryPackages= [];
        this.parentContainer= undefined;
    }

    createPacagesFromStringArray(parentContainer, packageRoutes){
        this.parentContainer= parentContainer;

        this.scanPackages();

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
                    let package_= this.findPathByPath(pathCurrent);
                    if(package_ !== undefined) continue;

                    parentContainer= app.factory.createModel({
                        id: "UMLPackage",
                        parent: parentContainer,
                        modelInitializer: function (elem) {
                            elem.name = pathParts[0];
                        }
                    });
                    this.addPackages(pathCurrent, parentContainer);
                    pathParts.splice(0, 1);
                }
            }
        });
        console.log(this.directoryPackages);
    }

    addPackages(path, packageElement){
        this.directoryPackages.push({
            'path': path,
            'element': packageElement
        });
    }

    scanPackages(path){
        let ownedElements= this.parentContainer.ownedElements;
        ownedElements.forEach(element => {
            if(element.constructor.name === type.UMLUMLPackage) {
                this.directoryPackages.push({
                    'path': path,
                    'element': element
                });
                this.scanPackages(path+'\\'+element.name, element);
            }
        })
    }

    findPathByPath(path){
        return this.directoryPackages.find(package_ => {
            return package_.path === path;
        });
    }


}

exports.new = function(...args) {
    return new DirectoryPackages(...args);
};

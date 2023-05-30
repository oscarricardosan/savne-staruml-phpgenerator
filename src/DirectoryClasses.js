class DirectoryClasses {

    constructor() {
        this.directoryClasses= [];
    }

    addDirectoryPath(path, parent_){
        this.directoryClasses.push({
            path: path,
            parent_id: parent_._id,
            str_path: path.reverse().join('/')
        })
    }

    findPathByParent_id(parent_id){
        return this.directoryClasses.find(path => {
            return path.parent_id === parent_id;
        });
    }

    getDirectory(parent_id){
        return this.directoryClasses;
    }



}

exports.new = function(...args) {
    return new DirectoryClasses(...args);
};

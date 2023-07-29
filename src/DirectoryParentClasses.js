class DirectoryParentClasses {

    constructor() {
        this.directoryParentClasses= [];
    }

    addDirectoryPath(path, parent_){
        this.directoryParentClasses.push({
            path: path,
            parent_id: parent_._id,
            str_path: path.reverse().join('/'),
            namespace_path: path.join('\\')
        })
    }

    findPathByParent_id(parent_id){
        return this.directoryParentClasses.find(path => {
            return path.parent_id === parent_id;
        });
    }

    getDirectory(parent_id){
        return this.directoryParentClasses;
    }

}

exports.new = function(...args) {
    return new DirectoryParentClasses(...args);
};

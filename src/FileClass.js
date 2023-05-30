class FileClass {

    constructor(class_, directoryClasses) {
        this.class_= class_;
        this.directoryClasses= directoryClasses;
        this.isInterface= this.class_.constructor.name === type.UMLInterface.name;
        this.isNormalClass= this.class_.constructor.name === type.UMLClass.name;
        this.isAbstractClass= this.class_.isAbstract;

        this.uses= [];
        this.construct_parameters= [];
        this.methods= [];
        this.construct_body= [];
        this.properties= [];
        this.interface_implement= '';
        this.extends= '';
        this.construct_string= '';

        this.indentSpaces= app.preferences.get("savne.phpGenerator.indentSpaces");
        this.typeConstruct= app.preferences.get("savne.phpGenerator.typeConstruct");
        this.useDocumentation= app.preferences.get("savne.phpGenerator.useDocumentation") == 1;
        this.useSpecification= app.preferences.get("savne.phpGenerator.useSpecification") == 1;
        this.generatePhpDoc= app.preferences.get("savne.phpGenerator.generatePhpDoc") == 1;

        this.todo= '/** TODO: Your code **/';
    }

    tab(count){
        count= count===undefined?1:count;
        return ' '.repeat(this.indentSpaces*count)
    }

    findOwnedElement(instaceOf){
        return this.class_.ownedElements.find(ownedElement => {
            return ownedElement.constructor.name === instaceOf.name;
        });
    }

    findConstruct(){
        return this.class_.operations.find(operation => {
            return operation.name === '__construct';
        });
    }

    filterOwnedElement(instaceOf){
        return this.class_.ownedElements.filter(ownedElement => {
            return ownedElement.constructor.name === instaceOf.name;
        });
    }

    addUse(class_target){
        let path= this.directoryClasses.findPathByParent_id(class_target._parent._id);
        this.uses.push('use '+path.str_path+'/'+class_target.name);
    }

    getContent() {
        let path= this.directoryClasses.findPathByParent_id(this.class_._parent._id);

        this.resolveImplement();
        this.resolveExtends();
        if(!this.isInterface) this.resolveConstruct();
        this.resolveProperties();
        this.resolveMethods();

        let use_= this.uses.unique().join(';\n');
        let methods= this.methods.join('\n\n\n');
        let properties= this.properties.join('\n\n');

        let type_class= 'class';
        if(this.isAbstractClass) type_class='abstract class';
        if(this.isInterface) type_class='interface';
        return '<?php\n\n' +
            'namespace '+path.str_path+';\n\n\n' +
            (use_ !== ''?use_+'\n\n\n':'') +
            type_class+' '+this.class_.name + this.interface_implement + this.extends + '\n' +
            '{\n\n' +
            (properties !== ''?properties+'\n\n\n':'') +
            this.construct_string+
            methods+
            '\n\n}' ;
    }

    resolveImplement(){
        let interface_relation= this.findOwnedElement(type.UMLInterfaceRealization);
        if(interface_relation !== undefined){
            let interface_= interface_relation.target;
            this.addUse(interface_);
            this.interface_implement= ' implements '+interface_.name;
        }
    }

    resolveExtends(){
        let extend_relation= this.findOwnedElement(type.UMLGeneralization);
        if(extend_relation !== undefined){
            let extend_= extend_relation.target;
            this.addUse(extend_);
            this.extends= ' extends '+extend_.name;
        }
    }

    resolveConstruct(){
        let dependency_relations= this.filterOwnedElement(type.UMLDependency);
        dependency_relations.forEach(dependency_relation=> {
            let dependency= dependency_relation.target;
            this.addUse(dependency);
            if(this.typeConstruct === 'PARAMETERS-CONSTRUCTOR') {
                this.construct_parameters.push(this.tab(2) + 'protected ' + dependency.name + ' $' + dependency.name.decapitalizeFirstLetter());
            }else if(this.typeConstruct === 'BODY-CONSTRUCTOR') {
                this.construct_parameters.push(this.tab(2) + dependency.name + ' $' + dependency.name.decapitalizeFirstLetter());
                this.construct_body.push(this.tab(2) + 'this->' + dependency.name.decapitalizeFirstLetter() + '= $' + dependency.name.decapitalizeFirstLetter());
                this.properties.push(this.tab() + 'protected' + dependency.name + ' $' + dependency.name.decapitalizeFirstLetter()+';');
            }
        });

        let __construct= this.findConstruct();

        this.construct_string= this.formatCommentMethod(__construct);
        if(__construct !== undefined) {
            __construct.parameters.forEach(parameter => {
                if (parameter.direction === 'in') {
                    this.construct_parameters.push(this.tab(2)+this.resolveParameter(parameter));
                }
            });
        }
        if(__construct !== undefined ){
            this.construct_body.push(this.formatCodeMethod(__construct));
        }else{
            if(this.construct_body.length > 0)
                this.construct_body.push('\n\n'+this.tab(2)+this.todo+'\n');
            else
                this.construct_body.push(this.tab(2)+this.todo+'\n');
        }

        let construct_body= this.construct_body.join('\n');
        let construct_parameters= this.construct_parameters.join(',\n');



        this.construct_string+= this.tab()+'public function __construct('+
        (
            construct_parameters !== ''?
                '\n'+construct_parameters+'\n'+this.tab()+')\n':
                ')\n'
        ) +
        this.tab()+'{\n'+
        (construct_body !== ''?construct_body:'') +
        this.tab()+'}\n\n\n' ;

    }

    formatCodeMethod(method){
        if(!this.useSpecification || method.specification.trim() === '')
            return this.tab(2)+this.todo+'\n' ;

        let lines= method.specification.split('\n');
        let code= [];
        lines.forEach(line=> {
            code.push(this.tab(2)+line);
        });

        if (code.length>0) return code.join('\n')+'\n';

    }

    formatCommentMethod(method){
        if(!this.useDocumentation && !this.generatePhpDoc) return '';

        let comment= [];

        let documentation= method===undefined?'':method.documentation;
        if(this.useDocumentation && documentation.trim() !== ''){
            let lines= documentation.split('\n');
            lines.forEach(line=> {
                comment.push(this.tab()+' * '+line);
            });
        }

        if(this.generatePhpDoc && method !== undefined){
            if(comment.length>0)comment.push(this.tab()+' * ');

            method.parameters.forEach(parameter=> {
                if(parameter.direction === 'in'){
                    comment.push(
                        this.tab()+' * @param '+this.resolveParameter(parameter, false)
                    );
                }
            });
            method.parameters.forEach(parameter=> {
                if(parameter.direction === 'return' &&  parameter.type !== ''){
                    comment.push(
                        this.tab()+' * @return '+this.resolveReturn(parameter, false)
                    );
                }
            });
        }

        if(comment.length === 0) return '';

        return this.tab()+'/**\n' +
            comment.join('\n') + '\n'+
            this.tab()+' */\n';
    }

    resolveParameter(parameter, adduse){
        adduse= adduse === undefined?true:adduse;
        let type= parameter.type;
        if(typeof(type) === 'object') {
            if(adduse) this.addUse(parameter.type);
            type= parameter.type.name;
        }
        let default_value= parameter.defaultValue !== ''?'= '+parameter.defaultValue:'';

        if(parameter.multiplicity === '*' || parameter.multiplicity === '1..*' || parameter.multiplicity === '0..*') {
            type= 'array';
            if(parameter.multiplicity === '0..*') {
                default_value = '= []';
            }
        }
        if(default_value === '') {
            if (parameter.multiplicity === '0..1') {
                default_value = '= null';
            }
        }
        if(parameter.multiplicity === '0..1') {
            type= '?'+type;
        }

        return (type!==''?type+' ':'') + '$' + parameter.name+default_value;
    }


    resolveParameterToProperty(parameter, adduse){
        adduse= adduse === undefined?true:adduse;
        let type= parameter.type;
        if(typeof(type) === 'object') {
            if(adduse) this.addUse(parameter.type);
            type= parameter.type.name;
        }

        if(parameter.multiplicity === '*' || parameter.multiplicity === '1..*' || parameter.multiplicity === '0..*') {
            type= 'array';
        }
        return (type!==''?type+' ':'') + '$' + parameter.name;
    }

    resolveReturn(parameter, adduse){
        adduse= adduse === undefined?true:adduse;
        let type= parameter.type;
        if(typeof(type) === 'object') {
            if(adduse) this.addUse(parameter.type);
            type= parameter.type.name;
        }
        return type;
    }

    resolveMethods(){

        let operations= this.class_.operations;

        let interface_relation= this.findOwnedElement(type.UMLInterfaceRealization);
        if(interface_relation !== undefined){
            operations= operations.concat(interface_relation.target.operations);
        }

        operations.forEach(method=> {
            let parameters= [];
            let return_= '';
            if(method.name === '__construct') return;
            method.parameters.forEach(parameter=> {
                if(parameter.direction === 'in'){
                    parameters.push(this.resolveParameter(parameter));
                }
                else if(parameter.direction === 'return' && parameter.type !== ''){
                    return_= ':'+this.resolveReturn(parameter);
                }
            });

            if(this.isInterface) {
                this.methods.push(
                    this.tab()+''+method.visibility+' function '+method.name+'('+
                    (parameters.length>0?'\n'+
                        this.tab(2):'')+''+parameters.join(', ')+
                    (parameters.length>0?'\n'+this.tab():'')+
                    ')'+ return_+';'
                );
                return;
            }

            let body= this.formatCodeMethod(method);


            this.methods.push(
                this.formatCommentMethod(method)+
                this.tab()+''+method.visibility+' function '+method.name+'('+
                (parameters.length>0?'\n'+
                    this.tab(2):'')+''+parameters.join(', ')+
                (parameters.length>0?'\n'+this.tab():'')+
                ')'+ return_+'\n' +
                this.tab()+'{\n' +
                body+
                this.tab()+'}'
            );
        });

    }

    resolveProperties() {
        this.class_.attributes.forEach(property=> {
            let comment= '';

            if(this.useDocumentation && property.documentation.trim() !== ''){
                let lines= property.documentation.split('\n');
                lines.forEach(line=> {
                    comment+= this.tab()+' * ' + line + '\n';
                });
            }

            if(this.generatePhpDoc){
                if(comment !== '')comment+= this.tab()+' * \n';
                comment+=this.tab()+' * @var '+this.resolveParameterToProperty(property, false)+'\n';
            }
            if(comment !== '')
                comment= this.tab()+'/**\n' + comment + this.tab()+'*/\n'

            this.properties.push(
                comment+this.tab() + property.visibility+ ' ' + this.resolveParameter(property)+';'
            );
        });
    }

}

exports.new = function(...args) {
    return new FileClass(...args);
};

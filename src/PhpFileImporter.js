const fs = require("fs");
class PhpFileImporter {

    constructor(pathFile) {
        this.isValidPhp_ = false;
        this.pathFile = pathFile;
        this.name = '';
        this.namespace = undefined;
        this.typeClass = undefined;
        this.implements = undefined;
        this.extends = undefined;
        this.uses = [];
        this.methods = [];
        this.properties = [];

        this.contentFile = fs.readFileSync(this.pathFile, 'utf8');
        this.contentFile= this.contentFile.replaceAll(';', ";\n");
        this.contentFile= this.contentFile.replaceAll('{', "\n{\n");
        this.contentFile= this.contentFile.replaceAll('}', "\n}\n");
        this.lines= this.contentFile.split("\n");
    }

    isValidPhp(){
        return this.isValidPhp_;
    }

    process(){
        this.polishLines();
        this.removePhpTags();
        if(this.isValidPhp() === false)return;
        this.extractNamespace();
        this.extractUses();
        this.determineTypeClass();
        if(this.typeClass === undefined)return;
        this.removeKeysOpenAndClose();
        this.extractClassMethods();
        this.extractProperties();
    }

    polishLines(){
        this.lines= this.lines.map(line=> {
            return line.trim();
        });
        this.lines= this.lines.filter(line=> {
            return line !== '';
        });
    }

    removePhpTags(){
        let indexLine = this.lines.findIndex(content => content === '<?php');
        if (indexLine !== -1) {
            this.lines.splice(indexLine, 1);
            this.isValidPhp_= true;
        }else{
            this.isValidPhp_= false;
            return;
        }

        indexLine = this.lines.findIndex(content => content === '?>');
        if (indexLine !== -1) {
            this.lines.splice(indexLine, 1);
        }
    }

    extractNamespace(){
        let indexLine = this.lines.findIndex(content => content.startsWith('namespace '));
        if (indexLine !== -1) {
            this.namespace= this.lines[indexLine];
            this.namespace= this.namespace.replace('namespace ', '');
            this.namespace= this.namespace.replace(';', '');
            this.namespace= this.namespace.trim();
            this.lines.splice(indexLine, 1);
        }
    }

    extractUses(){
        let uses= this.lines.reduce((uses, line, index) => {
            if (line.startsWith('use ')) {
                uses.push([index, line]);
            }
            return uses;
        }, []);
        uses.reverse().forEach(use=> {
            let use_= use[1].replace('use ', '');
            use_= use_.replace(';', '');
            use_= use_.trim();
            this.uses.push(use_);
            this.lines.splice(use[0], 1);
        })
    }

    determineTypeClass(){
        let indexTypeClass= undefined;
        let indexLine = this.lines.findIndex(content => content.startsWith('class '));
        if (indexLine !== -1) {
            indexTypeClass= indexLine;
            this.typeClass= 'Class';
            this.name= this.lines[indexLine].split(' ')[1];
        }

        indexLine = this.lines.findIndex(content => content.startsWith('abstract class '));
        if (indexLine !== -1) {
            this.typeClass= 'AbstractClass';
            indexTypeClass= indexLine;
            this.name= this.lines[indexLine].split(' ')[2];
        }

        indexLine = this.lines.findIndex(content => content.startsWith('interface '));
        if (indexLine !== -1) {
            this.typeClass= 'Interface';
            indexTypeClass= indexLine;
            this.name= this.lines[indexLine].split(' ')[1];
        }
        if(indexTypeClass === undefined) return false;

        for (let i=3; i--; i>=0){
            let line_id= indexTypeClass+i;
            let line= this.lines[line_id];
            let implementMatch = line.match(/implements (\w+)/);
            if(implementMatch !== null){
                this.implements= implementMatch[1];
            }
            let extendMatch = line.match(/extends (\w+)/);
            if(extendMatch !== null){
                this.extends= extendMatch[1];
            }

            if((implementMatch !== null || extendMatch !== null) && i !== 0){
                this.lines.splice(line_id, 1);
            }
        }
        this.lines.splice(indexTypeClass, 1);

    }

    removeKeysOpenAndClose(){
        let indexLine = this.lines.findIndex(content => content.startsWith('{'));
        if (indexLine !== -1) {
            this.lines.splice(indexLine, 1);
        }

        indexLine = this.lines.reverse().findIndex(content => content.startsWith('}'));
        if (indexLine !== -1) {
            this.lines.splice(indexLine, 1);
        }
        this.lines.reverse();
    }

    extractClassMethods(){
        this.deleteCode();
        this.extractMehods();
    }

    deleteCode(){
        let searchCloseKey= 0;
        let insideFunction= false;
        let openFunction= false;

        let indexLine= 0;
        do{
            let line= this.lines[indexLine];
            if(line.includes(' function ')){
                openFunction= true;
                indexLine++;
                searchCloseKey= 0;
                continue;
            }

            if(openFunction && line === '{'){
                insideFunction= true;
                openFunction= false;
                searchCloseKey++;
                indexLine++;
                continue;
            }

            if(insideFunction) {
                if (line === '{') {
                    searchCloseKey++;
                    this.lines.splice(indexLine, 1);
                    continue;
                }
                else if (line === '}') {
                    searchCloseKey--;

                    if (searchCloseKey === 0) {
                        insideFunction = false;
                    }

                    this.lines.splice(indexLine, 1);
                    continue;
                } else {
                    this.lines.splice(indexLine, 1);
                    continue;
                }
            }
            indexLine++;
        }while(indexLine < this.lines.length)
    }

    extractMehods(){
        let tempLines= this.lines.join(' ');
        tempLines= tempLines.replaceAll(';', ";\n");
        tempLines= tempLines.replaceAll('{', "{\n");
        tempLines= tempLines.replaceAll('/**', "\n/**\n");
        tempLines= tempLines.replaceAll('*/', "\n*/\n");
        tempLines= tempLines.replaceAll('* ', "\n* ");
        this.lines= tempLines.split("\n");
        this.polishLines();

        let newMethod= {
            'name': '',
            'isStatic': false,
            'isAbstract': false,
            'parameters': [],
            'return': undefined,
            'comments': '',
            'visibility': 'public',
        };
        this.lines.reverse();

        let indexLine= 0;
        do{
            let line= this.lines[indexLine];
            if(!line.startsWith('*') && line.includes('function ') && line.endsWith('{')){
                let method= Object.assign({}, newMethod);
                method.parameters= [];
                let return_parts= line.split(':');
                if(return_parts.length > 1) return_parts[1];
                let functionHeadParts= return_parts[0].split('(');
                method.parameters= this.extractParameters(line);
                method.return= this.extractReturnOfSignatory(line);
                let functionSignatory= functionHeadParts[0].split(' ');
                if(functionSignatory[0] === 'function'){
                    method.visibility= 'public';
                    method.name= functionSignatory[1];
                }
                else if(functionSignatory[0] === 'static' && functionSignatory[1] === 'function'){
                    method.visibility= 'public';
                    method.name= functionSignatory[2];
                    method.isStatic= true;
                }
                else if(functionSignatory[0] === 'abstract' && functionSignatory[1] === 'function') {
                    method.isAbstract= true;
                    method.visibility = 'public';
                    method.name = functionSignatory[2];
                }
                else if(
                    (functionSignatory[0] === 'abstract' && functionSignatory[1] === 'static') ||
                    (functionSignatory[0] === 'static' && functionSignatory[1] === 'abstract')
                ){
                        method.isStatic= true;
                        method.isAbstract= true;
                        method.name = functionSignatory[3];
                }else{
                    method.visibility= functionSignatory[0];
                    if(functionSignatory[1] === 'function'){
                        method.name= functionSignatory[2];
                    }
                    else if(
                        functionSignatory[1] === 'static' &&
                        functionSignatory[2] === 'function'
                    ){
                        method.isStatic= true;
                        method.name= functionSignatory[3];
                    }
                    else if(
                        functionSignatory[1] === 'abstract' &&
                        functionSignatory[2] === 'function'
                    ){
                        method.isAbstract= true;
                        method.name= functionSignatory[3];
                    }
                    else if(
                        (functionSignatory[1] === 'abstract' && functionSignatory[2] === 'static') ||
                        (functionSignatory[1] === 'static' && functionSignatory[2] === 'abstract')
                    ){
                        method.isAbstract= true;
                        method.isStatic= true;
                        method.name= functionSignatory[4];
                    }

                }
                this.lines.splice(indexLine, 1);

                line= this.lines[indexLine];
                if(line === '*/'){
                    this.lines.splice(indexLine, 1);
                    let emptySpaces= 0;
                    do {
                        line= this.lines[indexLine];
                        if(line === '/**' || line === '/*') {
                            this.lines.splice(indexLine, 1);
                            break;
                        }
                        if(line.includes('@param ')){
                            let line_parts= line.split('@param ');
                            method.parameters.push(line_parts[1]);
                        }
                        else if(line.includes('@return ')){
                            let line_parts= line.split('@return ');
                            method.return= this.extractReturnOfSignatory(':'+line_parts[1]);
                        }
                        else if(!line.includes('@throws')){
                            if(
                                (line.trim() === '' || line.trim() === '*' || line.trim() === '**') &&
                                method.comments === ''
                            ) {
                                this.lines.splice(indexLine, 1);
                                continue;
                            }

                            if(line.startsWith('*')){
                                let tempLine= line.substring(1).trim();
                                if(tempLine === '' && emptySpaces >2) {
                                    this.lines.splice(indexLine, 1);
                                    continue;
                                }
                                if(tempLine === '') {
                                    emptySpaces++;
                                    method.comments= tempLine+"\n"+method.comments;
                                }else {
                                    emptySpaces= 0;
                                    method.comments= tempLine+"\n"+method.comments;
                                }
                            }else{
                                let tempLine= line.trim();
                                if(tempLine === '' && emptySpaces >2) {
                                    this.lines.splice(indexLine, 1);
                                    continue;
                                }
                                if(tempLine === '') {
                                    emptySpaces++;
                                    method.comments= line+"\n"+method.comments;
                                }else {
                                    emptySpaces= 0;
                                    method.comments= line+"\n"+method.comments;
                                }
                            }
                        }
                        this.lines.splice(indexLine, 1);
                    }while(indexLine < this.lines.length);
                }

                this.methods.push(method);
                continue;
            }

            indexLine++;
        }while(indexLine < this.lines.length);
        this.lines.reverse();
    }

    extractProperties(){
        let newProperty= {
            'name': '',
            'isStatic': false,
            'multiplicity': 1,
            'defaultValue': '',
            'type': '',
            'comments': '',
            'visibility': 'public',
        };
        this.lines.reverse();
        let indexLine= 0;
        do{
            let line= this.lines[indexLine];
            if(line.includes('$') && line.endsWith(';')){
                let property= Object.assign({}, newProperty);
                let property_parts= line.split('=');

                if(property_parts.length>1) {
                    let tempVal= property_parts[1].split(';');
                    property.defaultValue= tempVal[0].trim();
                    if(tempVal[0].substring(1) === '"' || tempVal[0].substring(1) === "'") {
                        property.defaultValue = tempVal[0].substring(1, tempVal.length - 2);
                    }
                }

                property_parts= property_parts[0].split(' ');
                if(
                    !property_parts[0].includes('public') &&
                    !property_parts[0].includes('protected') &&
                    !property_parts[0].includes('private')
                ){
                    break;
                }

                if(property.defaultValue === '[]')property.type= 'array';
                property.visibility= property_parts[0];

                if(property_parts[1].startsWith('$')) {
                    property.name = property_parts[1].replace('$', '');
                }
                else if(property_parts[1] === 'static') {
                    property.isStatic = true;
                    if(property_parts[2].startsWith('$')) {
                        property.name = property_parts[2].replace('$', '');
                    }else{
                        property.type = property_parts[2];
                        property.name = property_parts[3].replace('$', '');
                    }
                }
                else {
                    if(property_parts[1].startsWith('$')) {
                        property.name = property_parts[1].replace('$', '');
                    }else{
                        property.type = property_parts[1];
                        property.type.replace('?', '');
                        property.name = property_parts[2].replace('$', '');
                    }
                }

                if(property.type.includes('?') || property.type.includes('null')) {
                    property.multiplicity = '0..1';
                    if(property.defaultValue === '') {
                        property.defaultValue = 'null';
                    }
                    property.type.replace('?', '');
                }
                if(property.type.includes('array') && property.type.includes('?')) {
                    property.multiplicity = '0..*';
                    property.type.replace('?', '');
                }
                if(property.defaultValue === 'null' && property.type === 'array') {
                    property.multiplicity = '0..*';
                }
                if(property.defaultValue === 'null' && property.type !== 'array') {
                    property.multiplicity = '0..1';
                }

                property.name= property.name.replace(';', '');

                this.lines.splice(indexLine, 1);

                line= this.lines[indexLine];
                if(line === '*/'){
                    this.lines.splice(indexLine, 1);
                    let emptySpaces= 0;
                    do {
                        line= this.lines[indexLine];
                        if(line === '/**' || line === '/*') {
                            this.lines.splice(indexLine, 1);
                            break;
                        }
                        if(line.includes('@var ')){
                            let property_parts= line.split('@var ');
                            property.type = property_parts[1];
                            if(property.type.includes('?') || property.type.includes('null')) property.multiplicity= '0..1';
                            if(property.type.includes('array') && property.type.includes('?')) property.multiplicity= '0..*';
                            property.type.replace('?', '');
                        }
                        else{
                            if(
                                (line.trim() === '' || line.trim() === '*' || line.trim() === '**') &&
                                property.comments === ''
                            ) {
                                this.lines.splice(indexLine, 1);
                                continue;
                            }

                            if(line.startsWith('*')){
                                let tempLine= line.substring(1).trim();
                                if(tempLine === '' && emptySpaces >2) {
                                    this.lines.splice(indexLine, 1);
                                    continue;
                                }
                                if(tempLine === '') {
                                    emptySpaces++;
                                    property.comments= tempLine+"\n"+property.comments;
                                }else {
                                    emptySpaces= 0;
                                    property.comments= tempLine+"\n"+property.comments;
                                }
                            }else{
                                let tempLine= line.trim();
                                if(tempLine === '' && emptySpaces >2) {
                                    this.lines.splice(indexLine, 1);
                                    continue;
                                }
                                if(tempLine === '') {
                                    emptySpaces++;
                                    property.comments= line+"\n"+property.comments;
                                }else {
                                    emptySpaces= 0;
                                    property.comments= line+"\n"+property.comments;
                                }
                            }
                        }
                        this.lines.splice(indexLine, 1);
                    }while(indexLine < this.lines.length);
                }
                this.properties.push(property);
                continue;
            }

            indexLine++;
        }while(indexLine < this.lines.length);
        this.lines.reverse();
    }

    extractParameters(signatory){
        let parameters= [];
        let newParameter= {
            'name': '',
            'direction': 'in',
            'isStatic': false,
            'visibility': 'public',
            'multiplicity': 1,
            'defaultValue': '',
            'type': '',
        };

        let parts= signatory.split(')');
        parts= parts[0].split('(');
        parts= parts[1];
        if(parts === '' || parts === undefined) return [];

        let parametersString= parts.split(',');
        parametersString.forEach(parameterString=> {
            let parameter= Object.assign({}, newParameter);
            parts= parameterString.split('=')
            if(parts.length>1){
                parameter.defaultValue= parts[1];
                if(parameter.defaultValue.startsWith("'") || parameter.defaultValue.startsWith('"')){
                    parameter.defaultValue= parameter.defaultValue.substring(1, parameter.defaultValue.length - 2);
                }
            }
            parameterString= parts[0];
            parts= parameterString.split(' ')
            if(parts[0].startsWith('$')){
                parameter.name= parts[0].replace('$', '');
            }
            else if(parts[0].startsWith('?')){
                parameter.name= parts[1].replace('$', '');
                parameter.type= parts[0].replace('?', '');
                if(parameter.type==='array') parameter.multiplicity= '0..*';
                else parameter.multiplicity= '0..1';
            }
            else{
                parameter.name= parts[1].replace('$', '');
                parameter.type= parts[0];
                parameter.multiplicity= '1';
            }
            parameters.push(parameter);
        });
        return parameters;
    }

    extractReturnOfSignatory(signatory){
        let newReturn= {
            'name': '',
            'direction': 'return',
            'multiplicity': 1,
            'type': '',
        };
        signatory= signatory.replace('{', '');
        let parts= signatory.split(':');
        if(parts.length < 2) return undefined;
        parts= parts[1];

        if(parts.startsWith('?')){
            newReturn.type= parts.replace('?', '');
            if(newReturn.type === 'array')
                newReturn.multiplicity= '0..*';
            else
                newReturn.multiplicity= '0..1';
        }else{
            newReturn.type= parts;
            if(newReturn.type === 'array')
                newReturn.multiplicity= '1..*';
            else
                newReturn.multiplicity= '1';
        }

        return newReturn;

    }

}

exports.new = function(...args) {
    return new PhpFileImporter(...args);
};

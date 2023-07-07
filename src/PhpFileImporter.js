const fs = require("fs");
class PhpFileImporter {

    constructor(pathFile) {
        this.isValidPhp = false;
        this.pathFile = pathFile;
        this.namespace = undefined;
        this.typeClass = undefined;
        this.implements = undefined;
        this.extends = undefined;
        this.uses = [];
        this.methods = [];

        this.contentFile = fs.readFileSync(this.pathFile, 'utf8');
        this.contentFile= this.contentFile.replaceAll(';', ";\n");
        this.contentFile= this.contentFile.replaceAll('{', "\n{\n");
        this.contentFile= this.contentFile.replaceAll('}', "\n}\n");
        // console.log(this.contentFile);
        this.lines= this.contentFile.split("\n");
    }

    isValidPhp(){
        return this.isValidPhp;
    }

    process(){
        this.polishLines();
        this.removePhpTags();
        if(this.isValidPhp === false)return;
        this.extractNamespace();
        this.extractUses();
        this.determineTypeClass();
        if(this.typeClass === undefined)return;
        this.removeKeysOpenAndClose();
        this.extractClassMethods();
        // console.log(this.lines);
        console.log(this);
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
            this.isValidPhp= true;
        }else{
            this.isValidPhp= false;
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
        }

        indexLine = this.lines.findIndex(content => content.startsWith('abstract class '));
        if (indexLine !== -1) {
            this.typeClass= 'AbstractClass';
            indexTypeClass= indexLine;
        }

        indexLine = this.lines.findIndex(content => content.startsWith('interface '));
        if (indexLine !== -1) {
            this.typeClass= 'Interface';
            indexTypeClass= indexLine;
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
        /**
         * @TODO:
         */
        this.polishMethodInfo();
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
            'return': '',
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
                method.parameters= method.parameters.concat(
                    functionHeadParts[1].replaceAll(')', '').replaceAll('{', '').trim().split(',')
                );
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
                            method.return= line_parts[1];
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
                                    method.comments+= tempLine+"\n";
                                }else {
                                    emptySpaces= 0;
                                    method.comments += tempLine+ "\n";
                                }
                            }else{
                                let tempLine= line.trim();
                                if(tempLine === '' && emptySpaces >2) {
                                    this.lines.splice(indexLine, 1);
                                    continue;
                                }
                                if(tempLine === '') {
                                    emptySpaces++;
                                    method.comments+= line+"\n";
                                }else {
                                    emptySpaces= 0;
                                    method.comments+= line+"\n";
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

}

exports.new = function(...args) {
    return new PhpFileImporter(...args);
};

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

}

exports.new = function(...args) {
    return new PhpFileImporter(...args);
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApexDependencyParser = void 0;
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const { apex: Apex } = require('tree-sitter-sfapex');
const fs_1 = require("fs");
const types_1 = require("./types");
class ApexDependencyParser {
    constructor() {
        this.systemTypes = new Set([
            'String', 'Integer', 'Boolean', 'Decimal', 'Double', 'Long', 'Object',
            'Date', 'DateTime', 'Time', 'Blob', 'Id', 'List', 'Set', 'Map',
            'Database', 'System', 'Test', 'Schema', 'UserInfo', 'Limits',
            'ApexPages', 'PageReference', 'SelectOption', 'Savepoint',
            'Exception', 'DmlException', 'QueryException', 'CalloutException'
        ]);
        this.parser = new tree_sitter_1.default();
        this.parser.setLanguage(Apex);
    }
    analyzeFile(filePath) {
        const content = (0, fs_1.readFileSync)(filePath, 'utf8');
        const tree = this.parser.parse(content);
        const rootObject = this.extractRootObjectName(tree.rootNode, filePath);
        const rootType = this.determineRootType(tree.rootNode, filePath);
        const dependencies = this.extractDependencies(tree.rootNode);
        return {
            rootObject,
            rootType,
            dependencies: this.deduplicateDependencies(dependencies)
        };
    }
    extractRootObjectName(node, filePath) {
        var _a;
        const fileName = ((_a = filePath.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace(/\.(cls|trigger)$/, '')) || 'Unknown';
        const classDeclaration = this.findNode(node, 'class_declaration');
        if (classDeclaration) {
            const identifier = this.findNode(classDeclaration, 'identifier');
            return (identifier === null || identifier === void 0 ? void 0 : identifier.text) || fileName;
        }
        const triggerDeclaration = this.findNode(node, 'trigger_declaration');
        if (triggerDeclaration) {
            const identifier = this.findNode(triggerDeclaration, 'identifier');
            return (identifier === null || identifier === void 0 ? void 0 : identifier.text) || fileName;
        }
        return fileName;
    }
    determineRootType(node, filePath) {
        if (filePath.endsWith('.trigger')) {
            return types_1.DependencyType.ApexTrigger;
        }
        const classDeclaration = this.findNode(node, 'class_declaration');
        if (classDeclaration) {
            const interfaceKeyword = this.findNodeWithText(classDeclaration, 'interface');
            if (interfaceKeyword) {
                return types_1.DependencyType.ApexInterface;
            }
            const enumKeyword = this.findNodeWithText(classDeclaration, 'enum');
            if (enumKeyword) {
                return types_1.DependencyType.ApexEnum;
            }
            return types_1.DependencyType.ApexClass;
        }
        return types_1.DependencyType.ApexClass;
    }
    extractDependencies(node) {
        const dependencies = [];
        this.traverseNode(node, (currentNode) => {
            switch (currentNode.type) {
                case 'type_identifier':
                case 'identifier':
                    const typeName = currentNode.text;
                    if (this.isValidDependency(typeName)) {
                        dependencies.push({
                            name: typeName,
                            type: this.classifyDependency(typeName)
                        });
                    }
                    break;
                case 'field_access':
                    const fieldDeps = this.extractFieldAccess(currentNode);
                    dependencies.push(...fieldDeps);
                    break;
                case 'method_invocation':
                    const methodDeps = this.extractMethodInvocation(currentNode);
                    dependencies.push(...methodDeps);
                    break;
            }
        });
        return dependencies;
    }
    extractFieldAccess(node) {
        const dependencies = [];
        const objectNode = node.childForFieldName('object');
        if (objectNode) {
            const objectName = objectNode.text;
            if (this.isCustomObject(objectName)) {
                dependencies.push({
                    name: objectName,
                    type: types_1.DependencyType.CustomObject
                });
            }
        }
        const fieldNode = node.childForFieldName('field');
        if (fieldNode && objectNode) {
            const fieldName = fieldNode.text;
            const objectName = objectNode.text;
            if (this.isCustomField(fieldName)) {
                dependencies.push({
                    name: `${objectName}.${fieldName}`,
                    type: types_1.DependencyType.CustomField
                });
            }
        }
        return dependencies;
    }
    extractMethodInvocation(node) {
        const dependencies = [];
        const objectNode = node.childForFieldName('object');
        if (objectNode) {
            const objectName = objectNode.text;
            if (this.isValidDependency(objectName)) {
                dependencies.push({
                    name: objectName,
                    type: this.classifyDependency(objectName)
                });
            }
        }
        return dependencies;
    }
    isValidDependency(name) {
        return name.length > 1 &&
            /^[A-Za-z][A-Za-z0-9_]*$/.test(name) &&
            !this.isKeyword(name);
    }
    isKeyword(name) {
        const keywords = new Set([
            'public', 'private', 'protected', 'static', 'final', 'abstract',
            'virtual', 'override', 'class', 'interface', 'enum', 'extends',
            'implements', 'if', 'else', 'for', 'while', 'do', 'switch',
            'case', 'default', 'break', 'continue', 'return', 'try', 'catch',
            'finally', 'throw', 'new', 'this', 'super', 'null', 'true', 'false'
        ]);
        return keywords.has(name.toLowerCase());
    }
    classifyDependency(name) {
        if (this.systemTypes.has(name)) {
            return types_1.DependencyType.SystemType;
        }
        if (this.isCustomObject(name)) {
            return types_1.DependencyType.CustomObject;
        }
        return types_1.DependencyType.ApexClass;
    }
    isCustomObject(name) {
        return name.endsWith('__c') || name.endsWith('__r');
    }
    isCustomField(name) {
        return name.endsWith('__c');
    }
    findNode(node, type) {
        if (node.type === type) {
            return node;
        }
        for (let i = 0; i < node.childCount; i++) {
            const found = this.findNode(node.child(i), type);
            if (found)
                return found;
        }
        return null;
    }
    findNodeWithText(node, text) {
        if (node.text === text) {
            return node;
        }
        for (let i = 0; i < node.childCount; i++) {
            const found = this.findNodeWithText(node.child(i), text);
            if (found)
                return found;
        }
        return null;
    }
    traverseNode(node, callback) {
        callback(node);
        for (let i = 0; i < node.childCount; i++) {
            this.traverseNode(node.child(i), callback);
        }
    }
    deduplicateDependencies(dependencies) {
        const seen = new Set();
        return dependencies.filter(dep => {
            const key = `${dep.name}:${dep.type}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}
exports.ApexDependencyParser = ApexDependencyParser;

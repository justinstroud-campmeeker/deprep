import Parser from 'tree-sitter';
const { apex: Apex } = require('tree-sitter-sfapex');
import { readFileSync } from 'fs';
import { Dependency, DependencyType, AnalysisResult } from './types';

export class ApexDependencyParser {
  private parser: Parser;
  private systemTypes = new Set([
    'String', 'Integer', 'Boolean', 'Decimal', 'Double', 'Long', 'Object',
    'Date', 'DateTime', 'Time', 'Blob', 'Id', 'List', 'Set', 'Map',
    'Database', 'System', 'Test', 'Schema', 'UserInfo', 'Limits',
    'ApexPages', 'PageReference', 'SelectOption', 'Savepoint',
    'Exception', 'DmlException', 'QueryException', 'CalloutException'
  ]);

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Apex);
  }

  analyzeFile(filePath: string): AnalysisResult {
    const content = readFileSync(filePath, 'utf8');
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

  private extractRootObjectName(node: Parser.SyntaxNode, filePath: string): string {
    const fileName = filePath.split('/').pop()?.replace(/\.(cls|trigger)$/, '') || 'Unknown';
    
    const classDeclaration = this.findNode(node, 'class_declaration');
    if (classDeclaration) {
      const identifier = this.findNode(classDeclaration, 'identifier');
      return identifier?.text || fileName;
    }
    
    const triggerDeclaration = this.findNode(node, 'trigger_declaration');
    if (triggerDeclaration) {
      const identifier = this.findNode(triggerDeclaration, 'identifier');
      return identifier?.text || fileName;
    }
    
    return fileName;
  }

  private determineRootType(node: Parser.SyntaxNode, filePath: string): DependencyType {
    if (filePath.endsWith('.trigger')) {
      return DependencyType.ApexTrigger;
    }
    
    const classDeclaration = this.findNode(node, 'class_declaration');
    if (classDeclaration) {
      const interfaceKeyword = this.findNodeWithText(classDeclaration, 'interface');
      if (interfaceKeyword) {
        return DependencyType.ApexInterface;
      }
      
      const enumKeyword = this.findNodeWithText(classDeclaration, 'enum');
      if (enumKeyword) {
        return DependencyType.ApexEnum;
      }
      
      return DependencyType.ApexClass;
    }
    
    return DependencyType.ApexClass;
  }

  private extractDependencies(node: Parser.SyntaxNode): Dependency[] {
    const dependencies: Dependency[] = [];
    
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

  private extractFieldAccess(node: Parser.SyntaxNode): Dependency[] {
    const dependencies: Dependency[] = [];
    
    const objectNode = node.childForFieldName('object');
    if (objectNode) {
      const objectName = objectNode.text;
      if (this.isCustomObject(objectName)) {
        dependencies.push({
          name: objectName,
          type: DependencyType.CustomObject
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
          type: DependencyType.CustomField
        });
      }
    }
    
    return dependencies;
  }

  private extractMethodInvocation(node: Parser.SyntaxNode): Dependency[] {
    const dependencies: Dependency[] = [];
    
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

  private isValidDependency(name: string): boolean {
    return name.length > 1 && 
           /^[A-Za-z][A-Za-z0-9_]*$/.test(name) &&
           !this.isKeyword(name);
  }

  private isKeyword(name: string): boolean {
    const keywords = new Set([
      'public', 'private', 'protected', 'static', 'final', 'abstract',
      'virtual', 'override', 'class', 'interface', 'enum', 'extends',
      'implements', 'if', 'else', 'for', 'while', 'do', 'switch',
      'case', 'default', 'break', 'continue', 'return', 'try', 'catch',
      'finally', 'throw', 'new', 'this', 'super', 'null', 'true', 'false'
    ]);
    return keywords.has(name.toLowerCase());
  }

  private classifyDependency(name: string): DependencyType {
    if (this.systemTypes.has(name)) {
      return DependencyType.SystemType;
    }
    
    if (this.isCustomObject(name)) {
      return DependencyType.CustomObject;
    }
    
    return DependencyType.ApexClass;
  }

  private isCustomObject(name: string): boolean {
    return name.endsWith('__c') || name.endsWith('__r');
  }

  private isCustomField(name: string): boolean {
    return name.endsWith('__c');
  }

  private findNode(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode | null {
    if (node.type === type) {
      return node;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const found = this.findNode(node.child(i)!, type);
      if (found) return found;
    }
    
    return null;
  }

  private findNodeWithText(node: Parser.SyntaxNode, text: string): Parser.SyntaxNode | null {
    if (node.text === text) {
      return node;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const found = this.findNodeWithText(node.child(i)!, text);
      if (found) return found;
    }
    
    return null;
  }

  private traverseNode(node: Parser.SyntaxNode, callback: (node: Parser.SyntaxNode) => void): void {
    callback(node);
    
    for (let i = 0; i < node.childCount; i++) {
      this.traverseNode(node.child(i)!, callback);
    }
  }

  private deduplicateDependencies(dependencies: Dependency[]): Dependency[] {
    const seen = new Set<string>();
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
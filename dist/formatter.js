"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyFormatter = void 0;
class DependencyFormatter {
    constructor(options = {}) {
        this.options = Object.assign({ separator: ';', includeRoot: true }, options);
    }
    format(result) {
        const parts = [];
        if (this.options.includeRoot) {
            parts.push(this.formatItem(result.rootObject, result.rootType.toString()));
        }
        result.dependencies.forEach(dep => {
            parts.push(this.formatItem(dep.name, dep.type.toString()));
        });
        return parts.join(this.options.separator);
    }
    formatMultiple(results) {
        return results.map(result => this.format(result)).join('\n');
    }
    formatItem(name, type) {
        return `${name}:${type}`;
    }
}
exports.DependencyFormatter = DependencyFormatter;

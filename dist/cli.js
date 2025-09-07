"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyCli = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const parser_1 = require("./parser");
const formatter_1 = require("./formatter");
class DependencyCli {
    constructor(options = {}) {
        this.parser = new parser_1.ApexDependencyParser();
        this.formatter = new formatter_1.DependencyFormatter({
            separator: options.separator || ';'
        });
    }
    run(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield this.findApexFiles(options.path, options.recursive);
                if (files.length === 0) {
                    throw new Error(`No Apex files found in path: ${options.path}`);
                }
                const results = [];
                for (const file of files) {
                    try {
                        const result = this.parser.analyzeFile(file);
                        results.push(result);
                    }
                    catch (error) {
                        console.error(`Error analyzing file ${file}:`, error);
                    }
                }
                return this.formatter.formatMultiple(results);
            }
            catch (error) {
                throw new Error(`CLI error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    findApexFiles(path_2) {
        return __awaiter(this, arguments, void 0, function* (path, recursive = false) {
            const files = [];
            try {
                const stats = yield (0, promises_1.stat)(path);
                if (stats.isFile()) {
                    if (this.isApexFile(path)) {
                        files.push(path);
                    }
                    return files;
                }
                if (stats.isDirectory()) {
                    const entries = yield (0, promises_1.readdir)(path);
                    for (const entry of entries) {
                        const fullPath = (0, path_1.join)(path, entry);
                        const entryStats = yield (0, promises_1.stat)(fullPath);
                        if (entryStats.isFile() && this.isApexFile(fullPath)) {
                            files.push(fullPath);
                        }
                        else if (entryStats.isDirectory() && recursive) {
                            const subFiles = yield this.findApexFiles(fullPath, recursive);
                            files.push(...subFiles);
                        }
                    }
                }
            }
            catch (error) {
                throw new Error(`Error accessing path ${path}: ${error instanceof Error ? error.message : String(error)}`);
            }
            return files.sort();
        });
    }
    isApexFile(filePath) {
        const ext = (0, path_1.extname)(filePath).toLowerCase();
        return ext === '.cls' || ext === '.trigger';
    }
}
exports.DependencyCli = DependencyCli;

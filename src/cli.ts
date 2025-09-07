import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { ApexDependencyParser } from './parser';
import { DependencyFormatter } from './formatter';

export interface CliOptions {
  path: string;
  separator?: string;
  recursive?: boolean;
}

export class DependencyCli {
  private parser: ApexDependencyParser;
  private formatter: DependencyFormatter;

  constructor(options: { separator?: string } = {}) {
    this.parser = new ApexDependencyParser();
    this.formatter = new DependencyFormatter({
      separator: options.separator || ';'
    });
  }

  async run(options: CliOptions): Promise<string> {
    try {
      const files = await this.findApexFiles(options.path, options.recursive);
      
      if (files.length === 0) {
        throw new Error(`No Apex files found in path: ${options.path}`);
      }

      const results = [];
      for (const file of files) {
        try {
          const result = this.parser.analyzeFile(file);
          results.push(result);
        } catch (error) {
          console.error(`Error analyzing file ${file}:`, error);
        }
      }

      return this.formatter.formatMultiple(results);
    } catch (error) {
      throw new Error(`CLI error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async findApexFiles(path: string, recursive = false): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const stats = await stat(path);
      
      if (stats.isFile()) {
        if (this.isApexFile(path)) {
          files.push(path);
        }
        return files;
      }
      
      if (stats.isDirectory()) {
        const entries = await readdir(path);
        
        for (const entry of entries) {
          const fullPath = join(path, entry);
          const entryStats = await stat(fullPath);
          
          if (entryStats.isFile() && this.isApexFile(fullPath)) {
            files.push(fullPath);
          } else if (entryStats.isDirectory() && recursive) {
            const subFiles = await this.findApexFiles(fullPath, recursive);
            files.push(...subFiles);
          }
        }
      }
    } catch (error) {
      throw new Error(`Error accessing path ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return files.sort();
  }

  private isApexFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.cls' || ext === '.trigger';
  }
}
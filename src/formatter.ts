import { AnalysisResult, Dependency } from './types';

export interface FormatterOptions {
  separator?: string;
  includeRoot?: boolean;
}

export class DependencyFormatter {
  private options: Required<FormatterOptions>;

  constructor(options: FormatterOptions = {}) {
    this.options = {
      separator: ';',
      includeRoot: true,
      ...options
    };
  }

  format(result: AnalysisResult): string {
    const parts: string[] = [];
    
    if (this.options.includeRoot) {
      parts.push(this.formatItem(result.rootObject, result.rootType.toString()));
    }
    
    result.dependencies.forEach(dep => {
      parts.push(this.formatItem(dep.name, dep.type.toString()));
    });
    
    return parts.join(this.options.separator);
  }

  formatMultiple(results: AnalysisResult[]): string {
    return results.map(result => this.format(result)).join('\n');
  }

  private formatItem(name: string, type: string): string {
    return `${name}:${type}`;
  }
}
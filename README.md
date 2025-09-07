# Deprep - Salesforce Apex Dependency Analyzer

A command-line tool that analyzes Salesforce Apex classes and triggers to extract and report their dependencies.

## What It Does

Deprep scans your Apex code and identifies all the dependencies - from custom objects and system types to other Apex classes. It's particularly useful for:

- **Impact analysis** - Understanding what might be affected by changes
- **Code auditing** - Getting a quick overview of what your Apex code depends on
- **Documentation** - Generating dependency reports for technical documentation
- **Migration planning** - Understanding interconnections before moving code

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```

## Usage

### Basic Examples

```bash
# Analyze a single Apex class
node dist/index.js path/to/MyClass.cls

# Analyze all Apex files in a directory
node dist/index.js path/to/classes/

# Recursively scan subdirectories
node dist/index.js path/to/src/ --recursive

# Use a different separator (pipe instead of semicolon)
node dist/index.js path/to/classes/ --separator "|"
```

### Command Line Options

- `--separator, -s` - Change the output separator (default: `;`)
- `--recursive, -r` - Scan subdirectories recursively
- `--help, -h` - Show help information

## Output Format

The tool outputs dependencies in this format:
```
RootObject:Type;Dependency1:Type;Dependency2:Type;...
```

**Example output:**
```
MyApexClass:ApexClass;String:SystemType;Account:ApexClass;Database:SystemType;CustomObject__c:CustomObject
```

This tells you that `MyApexClass` depends on:
- `String` (system type)
- `Account` (Apex class) 
- `Database` (system type)
- `CustomObject__c` (custom object)

## Dependency Types

The tool recognizes these dependency types:

### Core Types
- **ApexClass** - Standard Apex classes
- **ApexTrigger** - Apex triggers
- **ApexInterface** - Apex interfaces
- **ApexEnum** - Apex enums

### Salesforce Objects
- **CustomObject** - Custom objects (ending with `__c` or `__r`)
- **CustomField** - Custom fields (ending with `__c`)
- **SystemType** - Built-in Salesforce types (String, Database, System, etc.)

### Other Types
- **Trigger, TriggerField, CustomLabel, CustomValidationRule, CustomApplication, CustomPage, ApexPage, ApexComponent** - Various Salesforce metadata types

## How It Works

Deprep uses [tree-sitter](https://tree-sitter.github.io/tree-sitter/) with the [tree-sitter-sfapex](https://github.com/aheber/tree-sitter-sfapex) grammar to parse Apex code. This provides accurate, syntax-aware parsing that can:

- Identify class and interface declarations
- Extract method calls and field references
- Detect custom objects and fields by naming patterns
- Classify system types vs. custom types
- Handle both `.cls` (classes) and `.trigger` (triggers) files

## Development

### Project Structure
```
src/
├── index.ts      # Main CLI entry point
├── cli.ts        # Command-line interface logic
├── parser.ts     # Tree-sitter parsing and dependency extraction
├── formatter.ts  # Output formatting
└── types.ts      # Type definitions
```

### Scripts
```bash
npm run build     # Compile TypeScript
npm test         # Build and run on test data
npm start        # Run the application
```

### Dependencies
- **tree-sitter** - Core parsing library
- **tree-sitter-sfapex** - Salesforce Apex/SOQL/SOSL grammar
- **TypeScript** - Development language

## Contributing

This tool was built to meet specific dependency analysis needs but could be extended to:
- Support additional Salesforce metadata types
- Output in different formats (JSON, CSV, etc.)
- Integrate with Salesforce DX projects
- Provide more detailed dependency information

Feel free to submit issues or pull requests!

## License

MIT License - see LICENSE file for details.
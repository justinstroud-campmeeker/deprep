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
const cli_1 = require("./cli");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
            console.log(`
Salesforce Apex Dependency Reporter

Usage:
  deprep <path> [options]

Arguments:
  path              Path to Apex classes and triggers (file or directory)

Options:
  --separator, -s   Separator character for output (default: ;)
  --recursive, -r   Recursively scan subdirectories
  --help, -h        Show this help message

Examples:
  deprep ./classes/MyClass.cls
  deprep ./src --recursive
  deprep ./triggers --separator "|"

Output format:
  RootObject:Type;Dependency1:Type;Dependency2:Type
`);
            process.exit(0);
        }
        const path = args[0];
        let separator = ';';
        let recursive = false;
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--separator' || arg === '-s') {
                separator = args[++i] || ';';
            }
            else if (arg === '--recursive' || arg === '-r') {
                recursive = true;
            }
        }
        try {
            const cli = new cli_1.DependencyCli({ separator });
            const output = yield cli.run({ path, separator, recursive });
            console.log(output);
        }
        catch (error) {
            console.error('Error:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    });
}
main().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});

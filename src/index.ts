import { DependencyCli } from './cli';

async function main() {
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
    } else if (arg === '--recursive' || arg === '-r') {
      recursive = true;
    }
  }

  try {
    const cli = new DependencyCli({ separator });
    const output = await cli.run({ path, separator, recursive });
    console.log(output);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

const fs = require('fs');
const path = require('path');

const sourceDirectory = path.resolve(__dirname, '..', 'dist');
const targetDirectory = path.resolve(__dirname, '..', 'beta');

function exitWithError(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourceDirectory)) {
  exitWithError(`Source directory not found: ${sourceDirectory}`);
}

if (!fs.statSync(sourceDirectory).isDirectory()) {
  exitWithError(`Source path is not a directory: ${sourceDirectory}`);
}

if (fs.existsSync(targetDirectory)) {
  fs.rmSync(targetDirectory, { recursive: true, force: true });
}

fs.cpSync(sourceDirectory, targetDirectory, { recursive: true });

const countFiles = (directory) => {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce((count, entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return count + countFiles(entryPath);
    }
    return count + 1;
  }, 0);
};

console.log(`Built beta redesign by copying dist -> beta`);
console.log(`Source files: ${countFiles(sourceDirectory)}`);
console.log(`Target files: ${countFiles(targetDirectory)}`);

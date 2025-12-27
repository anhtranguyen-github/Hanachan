
const fs = require('fs');
const path = require('path');

const errorDir = path.join(__dirname, '../e2e-error');
const outputFile = path.join(__dirname, '../e2e_error_report.txt');

console.log(`Scanning ${errorDir}...`);

if (!fs.existsSync(errorDir)) {
    console.log('No e2e-error directory found.');
    process.exit(0);
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file === 'error.log') {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

const errorLogs = getAllFiles(errorDir);

let reportContent = '# E2E Error Report\n\nGenerated: ' + new Date().toISOString() + '\n\n';

if (errorLogs.length === 0) {
    reportContent += 'No errors found (or logs were empty).\n';
}

errorLogs.forEach(logPath => {
    // Get relative path for grouping
    const relative = path.relative(errorDir, logPath);
    const parts = relative.split(path.sep);
    // Expecting timestamp/title/error.log
    const groupName = parts.slice(0, parts.length - 1).join(' / ');

    const content = fs.readFileSync(logPath, 'utf8');
    const dirPath = path.dirname(logPath);
    const relativeDir = path.relative(path.join(__dirname, '..'), dirPath).replace(/\\/g, '/');

    reportContent += `## Use Case: ${groupName}\n`;
    reportContent += '```\n';
    reportContent += content + '\n';
    reportContent += '```\n\n';
    reportContent += `[Screenshot](./${relativeDir}/screenshot.png) | [DOM](./${relativeDir}/dom.html)\n`;
    reportContent += '---\n\n';
});

fs.writeFileSync(outputFile, reportContent);
console.log(`Report generated at ${outputFile} with ${errorLogs.length} entries.`);

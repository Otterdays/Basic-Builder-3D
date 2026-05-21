const fs = require('fs');

const mainJs = fs.readFileSync('main.js', 'utf8');
const mainJsHead = fs.readFileSync('main.js.head', 'utf8');

// Let's find all function/method declarations in both files.
// Methods inside class BuilderApp usually look like:
//   methodName(args) {
// or
//   async methodName(args) {

function extractMethods(content) {
  const lines = content.split('\n');
  const methods = [];
  lines.forEach((line, idx) => {
    // Check if line starts with optional async, spaces, followed by identifier, arguments, and opening brace
    const match = line.match(/^\s*(async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/);
    if (match) {
      methods.push({ name: match[2], lineNum: idx + 1, line: line.trim() });
    }
  });
  return methods;
}

const methodsMain = extractMethods(mainJs);
const methodsHead = extractMethods(mainJsHead);

console.log(`Methods in main.js: ${methodsMain.length}`);
console.log(`Methods in main.js.head: ${methodsHead.length}`);

console.log('\n--- Methods in main.js.head but NOT in main.js ---');
const mainNames = new Set(methodsMain.map(m => m.name));
methodsHead.forEach(m => {
  if (!mainNames.has(m.name)) {
    console.log(`- ${m.name} (line ${m.lineNum} in head)`);
  }
});

console.log('\n--- Methods in main.js but NOT in main.js.head ---');
const headNames = new Set(methodsHead.map(m => m.name));
methodsMain.forEach(m => {
  if (!headNames.has(m.name)) {
    console.log(`- ${m.name} (line ${m.lineNum} in main.js)`);
  }
});

const fs = require('fs');

const mainJs = fs.readFileSync('main.js', 'utf8').split('\n');
const mainJsHead = fs.readFileSync('main.js.head', 'utf8').split('\n');

console.log(`main.js lines: ${mainJs.length}`);
console.log(`main.js.head lines: ${mainJsHead.length}`);

console.log('\n--- main.js TOP 15 ---');
console.log(mainJs.slice(0, 15).join('\n'));

console.log('\n--- main.js BOTTOM 15 ---');
console.log(mainJs.slice(-15).join('\n'));

console.log('\n--- main.js.head TOP 15 ---');
console.log(mainJsHead.slice(0, 15).join('\n'));

console.log('\n--- main.js.head BOTTOM 15 ---');
console.log(mainJsHead.slice(-15).join('\n'));

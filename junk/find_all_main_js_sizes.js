const fs = require('fs');
const readline = require('readline');

const logFilePath = 'C:\\Users\\motor\\.gemini\\antigravity\\brain\\c6bc8afb-6cfd-45b3-953f-ba159be7968b\\.system_generated\\logs\\transcript.jsonl';

async function scanSizes() {
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let stepCount = 0;
  for await (const line of rl) {
    stepCount++;
    try {
      const obj = JSON.parse(line);
      const str = JSON.stringify(obj);
      if (str.includes('main.js')) {
        let sizeMatch = str.match(/"name":"main\.js","sizeBytes":"?(\d+)"?/);
        if (sizeMatch) {
          console.log(`Step ${stepCount} (Index ${obj.step_index}): main.js size in file listing: ${sizeMatch[1]} bytes`);
        }
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            const args = tc.arguments || tc.Arguments;
            if (args && JSON.stringify(args).includes('main.js')) {
              console.log(`Step ${stepCount} (Index ${obj.step_index}): Tool call ${tc.name} targeting main.js`);
            }
          }
        }
        if (obj.type === 'CODE_ACTION' || obj.type === 'WRITE_TO_FILE' || obj.type === 'REPLACE_FILE_CONTENT' || obj.type === 'MULTI_REPLACE_FILE_CONTENT') {
          console.log(`Step ${stepCount} (Index ${obj.step_index}): ${obj.type} content length: ${obj.content ? obj.content.length : 0}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

scanSizes();

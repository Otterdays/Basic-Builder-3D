const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logFilePath = 'C:\\Users\\motor\\.gemini\\antigravity\\brain\\c6bc8afb-6cfd-45b3-953f-ba159be7968b\\.system_generated\\logs\\transcript.jsonl';

async function searchLogs() {
  console.log(`Checking if file exists: ${logFilePath}`);
  if (!fs.existsSync(logFilePath)) {
    console.log("File does not exist!");
    return;
  }
  console.log("File exists! Reading lines...");

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
        console.log(`Step ${stepCount} contains "main.js"`);
      }
    } catch (e) {
      // ignore
    }
  }
  console.log(`Total steps checked: ${stepCount}`);
}

searchLogs();

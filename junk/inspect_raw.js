const fs = require('fs');
const readline = require('readline');

const logFilePath = 'C:\\Users\\motor\\.gemini\\antigravity\\brain\\c6bc8afb-6cfd-45b3-953f-ba159be7968b\\.system_generated\\logs\\transcript.jsonl';
const targetSteps = [208, 211];

async function inspectSteps() {
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let stepCount = 0;
  for await (const line of rl) {
    stepCount++;
    if (targetSteps.includes(stepCount)) {
      console.log(`\n======================================`);
      console.log(`STEP ${stepCount}`);
      console.log(`======================================`);
      try {
        const obj = JSON.parse(line);
        console.log(JSON.stringify(obj, null, 2).substring(0, 1000));
      } catch (e) {
        console.log(`Error parsing: ${e.message}`);
      }
    }
  }
}

inspectSteps();

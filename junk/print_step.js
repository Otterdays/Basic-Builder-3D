const fs = require('fs');
const readline = require('readline');

const logFilePath = 'C:\\Users\\motor\\.gemini\\antigravity\\brain\\c6bc8afb-6cfd-45b3-953f-ba159be7968b\\.system_generated\\logs\\transcript.jsonl';
const targetSteps = [404, 406, 408, 409, 410, 415, 417, 421];

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
        console.log(`Type: ${obj.type}, Source: ${obj.source}, Status: ${obj.status}`);
        if (obj.tool_calls) {
          console.log("Tool Calls:");
          for (const tc of obj.tool_calls) {
            console.log(`- Tool: ${tc.name}`);
            const args = tc.arguments || tc.Arguments;
            if (args) {
              console.log(`  TargetFile: ${args.TargetFile || args.targetFile}`);
              console.log(`  Instruction: ${args.Instruction || args.instruction}`);
              console.log(`  Description: ${args.Description || args.description}`);
              if (args.ReplacementChunks) {
                console.log(`  Chunks count: ${args.ReplacementChunks.length}`);
                args.ReplacementChunks.forEach((c, idx) => {
                  console.log(`    Chunk ${idx + 1}: StartLine=${c.StartLine}, EndLine=${c.EndLine}`);
                  console.log(`      TargetContent length: ${c.TargetContent ? c.TargetContent.length : 0}`);
                  console.log(`      ReplacementContent length: ${c.ReplacementContent ? c.ReplacementContent.length : 0}`);
                });
              }
            }
          }
        }
        if (obj.content) {
          console.log(`Content snippet: ${obj.content.substring(0, 500)}...`);
        }
      } catch (e) {
        console.log(`Error parsing: ${e.message}`);
      }
    }
  }
}

inspectSteps();

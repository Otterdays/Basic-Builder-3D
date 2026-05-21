const fs = require('fs');
const readline = require('readline');

const logFilePath = 'C:\\Users\\motor\\.gemini\\antigravity\\brain\\c6bc8afb-6cfd-45b3-953f-ba159be7968b\\.system_generated\\logs\\transcript.jsonl';

async function scanAllEdits() {
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
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          const name = tc.name;
          const args = tc.arguments || tc.Arguments;
          if (args && JSON.stringify(args).includes('main.js')) {
            console.log(`Step ${stepCount}: ${name} targeting main.js`);
            if (name === 'multi_replace_file_content') {
              console.log(`  Description: ${args.Description || args.description}`);
              const chunks = args.ReplacementChunks || args.replacementChunks;
              console.log(`  Chunks: ${chunks.length}`);
              chunks.forEach((c, idx) => {
                console.log(`    Chunk ${idx + 1}: Lines ${c.StartLine}-${c.EndLine}, TargetLength=${c.TargetContent ? c.TargetContent.length : 0}, ReplLength=${c.ReplacementContent ? c.ReplacementContent.length : 0}`);
              });
            }
            if (name === 'replace_file_content') {
              console.log(`  Description: ${args.Description || args.description}`);
              console.log(`  Lines: ${args.StartLine}-${args.EndLine}, TargetLength=${args.TargetContent ? args.TargetContent.length : 0}, ReplLength=${args.ReplacementContent ? args.ReplacementContent.length : 0}`);
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

scanAllEdits();

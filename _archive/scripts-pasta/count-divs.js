const src = require('fs').readFileSync('pages/consulta-animal/[id].js', 'utf8');
// Find main return statement
const returnIdx = src.indexOf('\n  return (\n    <>\n');
const end = src.indexOf('\nfunction InfoRow');
const chunk = src.substring(returnIdx, end);

let depth = 0;
let opens = [];
// Match all <div (open or close), handling self-close
const divRe = /<\/?div(?:\s[^>]*)?\s*\/?>/gs;
let m;
let lineNum = src.substring(0, returnIdx).split('\n').length;
const chunkLines = chunk.split('\n');
let lineInChunk = 0;
for(let i = 0; i < chunkLines.length; i++) {
  const line = chunkLines[i];
  const realLine = lineNum + i;
  const opens2 = (line.match(/<div(?:\s[^>]*)?>(?!\s*<\/div)/g) || []).filter(t => !t.startsWith('</') && !t.endsWith('/>'));
  const closes = (line.match(/<\/div>/g) || []);
  const selfClose = (line.match(/<div[^>]*\/>/g) || []);
  for(const t of opens2) { depth++; opens.push({line: realLine, depth}); }
  for(const t of closes) { depth--; if(depth < 0) { console.log('EXTRA CLOSE at line', realLine, 'depth now', depth); } }
}
console.log('Final depth:', depth);
if(depth > 0) { console.log('Unclosed (last 10):', JSON.stringify(opens.filter(o => o.depth <= depth + 3).slice(-10))); }
if(depth < 0) { console.log('Too many closes by', -depth); }

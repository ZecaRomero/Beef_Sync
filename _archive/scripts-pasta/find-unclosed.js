const src = require('fs').readFileSync('pages/consulta-animal/[id].js', 'utf8');
const lines = src.split('\n');

// Find the main return statement start line (0-indexed)
let mainReturnLine = -1;
for (let i = 655; i < 680; i++) {
  if (lines[i] && lines[i].trim() === 'return (') { mainReturnLine = i; break; }
}
console.log('Main return at line:', mainReturnLine + 1);

// Manual JSX stack tracker that handles multi-line tags
let stack = [];
let i = mainReturnLine;
// State machine
let inOpenTag = false, inCloseTag = false, tagBuf = '', tagStartLine = -1;
let depth = 0;

while (i < 2535) {
  const line = lines[i];
  for (let c = 0; c < line.length; c++) {
    const ch = line[c];
    const next = line[c+1];
    if (!inOpenTag && !inCloseTag) {
      if (ch === '<' && next === '/') { inCloseTag = true; tagBuf = ''; c++; tagStartLine = i; }
      else if (ch === '<' && next && next !== '!' && next !== '?') { inOpenTag = true; tagBuf = ''; tagStartLine = i; }
    } else if (inOpenTag) {
      if (ch === '>') {
        const tag = tagBuf.split(/\s/)[0];
        const selfClose = tagBuf.endsWith('/');
        if (!selfClose && tag && !['br','hr','input','meta','link','img','area','base','col','embed','param','source','track','wbr'].includes(tag.toLowerCase())) {
          stack.push({tag, line: tagStartLine + 1});
          depth++;
        }
        inOpenTag = false; tagBuf = '';
      } else if (ch === '/' && next === '>') {
        inOpenTag = false; tagBuf = ''; c++;
      } else {
        tagBuf += ch;
      }
    } else if (inCloseTag) {
      if (ch === '>') {
        const tag = tagBuf.trim();
        if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
          stack.pop(); depth--;
        }
        inCloseTag = false; tagBuf = '';
      } else { tagBuf += ch; }
    }
  }
  i++;
}

console.log('Unclosed tags:', stack.length);
stack.forEach(s => console.log(' -', s.tag, 'opened at line', s.line, ':', lines[s.line - 1].trim().substring(0, 80)));

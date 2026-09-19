const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

console.log('Total HTML size:', html.length, 'bytes');

// 1. Views
const viewRegex = /id="(view-[^"]+)"/g;
let match;
const views = [];
while ((match = viewRegex.exec(html)) !== null) {
  views.push(match[1]);
}
console.log('\n--- Views ---');
console.log(views);

// 2. Modals
const modalRegex = /id="(modal-[^"]+)"/g;
const modals = [];
while ((match = modalRegex.exec(html)) !== null) {
  modals.push(match[1]);
}
console.log('\n--- Modals ---');
console.log(modals);

// 3. Tables & Table IDs
const tableRegex = /<table[^>]*id="([^"]+)"[\s\S]*?<\/table>/g;
console.log('\n--- Tables ---');
while ((match = tableRegex.exec(html)) !== null) {
  const tableId = match[1];
  const ths = (match[0].match(/<th[\s\S]*?<\/th>/g) || [])
    .map(th => th.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  console.log(`Table ID: ${tableId}`);
  console.log('  Columns:', ths.join(' | '));
}

// 4. Extract Javascript functions in the <script> tags
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
const scriptBlocks = [];
while ((match = scriptRegex.exec(html)) !== null) {
  scriptBlocks.push(match[1]);
}
console.log('\n--- Script blocks found ---', scriptBlocks.length);

const fullScript = scriptBlocks.join('\n');
const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
const funcs = [];
while ((match = funcRegex.exec(fullScript)) !== null) {
  funcs.push(`${match[1]}(${match[2]})`);
}
console.log('\n--- JS Functions (' + funcs.length + ') ---');
console.log(funcs.join('\n'));

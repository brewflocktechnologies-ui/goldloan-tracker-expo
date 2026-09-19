const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

// Find all elements with class modal or role="dialog" or id containing modal or form
const formRegex = /<form[^>]*id="([^"]+)"[\s\S]*?<\/form>/g;
let m;
while ((m = formRegex.exec(html)) !== null) {
  console.log(`\nForm ID: ${m[1]}`);
  const inputs = (m[0].match(/id="([a-zA-Z0-9_-]+)"/g) || []).map(x => x.replace(/id="|"/g, ''));
  console.log('Inputs:', inputs.join(', '));
}

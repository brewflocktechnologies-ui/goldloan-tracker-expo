const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

function inspectView(id) {
  const start = html.indexOf(`id="${id}"`);
  if (start === -1) return;
  const nextSection = html.indexOf('class="view-section', start + 10);
  const end = nextSection !== -1 ? nextSection : start + 3000;
  console.log(`\n=================== VIEW: ${id} ===================`);
  console.log(html.substring(start, start + 1500));
}

inspectView('view-dashboard');
inspectView('view-users');
inspectView('view-bank-accounts');
inspectView('view-ornaments');
inspectView('view-loans');
inspectView('view-closure');

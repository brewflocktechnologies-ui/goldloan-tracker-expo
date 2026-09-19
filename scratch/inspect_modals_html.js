const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

function printModal(modalId) {
  const start = html.indexOf(`id="${modalId}"`);
  if (start === -1) return;
  const nextModal = html.indexOf('role="dialog"', start + 10);
  const end = nextModal !== -1 ? nextModal : start + 3000;
  console.log(`\n=================== MODAL: ${modalId} ===================`);
  console.log(html.substring(start, end));
}

printModal('userModal');
printModal('bankAccountModal');
printModal('ornamentModal');
printModal('loanModal');

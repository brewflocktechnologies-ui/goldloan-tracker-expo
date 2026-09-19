const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

function printFunc(name) {
  const start = html.indexOf(`function ${name}`);
  if (start === -1) return;
  const nextFunc = html.indexOf('\n    function ', start + 10);
  const end = nextFunc !== -1 ? nextFunc : start + 2500;
  console.log(`\n=================== ${name} ===================`);
  console.log(html.substring(start, end));
}

printFunc('calcOrnamentWeightsAndPrices');
printFunc('calculateAvailableLoan');
printFunc('calculateLoanCharges');
printFunc('calculateLoanPeriodInterest');
printFunc('confirmCloseAndRelease');

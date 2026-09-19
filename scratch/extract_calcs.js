const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

const funcsToExtract = [
  'calcOrnamentWeightsAndPrices',
  'calculateAvailableLoan',
  'calculateLoanCharges',
  'calculateLoanPeriodInterest',
  'syncLoanOrnamentWeights',
  'getLiveRateForPurity',
  'onOrnamentPurityChange',
  'getOrnamentGoldWeight',
  'getOrnamentBuyingRate'
];

funcsToExtract.forEach(fn => {
  const regex = new RegExp(`function\\s+${fn}\\s*\\([\\s\\S]*?\\n}`, 'm');
  const m = html.match(regex);
  if (m) {
    console.log(`\n=== FUNCTION: ${fn} ===`);
    console.log(m[0].slice(0, 800));
  }
});

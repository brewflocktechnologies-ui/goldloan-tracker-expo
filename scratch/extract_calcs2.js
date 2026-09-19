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
  'getOrnamentBuyingRate',
  'updateGoldValuationDashboardCards'
];

funcsToExtract.forEach(fn => {
  const idx = html.indexOf(`function ${fn}`);
  if (idx !== -1) {
    console.log(`\n=== FUNCTION: ${fn} ===`);
    console.log(html.substring(idx, idx + 1200));
  }
});

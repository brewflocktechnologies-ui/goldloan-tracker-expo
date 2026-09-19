const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

const regex = /id="([a-zA-Z0-9_-]*modal[a-zA-Z0-9_-]*)"/gi;
let m;
const modals = new Set();
while ((m = regex.exec(html)) !== null) {
  modals.add(m[1]);
}
console.log('Modals found:', Array.from(modals));

// Find all inputs in the file
const inputRegex = /<input[^>]*id="([^"]+)"[^>]*>/g;
const inputs = [];
while ((m = inputRegex.exec(html)) !== null) {
  inputs.push(m[1]);
}
console.log('Input IDs count:', inputs.length);
console.log('Inputs sample:', inputs.slice(0, 40));

// Find select IDs
const selectRegex = /<select[^>]*id="([^"]+)"[^>]*>/g;
const selects = [];
while ((m = selectRegex.exec(html)) !== null) {
  selects.push(m[1]);
}
console.log('Select IDs:', selects);

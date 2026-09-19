const fs = require('fs');
const html = fs.readFileSync('C:/KISHAN/SOURCECODE/goldloan-appscript/index.html', 'utf8');

const start = html.indexOf('id="view-dashboard"');
const end = html.indexOf('id="view-users"');
console.log(html.substring(start, end));

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/bg-slate-50 border border-indigo-200/g, 'bg-[#f4f5f9] border border-indigo-200');

// Header background
html = html.replace(/bg-indigo-100 dark:bg-indigo-600\/20/g, 'bg-[#dedefe] dark:bg-indigo-600/20');
html = html.replace(/bg-\[#dedefe\] dark:bg-indigo-600\/20/g, 'bg-[#d8dbff] dark:bg-indigo-600/20'); 

// Chat bubble text
html = html.replace(/text-sm text-white dark:text-slate-200/g, 'text-[13.5px] text-white dark:text-slate-200');

fs.writeFileSync('index.html', html);
console.log('Refined chat UI.');

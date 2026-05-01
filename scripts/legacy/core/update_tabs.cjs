const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The inactive buttons have hover:text-slate-900 dark:hover:text-white
// We can add hover:bg-slate-100 dark:hover:bg-white/5 to them
html = html.replace(/hover:text-slate-900 dark:hover:text-white/g, 'hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white');

fs.writeFileSync('index.html', html);
console.log('Tabs hover updated.');

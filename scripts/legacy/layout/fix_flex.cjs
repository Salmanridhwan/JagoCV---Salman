const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The fixed positioning is breaking the layout. 
html = html.replace(/lg:fixed lg:left-0 lg:top-0 lg:bottom-0/g, 'lg:sticky lg:top-0 h-screen');
html = html.replace(/lg:ml-\[50\%\]/g, '');

fs.writeFileSync('index.html', html);
console.log('Flex layout fixed');

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

html = html.replace('Arsitek Desain AI', 'Otomatis Buat via AI');
html = html.replace('Arsitek Portofolio AI', 'Otomatis Buat via AI');

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Renamed AI tabs');

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const strToFind1 = `<!-- Right Col: Template Select & Generate -->`;
const strToFind2 = `<!-- VIEW: CV RESULT (Mock generated CV) -->`;

let idx1 = html.indexOf(strToFind1);
let idx2 = html.indexOf(strToFind2);

if (idx1 !== -1 && idx2 !== -1) {
    // Before idx1, there's `</div>\n\n          ` we want to keep
    const sliceToRemove = html.substring(idx1, idx2);
    html = html.replace(sliceToRemove, '');
    fs.writeFileSync('index.html', html, 'utf-8');
    console.log("Successfully removed duplicate layout and button for Portfolio.");
} else {
    console.log("Markers not found");
}

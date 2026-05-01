const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');

let startStep5 = -1;
let endStep5 = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<div id="resume-step-5"')) {
    startStep5 = i;
  }
  // resume-step-5 ends before id="view-build-portfolio"
  if (startStep5 !== -1 && lines[i].includes('id="view-build-portfolio"')) {
    endStep5 = i - 3;
    break;
  }
}

if (startStep5 !== -1 && endStep5 !== -1) {
  // remove the lines
  lines.splice(startStep5 - 1, endStep5 - startStep5 + 2);
  fs.writeFileSync('index.html', lines.join('\n'));
  console.log('Removed resume-step-5 successfully');
} else {
  console.log('Could not find boundaries');
}

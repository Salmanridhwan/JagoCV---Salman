const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The CV document starts at "max-w-4xl mx-auto bg-white rounded-md shadow-2xl p-8 sm:p-12 text-slate-900 font-sans leading-relaxed text-sm relative" id="cv-document-container"
const startIndex = html.indexOf('id="cv-document-container"');
const endIndex = html.indexOf('</main>');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index");
    process.exit(1);
}

let before = html.substring(0, startIndex);
let cvDoc = html.substring(startIndex, endIndex);
let after = html.substring(endIndex);

// Save the popover so we don't mess up its colors
const aiPopoverStart = cvDoc.indexOf('id="ai-edit-popover"');
const aiPopoverEnd = cvDoc.indexOf('<!-- CV Header -->');
let aiSection = "";
if (aiPopoverStart !== -1 && aiPopoverEnd !== -1) {
    aiSection = cvDoc.substring(aiPopoverStart, aiPopoverEnd);
    cvDoc = cvDoc.substring(0, aiPopoverStart) + "[[AI_POPOVER_PLACEHOLDER]]" + cvDoc.substring(aiPopoverEnd);
}

// Make text darker in the CV
cvDoc = cvDoc.replace(/text-slate-600/g, 'text-slate-800');
cvDoc = cvDoc.replace(/text-slate-700/g, 'text-slate-900');
cvDoc = cvDoc.replace(/text-slate-800/g, 'text-slate-900');
cvDoc = cvDoc.replace(/border-slate-300/g, 'border-slate-800'); // Make divider lines bolder/darker

// Restore popover
if (aiSection) {
    cvDoc = cvDoc.replace('[[AI_POPOVER_PLACEHOLDER]]', aiSection);
}

fs.writeFileSync('index.html', before + cvDoc + after);
console.log('CV colors updated.');

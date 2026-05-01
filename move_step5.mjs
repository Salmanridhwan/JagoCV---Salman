import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'src', 'html', 'create-cv.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// Find cv-step-5 block
const step5Start = content.indexOf('<div id="cv-step-5"');
const step5End = content.indexOf('</div>', content.indexOf('<!-- END CARD: Pilih Layout ATS -->')) + 6; 
// Wait, the block ends later. Let's find the specific end.
const finalDivEnd = content.indexOf('  </div>\n\n  <!-- Right Col: Live Preview -->');
const actualStep5End = finalDivEnd;

const step5Block = content.substring(step5Start, actualStep5End);

// Remove from original position
content = content.substring(0, step5Start) + content.substring(actualStep5End);

// Find end of container-cv-manual
const manualEndMarker = '    <!-- END CONTAINER: MANUAL FORMS -->';
const manualEndIndex = content.indexOf(manualEndMarker);

// Insert before the marker (which is after the closing div of manual container)
// Wait, let's find the closing div of container-cv-manual
const manualCloseDiv = content.lastIndexOf('    </div>', manualEndIndex);

content = content.substring(0, manualCloseDiv) + '\n' + step5Block + content.substring(manualCloseDiv);

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Moved cv-step-5 into container-cv-manual');

const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// For Resume:
const resumeManualEndMarker = `</div>\n          </div> <!-- END CONTAINER: MANUAL FORMS (RESUME) -->`;
const resumeAiEndMarker = `</div> <!-- END CONTAINER: AI MAGIC STORY (RESUME) -->`;
// We want to extract <div id="resume-step-5" ... up to just before résuméManualEndMarker,
// but wait, there is an extra </div> or so?
// Actually `resume-step-5` is literally:
// <div id="resume-step-5"...> ... </div>\n
// and then the end marker.

let resStart = html.indexOf('<div id="resume-step-5"');
let resEnd = html.indexOf(resumeManualEndMarker);
if (resStart !== -1 && resEnd !== -1) {
    let extracted = html.substring(resStart, resEnd);
    html = html.substring(0, resStart) + html.substring(resEnd);
    
    let resAiIdx = html.indexOf(resumeAiEndMarker);
    if(resAiIdx !== -1) {
       let pos = resAiIdx + resumeAiEndMarker.length;
       html = html.substring(0, pos) + '\n\n' + extracted + html.substring(pos);
    }
}

// For Portfolio:
const portManualEndMarker = `</div></div>\n          </div> <!-- END CONTAINER: MANUAL FORMS (PORTFOLIO) -->`;
const portAiEndMarker = `</div> <!-- END CONTAINER: AI MAGIC STORY (PORTFOLIO) -->`;

let portStart = html.indexOf('<div id="portfolio-step-7"');
let portEnd = html.indexOf(portManualEndMarker);
if (portStart !== -1 && portEnd !== -1) {
    let extracted = html.substring(portStart, portEnd);
    html = html.substring(0, portStart) + html.substring(portEnd);
    
    let portAiIdx = html.indexOf(portAiEndMarker);
    if(portAiIdx !== -1) {
       let pos = portAiIdx + portAiEndMarker.length;
       html = html.substring(0, pos) + '\n\n' + extracted + html.substring(pos);
    }
}

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Fixed containers.');

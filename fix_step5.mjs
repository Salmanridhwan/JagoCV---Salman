import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'src', 'html', 'create-cv.html');
let content = fs.readFileSync(htmlPath, 'utf8');

// The layout selector block starts with <!-- CARD: Pilih Layout ATS -->
// and ends with <!-- END CARD: Pilih Layout ATS -->
const startMarker = '    <!-- CARD: Pilih Layout ATS -->';
const endMarker = '    <!-- END CARD: Pilih Layout ATS -->';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find layout selector block.');
  process.exit(1);
}

// Extract the layout selector block
const layoutBlock = content.substring(startIndex, endIndex);

// Remove the layout selector block from the right column
content = content.substring(0, startIndex) + content.substring(endIndex);

// Find cv-step-5
const step5Start = content.indexOf('  <div id="cv-step-5" class="cv-step hidden w-full">');
if (step5Start === -1) {
  console.error('Could not find cv-step-5.');
  process.exit(1);
}

// In cv-step-5, we currently have the Final Confirmation block.
// I will replace everything inside <div class="grid grid-cols-1 gap-6"> in cv-step-5
// with the Layout Block + The Action Button block.

const gridStart = content.indexOf('<div class="grid grid-cols-1 gap-6">', step5Start);
const step5End = content.indexOf('  </div>\n\n  <!-- Right Col: Live Preview -->', step5Start);

if (gridStart === -1 || step5End === -1) {
  console.error('Could not parse cv-step-5.');
  process.exit(1);
}

// Re-construct the two sections for cv-step-5
const actionButtonSection = `
    <!-- Aksi Button -->
    <div
      class="rounded-[24px] p-6 border border-slate-200 dark:border-[#2A3143] bg-transparent flex flex-col mt-6"
    >
      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick="goToCvStep(4)"
          class="shrink-0 bg-slate-100 dark:bg-[#1A2133] hover:bg-slate-200 dark:hover:bg-[#2A3143] text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          title="Kembali ke Keterampilan"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Kembali
        </button>
        <button
          id="btn-generate-cv"
          class="flex-1 bg-[#5A45FF] hover:bg-[#4C3BDE] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(90,69,255,0.4)] flex items-center justify-center gap-2 group"
        >
          <svg class="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
          Generate CV AI
        </button>
      </div>
      <p class="text-center text-[10px] text-slate-500 mt-4 px-4 leading-relaxed">
        Dengan menekan buat, Anda setuju untuk memformat data Anda mengikuti pedoman parser ATS global melalui jagoCV Engine.
      </p>
    </div>`;

// First, fix the layout block's spacing (remove the mt-6 shadow-sm if it was added)
let cleanLayoutBlock = layoutBlock.replace('mt-6 shadow-sm', '');
// Add the step indicator to the layout block
cleanLayoutBlock = cleanLayoutBlock.replace(
  '<h3 class="font-bold text-slate-900 dark:text-white text-sm">',
  `<h2 class="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span class="w-6 h-6 rounded-md bg-blue-100 dark:bg-[#1E5EFF]/20 flex items-center justify-center text-blue-600 dark:text-[#88A4E6] text-xs">5</span>
            Pilih Layout ATS
          </h2>
          <!-- old h3 was here, we remove it -->
          <h3 class="hidden">`
);

const newStep5Content = `  <div id="cv-step-5" class="cv-step hidden w-full">
    <div class="grid grid-cols-1 gap-6">
${cleanLayoutBlock}
${actionButtonSection}
    </div>
  </div>`;

content = content.substring(0, step5Start) + newStep5Content + content.substring(step5End + 8); // +8 skips '  </div>\n'

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Successfully reverted layout to step 5 with 2 sections.');

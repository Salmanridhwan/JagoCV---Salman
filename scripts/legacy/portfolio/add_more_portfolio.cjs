const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

const newPortfolioThemes = `
                  <!-- Option 4 (New: Terminal/Hacker) -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-black rounded border border-green-500/30 flex flex-col items-start gap-1 p-1.5 shrink-0 overflow-hidden">
                        <div class="w-full flex items-center justify-between mb-1">
                           <div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-red-500"></div><div class="w-1 h-1 rounded-full bg-yellow-500"></div><div class="w-1 h-1 rounded-full bg-green-500"></div></div>
                        </div>
                        <div class="w-3/4 h-[1px] bg-green-400 mt-1"></div>
                        <div class="w-1/2 h-[1px] bg-green-400 shadow-[0_0_2px_#4ade80]"></div>
                        <div class="w-2h-[1px] bg-green-400 mt-1"></div>
                        <div class="w-full h-1 bg-green-500/20 rounded-sm mt-1"></div>
                        <div class="w-full h-1 bg-green-500/20 rounded-sm border-l border-green-400"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Dev Terminal</p>
                        <p class="text-[10px] text-green-600 dark:text-green-400 mt-0.5">Estetika hacker & CLI</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>

                  <!-- Option 5 (New: Minimal/Editorial) -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex flex-col gap-1 p-1.5 shrink-0 overflow-hidden shadow-sm">
                        <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 mb-0.5 flex flex-col justify-end p-0.5"><div class="w-1/2 h-[1px] bg-slate-300 dark:bg-slate-600"></div></div>
                        <div class="w-5/6 h-[1px] bg-slate-800 dark:bg-slate-200 mt-1 mx-auto"></div>
                        <div class="w-2/3 h-[1px] bg-slate-800 dark:bg-slate-200 mx-auto"></div>
                        <div class="w-1/3 h-0.5 bg-slate-400 dark:bg-slate-500 mt-1 mx-auto"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Editorial Serif</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Elegan, luas, minimalis</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>
`;

let targetOption3 = '<!-- Option 3 (New: Classic Linktree) -->';
// Find the end of Option 3.
let searchIdx = html.indexOf(targetOption3);
if (searchIdx !== -1) {
    let nextLabelEnd = html.indexOf('</label>', searchIdx);
    if(nextLabelEnd !== -1) {
       let pos = nextLabelEnd + '</label>'.length;
       html = html.substring(0, pos) + '\n\n' + newPortfolioThemes + html.substring(pos);
       fs.writeFileSync('index.html', html, 'utf-8');
       console.log('Added Portfolio Themes 4 and 5');
    }
}

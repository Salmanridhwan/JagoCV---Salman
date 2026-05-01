const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

const targetStr = `                  <!-- Tema 4 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-rose-50 dark:bg-rose-900/20 rounded border border-rose-200 dark:border-rose-800 flex flex-col items-center gap-1 p-1.5 shrink-0 overflow-hidden">
                        <div class="w-full h-1 bg-rose-400/50 rounded-sm mb-1"></div>
                        <div class="w-full flex justify-center gap-1 mb-1">
                          <div class="w-1/3 h-4 bg-rose-300/40 rounded-sm"></div>
                          <div class="w-1/3 h-4 bg-rose-300/40 rounded-sm"></div>
                        </div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Grid Portofolio</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Menyorot gambar proyek</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>
                </div>`;

const replacements = `                  <!-- Tema 4 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-rose-50 dark:bg-rose-900/20 rounded border border-rose-200 dark:border-rose-800 flex flex-col items-center gap-1 p-1.5 shrink-0 overflow-hidden">
                        <div class="w-full h-1 bg-rose-400/50 rounded-sm mb-1"></div>
                        <div class="w-full flex justify-center gap-1 mb-1">
                          <div class="w-1/3 h-4 bg-rose-300/40 rounded-sm"></div>
                          <div class="w-1/3 h-4 bg-rose-300/40 rounded-sm"></div>
                        </div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Grid Portofolio</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Menyorot gambar proyek</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>

                  <!-- Tema 5 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800 flex flex-col gap-1 p-1.5 shrink-0 overflow-hidden">
                        <div class="w-full h-2 bg-emerald-500/80 rounded-sm mb-1 flex items-center justify-center"><div class="w-1/2 h-0.5 bg-white/80 rounded-sm"></div></div>
                        <div class="w-3/4 h-1 bg-emerald-400/50 rounded-sm"></div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                        <div class="w-5/6 h-1 bg-slate-400/30 rounded-sm"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Banner Korporat</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Tegas dengan header warna</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>

                  <!-- Tema 6 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-slate-100 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-600 flex flex-row gap-1 p-1.5 shrink-0 overflow-hidden">
                         <div class="w-2/5 h-full bg-slate-300/50 dark:bg-slate-700/50 rounded-sm flex flex-col gap-[2px]">
                            <div class="w-1/2 h-1 bg-slate-400/50 rounded-sm mt-1"></div>
                            <div class="w-3/4 h-0.5 bg-slate-400/30 rounded-sm"></div>
                         </div>
                         <div class="flex-1 flex flex-col gap-[2px]">
                            <div class="w-full h-1 bg-slate-400/50 rounded-sm"></div>
                            <div class="w-full h-1 bg-slate-400/50 rounded-sm mb-1"></div>
                            <div class="w-4/5 h-0.5 bg-slate-400/30 rounded-sm"></div>
                            <div class="w-full h-0.5 bg-slate-400/30 rounded-sm"></div>
                         </div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Timeline Akademik</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Cocok untuk riwayat padat</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>
                </div>`;

if (html.includes(targetStr)) {
  html = html.replace(targetStr, replacements);
  fs.writeFileSync('index.html', html, 'utf-8');
  console.log("Successfully added visual themes");
} else {
  console.log("Target string not found");
}

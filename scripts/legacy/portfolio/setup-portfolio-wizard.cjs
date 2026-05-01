const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// The new progress bar HTML for Portfolio
const newPortfolioProgressBar = `            <!-- Wizard Progress Animation -->
            <div id="portfolio-wizard-progress" class="w-full mb-8 pt-4">
              <div class="flex items-center justify-between relative">
                <div class="absolute left-0 top-5 -translate-y-1/2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
                <div id="portfolio-progress-bar" class="absolute left-0 top-5 -translate-y-1/2 h-1.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full z-0 transition-all duration-700 ease-out w-0"></div>
                
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator active" id="portfolio-indicator-step-1" data-step="1">
                  <div class="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-500 scale-110">1</div>
                  <span class="text-[11px] font-bold text-cyan-500 mt-1 transition-colors uppercase tracking-wider">Profil</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-2" data-step="2">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">2</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Tautan</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-3" data-step="3">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">3</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Proyek</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-4" data-step="4">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">4</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Riwayat</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-5" data-step="5">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">5</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Gaya</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-6" data-step="6">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">6</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Selesai</span>
                </div>
              </div>
            </div>`;

// Replace the existing portfolio progress bar (which might be the old one) completely.
const progressRegex = /<!-- Wizard Progress Animation -->\s*<div id="portfolio-wizard-progress"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

if (progressRegex.test(html)) {
   html = html.replace(progressRegex, newPortfolioProgressBar);
} else {
   html = html.replace('<!-- Profile & Subdomain -->', newPortfolioProgressBar + '\n              <!-- Profile & Subdomain -->');
}

// Ensure the portfolio dash cards are wrapped correctly
// We'll replace the starting lines of the target regions and add the Next/Prev buttons.

// Step 1: Profile & Subdomain (Starts at <!-- Profile & Subdomain --> ends before <!-- Links & Digital Real Estate -->)
let step1HTML = "<!-- Profile & Subdomain -->\n              <div id=\"portfolio-step-1\" class=\"portfolio-step block dash-card rounded-3xl p-6 md:p-8\">";
html = html.replace(/<!-- Profile & Subdomain -->\s*<div class="dash-card rounded-3xl p-6 md:p-8">/, step1HTML);

// Next button for Step 1
let step1BtnHTML = "<textarea rows=\"4\" placeholder=\"Ceritakan lebih detail tentang perjalanan karir Anda, passion, dan apa yang sedang Anda cari...\" class=\"w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none\"></textarea>\n                  </div>\n                </div>\n                <div class=\"flex justify-end mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50\"><button type=\"button\" onclick=\"goToPortfolioStep(2)\" class=\"bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95\">Selanjutnya <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"></path></svg></button></div>\n              </div>";

html = html.replace(/<textarea rows="4" placeholder="Ceritakan lebih detail tentang perjalanan karir Anda, passion, dan apa yang sedang Anda cari\.\.\." class="w-full bg-slate-100 dark:bg-\\[#0B1221\\]\/50 border border-slate-300 dark:border-slate-700\/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"><\/textarea>\s*<\/div>\s*<\/div>\s*<\/div>/, step1BtnHTML);

// Step 2: Links & Digital Real Estate
let step2HTML = "<!-- Links & Digital Real Estate -->\n              <div id=\"portfolio-step-2\" class=\"portfolio-step hidden dash-card rounded-3xl p-6 md:p-8 mt-6\">";
html = html.replace(/<!-- Links & Digital Real Estate -->\s*<div class="dash-card rounded-3xl p-6 md:p-8( mt-6)?">/, step2HTML);

// Next button for Step 2
let step2BtnHTML = "<input type=\"url\" placeholder=\"URL (https://linkedin.com/...)\" class=\"flex-1 bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-600 outline-none\">\n                 </div>\n               </div>\n               <div class=\"flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50\"><button type=\"button\" onclick=\"goToPortfolioStep(1)\" class=\"bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95\"><svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 19l-7-7 7-7\"></path></svg> Sebelumnya</button><button type=\"button\" onclick=\"goToPortfolioStep(3)\" class=\"bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95\">Selanjutnya <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"></path></svg></button></div>\n              </div>";

html = html.replace(/<input type="url" placeholder="URL \(https:\/\/linkedin\.com\/\.\.\.\)" class="flex-1 bg-slate-100 dark:bg-\\[#0B1221\\]\/50 border border-slate-300 dark:border-slate-700\/80 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-600 outline-none">\s*<\/div>\s*<\/div>\s*<\/div>/, step2BtnHTML);

// Step 3: Proyek Unggulan
let step3HTML = "<!-- Proyek Unggulan -->\n              <div id=\"portfolio-step-3\" class=\"portfolio-step hidden dash-card rounded-3xl p-6 md:p-8 mt-6\">";
html = html.replace(/<!-- Proyek Unggulan -->\s*<div class="dash-card rounded-3xl p-6 md:p-8 mt-6">/, step3HTML);

// Next button for Step 3
let step3BtnHTML = "<textarea rows=\"2\" placeholder=\"Deskripsi singkat proyek Anda...\" class=\"w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none resize-none\"></textarea>\n                       </div>\n                    </div>\n                 </div>\n                 <div class=\"flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50\"><button type=\"button\" onclick=\"goToPortfolioStep(2)\" class=\"bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95\"><svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 19l-7-7 7-7\"></path></svg> Sebelumnya</button><button type=\"button\" onclick=\"goToPortfolioStep(4)\" class=\"bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95\">Selanjutnya <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"></path></svg></button></div>\n              </div>";
html = html.replace(/<textarea rows="2" placeholder="Deskripsi singkat proyek Anda\.\.\." class="w-full bg-white dark:bg-slate-900\/50 border border-slate-200 dark:border-slate-700\/80 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none resize-none"><\/textarea>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, step3BtnHTML);

// Step 4: Pengalaman & Edukasi Terperinci
let step4HTML = "<!-- Pengalaman & Edukasi Terperinci -->\n              <div id=\"portfolio-step-4\" class=\"portfolio-step hidden dash-card rounded-3xl p-6 md:p-8 mt-6\">";
html = html.replace(/<!-- Pengalaman & Edukasi Terperinci -->\s*<div class="dash-card rounded-3xl p-6 md:p-8 mt-6">/, step4HTML);

// Next button for Step 4
let step4BtnHTML = "<textarea rows=\"3\" placeholder=\"Jelaskan peran, tanggung jawab, dan pencapaian utama...\" class=\"w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all\"></textarea>\n                 </div>\n               </div>\n               <div class=\"flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50\"><button type=\"button\" onclick=\"goToPortfolioStep(3)\" class=\"bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95\"><svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 19l-7-7 7-7\"></path></svg> Sebelumnya</button><button type=\"button\" onclick=\"goToPortfolioStep(5)\" class=\"bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95\">Selanjutnya <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"></path></svg></button></div>\n              </div>";
html = html.replace(/<textarea rows="3" placeholder="Jelaskan peran, tanggung jawab, dan pencapaian utama\.\.\." class="w-full bg-white dark:bg-slate-900\/50 border border-slate-200 dark:border-slate-700\/80 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"><\/textarea>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, step4BtnHTML);

// Step 5: Gaya & Visual
let step5HTML = "<!-- Gaya & Visual -->\n              <div id=\"portfolio-step-5\" class=\"portfolio-step hidden dash-card rounded-3xl p-6 md:p-8 mt-6\">";
html = html.replace(/<!-- Gaya & Visual -->\s*<div class="dash-card rounded-3xl p-6 md:p-8 mt-6">/, step5HTML);

// Next button for Step 5
let step5BtnHTML = "<svg class=\"w-5 h-5 text-slate-400 dark:text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 9l-7 7-7-7\"></path></svg>\n                     </div>\n                   </div>\n                 </div>\n                 <div class=\"flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50\"><button type=\"button\" onclick=\"goToPortfolioStep(4)\" class=\"bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95\"><svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 19l-7-7 7-7\"></path></svg> Sebelumnya</button><button type=\"button\" onclick=\"goToPortfolioStep(6)\" class=\"bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95\">Pilih Layout <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5l7 7-7 7\"></path></svg></button></div>\n              </div>\n            </div> <!-- END CONTAINER: MANUAL FORMS (PORTFOLIO) -->";
html = html.replace(/<svg class="w-5 h-5 text-slate-400 dark:text-slate-500 absolute right-4 top-1\/2 -translate-y-1\/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"><\/path><\/svg>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- END CONTAINER: MANUAL FORMS \(PORTFOLIO\) -->/, step5BtnHTML);

// Step 6: Layout
let step6HTML = "<!-- Right Col: Template Select & Generate -->\n          <div id=\"portfolio-step-6\" class=\"portfolio-step hidden w-full\">";
html = html.replace(/<!-- Right Col: Template Select & Generate -->\s*<div class="w-full">/, step6HTML);

// Back button for Step 6 inside #btn-generate-portfolio area
let step6BtnHTML = "<!-- Aksi Button -->\n            <div class=\"mt-6 flex flex-col gap-4\">\n              <div class=\"flex items-center gap-4\">\n                <button type=\"button\" onclick=\"goToPortfolioStep(5)\" class=\"shrink-0 bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer\" title=\"Kembali ke Gaya & Visual Custom\"><svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M15 19l-7-7 7-7\"></path></svg></button>\n              <button id=\"btn-generate-portfolio\"";
html = html.replace(/<!-- Aksi Button -->\s*<div class="mt-6 flex flex-col gap-4">\s*<button id="btn-generate-portfolio"/, step6BtnHTML);
              
html = html.replace(/Publikasikan Portofolio AI\s*<\/button>\s*<p class="text-center text-\[9px\] text-slate-500/g,
"Publikasikan Portofolio AI\n              </button>\n              </div>\n              <p class=\"text-center text-[9px] text-slate-500");

fs.writeFileSync('index.html', html);

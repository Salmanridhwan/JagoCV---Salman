const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Replace everything inside container-portfolio-manual up to its end.
const startMarker = `<!-- CONTAINER: MANUAL FORMS (PORTFOLIO) -->`;
const endMarker = `<!-- END CONTAINER: MANUAL FORMS (PORTFOLIO) -->`;

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Markers not found");
  process.exit(1);
}

const newPortfolioManual = `<!-- CONTAINER: MANUAL FORMS (PORTFOLIO) -->
            <div id="container-portfolio-manual" class="space-y-6 block animate-[fadeIn_0.3s_ease_forwards]">
            
            <!-- Wizard Progress Animation -->
            <div id="portfolio-wizard-progress" class="w-full mb-8 pt-4 overflow-x-auto hide-scrollbar pb-2">
              <div class="flex items-center justify-between relative min-w-[500px]">
                <div class="absolute left-0 top-5 -translate-y-1/2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
                <div id="portfolio-progress-bar" class="absolute left-0 top-5 -translate-y-1/2 h-1.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full z-0 transition-all duration-700 ease-out w-0"></div>
                
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator active" id="portfolio-indicator-step-1" data-step="1">
                  <div class="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-500 scale-110">1</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-cyan-500 mt-1 transition-colors uppercase tracking-wider">Profil</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-2" data-step="2">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">2</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Tautan</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-3" data-step="3">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">3</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Proyek</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-4" data-step="4">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">4</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Pengalaman</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-5" data-step="5">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">5</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Pendidikan</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-6" data-step="6">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">6</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Gaya</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group portfolio-step-indicator" id="portfolio-indicator-step-7" data-step="7">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">7</div>
                  <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Layout</span>
                </div>
              </div>
            </div>

            <!-- Profile & Subdomain -->
            <div id="portfolio-step-1" class="portfolio-step block dash-card rounded-3xl p-6 md:p-8">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs">1</span>
                Info Identitas
              </h2>
              
              <div class="flex flex-col gap-6 mb-6">
                <!-- Image Uploads -->
                <div class="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  <label class="flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0B1221]/30 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-cyan-500 cursor-pointer transition-all group shrink-0 relative overflow-hidden">
                    <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Unggah Foto Profil">
                    <svg class="w-8 h-8 text-slate-400 group-hover:text-cyan-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">Foto Profil</span>
                  </label>
                  <label class="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0B1221]/30 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-cyan-500 cursor-pointer transition-all group relative overflow-hidden">
                    <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Unggah Sampul/Banner">
                    <svg class="w-8 h-8 text-slate-400 group-hover:text-cyan-500 mb-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0V20a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2h10l4 4v10z"></path></svg>
                    <span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">Gambar Banner (Opsional)</span>
                  </label>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tautan Kustom Anda *</label>
                    <div class="flex items-center">
                       <span class="bg-white/80 dark:bg-[#0B1221]/80 border border-slate-300 dark:border-slate-700/80 border-r-0 rounded-l-xl px-3 py-2.5 text-sm text-slate-500 font-medium whitespace-nowrap">jagocv.link/</span>
                       <input type="text" placeholder="johndoe" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-r-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                    </div>
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Judul Profil / Peran *</label>
                    <input type="text" placeholder="John Doe | Developer" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lokasi</label>
                    <input type="text" placeholder="Jakarta, Indonesia" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Emoji Aksen</label>
                    <input type="text" placeholder="🚀" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                  </div>
                </div>
              </div>
              
              <div class="space-y-5">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bio Singkat (Slogan)</label>
                  <textarea rows="2" placeholder="Membangun aplikasi web keren dan mempelajari AI..." class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"></textarea>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tentang Saya (Lengkap)</label>
                  <textarea rows="4" placeholder="Ceritakan lebih detail tentang perjalanan karir Anda, passion, dan apa yang sedang Anda cari..." class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"></textarea>
                </div>
              </div>
              <div class="flex justify-end mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50"><button type="button" onclick="goToPortfolioStep(2)" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button></div>
            </div>

            <!-- Links & Digital Real Estate -->
            <div id="portfolio-step-2" class="portfolio-step hidden dash-card rounded-3xl p-6 md:p-8">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs">2</span>
                  Tautan Penting
                </h2>
                <button class="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-900/20 hover:bg-cyan-200 dark:hover:bg-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Tautan
                </button>
              </div>
              
              <div class="space-y-3">
                 <div class="flex items-center gap-3 bg-slate-100 dark:bg-[#0B1221]/30 border border-slate-300/50 dark:border-slate-700/50 rounded-xl p-3 relative group">
                    <div class="cursor-move text-slate-500 hover:text-cyan-500 px-1 shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg></div>
                    <input type="text" placeholder="Judul (contoh: GitHub)" value="Lihat GitHub Saya" class="w-1/3 bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500">
                    <input type="url" placeholder="URL (https://github.com/...)" value="https://github.com/johndoe" class="flex-1 bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500">
                    <button class="text-slate-400 hover:text-rose-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                 </div>
                 <div class="flex items-center gap-3 bg-slate-100 dark:bg-[#0B1221]/30 border border-slate-300/50 dark:border-slate-700/50 rounded-xl p-3 relative group">
                    <div class="cursor-move text-slate-500 hover:text-cyan-500 px-1 shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg></div>
                    <input type="text" placeholder="Judul (contoh: LinkedIn)" value="Terhubung di LinkedIn" class="w-1/3 bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500">
                    <input type="url" placeholder="URL (https://linkedin.com/...)" class="flex-1 bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500">
                    <button class="text-slate-400 hover:text-rose-400"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                 </div>
              </div>
              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToPortfolioStep(1)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToPortfolioStep(3)" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <!-- Proyek Unggulan -->
            <div id="portfolio-step-3" class="portfolio-step hidden dash-card rounded-3xl p-6 md:p-8">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs">3</span>
                  Proyek Unggulan
                </h2>
                <button class="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-900/20 hover:bg-cyan-200 dark:hover:bg-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Proyek
                </button>
              </div>
              
              <div class="space-y-4">
                 <div class="bg-slate-50 dark:bg-[#0B1221]/40 border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-5 relative group">
                     <button class="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" title="Hapus">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                    <div class="flex flex-col gap-4">
                       <div class="flex gap-4">
                          <label class="w-20 h-20 rounded-xl bg-white dark:bg-[#0B1221]/50 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-cyan-500 hover:border-cyan-500 cursor-pointer transition-colors shrink-0">
                             <input type="file" accept="image/*" class="hidden">
                             <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                             <span class="text-[9px]">Thumbnail</span>
                          </label>
                          <div class="flex-1 space-y-3">
                             <input type="text" placeholder="Nama Proyek (misal: Taskify App)" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                             <input type="url" placeholder="Tautan Proyek / Demo URL (opsional)" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                          </div>
                       </div>
                       <textarea rows="3" placeholder="Deskripsi mendetail tentang fitur proyek, apa yang diselesaikan, dan dampaknya..." class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none resize-none focus:ring-1 focus:ring-cyan-500"></textarea>
                     </div>
                  </div>
               </div>
               <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                 <button type="button" onclick="goToPortfolioStep(2)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                 <button type="button" onclick="goToPortfolioStep(4)" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
               </div>
            </div>

            <!-- Pengalaman Kerja -->
            <div id="portfolio-step-4" class="portfolio-step hidden dash-card rounded-3xl p-6 md:p-8">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs">4</span>
                  Pengalaman Kerja
                </h2>
                <button class="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-900/20 hover:bg-cyan-200 dark:hover:bg-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Peran
                </button>
              </div>
              
              <div class="space-y-4 mb-6">
                 <!-- Pengalaman 1 -->
                 <div class="bg-slate-50 dark:bg-[#0B1221]/40 border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-5 relative group">
                    <button class="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" title="Hapus">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                       <input type="text" placeholder="Nama Perusahaan" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                       <input type="text" placeholder="Jabatan" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-3">
                       <input type="text" placeholder="Tahun Mulai (misal: Jan 2022)" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                       <input type="text" placeholder="Tahun Selesai (misal: Sekarang)" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                    </div>
                    <textarea rows="3" placeholder="Deskripsi peran dan dampak yang dihasilkan..." class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none resize-none focus:ring-1 focus:ring-cyan-500"></textarea>
                 </div>
              </div>

              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToPortfolioStep(3)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToPortfolioStep(5)" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <!-- Pendidikan -->
            <div id="portfolio-step-5" class="portfolio-step hidden dash-card rounded-3xl p-6 md:p-8">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs">5</span>
                  Pendidikan Terakhir
                </h2>
                <button class="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1 bg-cyan-100 dark:bg-cyan-900/20 hover:bg-cyan-200 dark:hover:bg-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Pendidikan
                </button>
              </div>
              
              <div class="space-y-4 mb-6">
                 <!-- Pendidikan 1 -->
                 <div class="bg-slate-50 dark:bg-[#0B1221]/40 border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-5 relative group">
                    <button class="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" title="Hapus">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                       <input type="text" placeholder="Nama Institusi / Universitas" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                       <input type="text" placeholder="Gelar / Bidang Studi" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-3">
                       <input type="text" placeholder="Tahun Mulai" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                       <input type="text" placeholder="Tahun Lulus" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-lg px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-cyan-500">
                    </div>
                 </div>
              </div>

              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToPortfolioStep(4)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToPortfolioStep(6)" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>
            
            <!-- Gaya & Visual -->
            <div id="portfolio-step-6" class="portfolio-step hidden dash-card rounded-3xl p-6 md:p-8">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xs">6</span>
                Keterampilan & Identitas Gaya
              </h2>

              <div class="space-y-1.5 mb-6">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Keterampilan Utama / Tech Stack (Pisahkan dengan koma)</label>
                <textarea rows="2" placeholder="React, Tailwind, Node.js, Vercel, Figma..." class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none"></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-slate-200 dark:border-slate-700/50">
                <div class="space-y-3">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warna Aksen Brand</label>
                  <div class="flex items-center gap-3">
                    <button class="w-8 h-8 rounded-full bg-blue-500 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#0B1221] shadow-sm"></button>
                    <button class="w-8 h-8 rounded-full bg-indigo-500 hover:scale-110 transition-transform shadow-sm"></button>
                    <button class="w-8 h-8 rounded-full bg-rose-500 hover:scale-110 transition-transform shadow-sm"></button>
                    <button class="w-8 h-8 rounded-full bg-emerald-500 hover:scale-110 transition-transform shadow-sm"></button>
                    <button class="w-8 h-8 rounded-full bg-amber-500 hover:scale-110 transition-transform shadow-sm"></button>
                    <button class="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-300 border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform shadow-sm"></button>
                  </div>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pilihan Nuansa Font</label>
                  <div class="relative">
                    <select class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 pr-10 text-sm text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer">
                      <option value="modern">Modern (Inter, Roboto)</option>
                      <option value="elegant">Elegan (Playfair, Serif)</option>
                      <option value="tech">Teknologi (Mono, Code)</option>
                      <option value="playful">Ceria (Rounded, Pop)</option>
                    </select>
                    <svg class="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToPortfolioStep(5)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToPortfolioStep(7)" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 active:scale-95">Pilih Layout Web <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <!-- Pilih Layout (Selesai) -->
            <div id="portfolio-step-7" class="portfolio-step hidden w-full">
              <div class="grid grid-cols-1 gap-6">

                <!-- Pilih Layout Column -->
                <div class="dash-card rounded-3xl p-6 border-slate-200 dark:border-slate-800 flex flex-col">
                  <h2 class="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">7. Gaya Tata Letak Akhir</h2>
                  
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <!-- Option 1: Selected -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 cursor-pointer overflow-hidden transition-all filter hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-white/10 rounded border border-black/20 dark:border-white/20 flex flex-col gap-1 p-1.5 shrink-0 overflow-hidden">
                        <div class="w-full h-1/3 bg-cyan-400/40 rounded-sm"></div>
                        <div class="flex flex-row gap-1 flex-1">
                            <div class="w-1/2 bg-white/20 rounded-sm"></div>
                            <div class="w-1/2 bg-white/20 rounded-sm"></div>
                        </div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-900 dark:text-white text-sm">Bento Gelap</p>
                        <p class="text-[10px] text-cyan-600 dark:text-cyan-300 mt-0.5">Grid blok modern</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-cyan-500 flex items-center justify-center shrink-0">
                      <div class="w-2.5 h-2.5 bg-cyan-500 rounded-full"></div>
                    </div>
                  </label>

                  <!-- Option 2 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-[#1E293B] rounded border border-slate-300 dark:border-slate-700 flex flex-col items-center gap-1.5 p-1.5 shrink-0 bg-gradient-to-b from-indigo-900/50 to-slate-50 dark:to-[#0B1221]">
                        <div class="w-4 h-4 bg-indigo-500/50 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                        <div class="w-3/4 h-1.5 bg-indigo-400/40 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.3)]"></div>
                        <div class="w-full h-1.5 bg-indigo-400/40 rounded-full mt-1 shadow-[0_0_5px_rgba(99,102,241,0.3)]"></div>
                        <div class="w-full h-1.5 bg-indigo-400/40 rounded-full shadow-[0_0_5px_rgba(99,102,241,0.3)]"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Linktree Neon</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Tumpukan kilau cyberpunk</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>

                  <!-- Option 3 (New: Classic Linktree) -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-white rounded border border-slate-200 flex flex-col items-center gap-1.5 p-1.5 shrink-0">
                        <div class="w-4 h-4 bg-slate-200 rounded-full"></div>
                        <div class="w-3/4 h-1.5 bg-slate-200 rounded-full"></div>
                        <div class="w-full h-1.5 bg-white dark:bg-slate-800 rounded-full mt-1"></div>
                        <div class="w-full h-1.5 bg-white dark:bg-slate-800 rounded-full"></div>
                        <div class="w-full h-1.5 bg-white dark:bg-slate-800 rounded-full"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Standar Klasik</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Daftar tautan minimalis</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>

                  <!-- Option 4 (New: Glass Profile) -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-gradient-to-br from-purple-500/30 to-blue-500/30 backdrop-blur-md rounded border border-black/20 dark:border-white/20 flex flex-col items-center justify-center gap-1.5 p-1.5 shrink-0 relative overflow-hidden">
                        <div class="absolute -top-2 -right-2 w-8 h-8 bg-pink-500/40 rounded-full blur-md"></div>
                        <div class="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-500/40 rounded-full blur-md"></div>
                        <div class="w-4 h-4 bg-white/40 rounded-full z-10 backdrop-blur-sm border border-white/30"></div>
                        <div class="w-full h-2 bg-white/20 rounded-md z-10 backdrop-blur-sm border border-black/20 dark:border-white/20"></div>
                        <div class="w-full h-2 bg-white/20 rounded-md z-10 backdrop-blur-sm border border-black/20 dark:border-white/20"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Aura Kaca</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Efek buram di atas gradien</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>
                </div>

              </div>

              <!-- Aksi Button -->
              <div class="mt-6 flex flex-col gap-4">
                <div class="flex items-center gap-4">
                  <button type="button" onclick="goToPortfolioStep(6)" class="shrink-0 bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer" title="Kembali"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
                <button id="btn-generate-portfolio" class="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 group">
                  <svg class="w-5 h-5 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  Publikasikan Portofolio AI
                </button>
                </div>
                <p class="text-center text-[10px] text-slate-500 mt-0 px-4 leading-relaxed">
                  Membuat URL publik. Anda dapat menghubungkan domain kustom nanti.
                </p>
              </div>

            </div></div>
          </div> <!-- END CONTAINER: MANUAL FORMS (PORTFOLIO) -->`;

html = html.substring(0, startIndex) + newPortfolioManual + html.substring(endIndex);

// Replace totalSteps in goToPortfolioStep
const targetFnPort = `function goToPortfolioStep(stepIndex) {
    document.querySelectorAll('.portfolio-step').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    });
    
    const targetStep = document.getElementById('portfolio-step-' + stepIndex);
    if (targetStep) {
      targetStep.classList.remove('hidden');
      targetStep.classList.add('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    }

    const totalSteps = 6;`;
    
const replacementFnPort = `function goToPortfolioStep(stepIndex) {
    document.querySelectorAll('.portfolio-step').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    });
    
    const targetStep = document.getElementById('portfolio-step-' + stepIndex);
    if (targetStep) {
      targetStep.classList.remove('hidden');
      targetStep.classList.add('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    }

    const totalSteps = 7;`;

if(html.includes(targetFnPort)) {
  html = html.replace(targetFnPort, replacementFnPort);
  console.log("Successfully updated totalSteps for goToPortfolioStep");
} else {
  console.log("targetFnPort not found");
}

fs.writeFileSync('index.html', html, 'utf-8');
console.log("Successfully updated Portfolio Web view");

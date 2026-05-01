const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Replace everything inside container-resume-manual up to its end.
const startMarker = `<!-- CONTAINER: MANUAL FORMS (RESUME) -->`;
const endMarker = `<!-- END CONTAINER: MANUAL FORMS (RESUME) -->`;

const startIndex = html.indexOf(startMarker);
const endIndex = html.indexOf(endMarker) + endMarker.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Markers not found");
  process.exit(1);
}

const newResumeManual = `<!-- CONTAINER: MANUAL FORMS (RESUME) -->
            <div id="container-resume-manual" class="space-y-6 block animate-[fadeIn_0.3s_ease_forwards]">
            
            <!-- Wizard Progress Animation -->
            <div id="resume-wizard-progress" class="w-full mb-8 pt-4">
              <div class="flex items-center justify-between relative">
                <div class="absolute left-0 top-5 -translate-y-1/2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full z-0"></div>
                <div id="resume-progress-bar" class="absolute left-0 top-5 -translate-y-1/2 h-1.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] rounded-full z-0 transition-all duration-700 ease-out w-0"></div>
                
                <div class="relative z-10 flex flex-col items-center gap-2 group resume-step-indicator active" id="resume-indicator-step-1" data-step="1">
                  <div class="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-500 scale-110">1</div>
                  <span class="text-[11px] font-bold text-indigo-500 mt-1 transition-colors uppercase tracking-wider">Profil</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group resume-step-indicator" id="resume-indicator-step-2" data-step="2">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">2</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Pengalaman</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group resume-step-indicator" id="resume-indicator-step-3" data-step="3">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">3</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Pendidikan</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group resume-step-indicator" id="resume-indicator-step-4" data-step="4">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">4</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Proyek & Skill</span>
                </div>
                <div class="relative z-10 flex flex-col items-center gap-2 group resume-step-indicator" id="resume-indicator-step-5" data-step="5">
                  <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-400 flex items-center justify-center font-bold text-sm transition-all duration-500">5</div>
                  <span class="text-[11px] font-bold text-slate-400 mt-1 transition-colors uppercase tracking-wider hidden sm:block">Selesai</span>
                </div>
              </div>
            </div>

            <!-- Personal Info & Photo -->
            <div id="resume-step-1" class="resume-step block dash-card rounded-3xl p-6 md:p-8">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">1</span>
                Info Profil & Identitas Visual
              </h2>
              
              <div class="flex flex-col md:flex-row gap-6 mb-6">
                <!-- Photo Upload Simulation -->
                <label class="flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-slate-400 dark:border-slate-600 bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-500 cursor-pointer transition-all group shrink-0 relative overflow-hidden">
                  <input type="file" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Unggah Foto">
                  <svg class="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Unggah Foto</span>
                </label>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Tampilan *</label>
                    <input type="text" placeholder="John Doe" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Headline / Peran *</label>
                    <input type="text" placeholder="Creative Frontend Engineer" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5 sm:col-span-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website Portofolio / Linktree</label>
                    <input type="url" placeholder="https://johndoe.com" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                </div>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alamat Email</label>
                  <input type="email" placeholder="john@example.com" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nomor Telepon</label>
                  <input type="tel" placeholder="+62 812 3456 7890" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lokasi / Remote</label>
                  <input type="text" placeholder="Jakarta, ID (Remote)" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                </div>
                <div class="space-y-1.5 sm:col-span-3">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">LinkedIn URL</label>
                  <input type="url" placeholder="linkedin.com/in/johndoe" class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tentang Saya (Bio Utama)</label>
                <textarea rows="4" placeholder="Tulis bio singkat yang menarik sesuai kepribadian karir Anda. Fokus pada keunikan dan value visual Anda..." class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
              </div>
              <div class="flex justify-end mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50"><button type="button" onclick="goToResumeStep(2)" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button></div>
            </div>

            <!-- Pengalaman Kerja (Resume) -->
            <div id="resume-step-2" class="resume-step hidden dash-card rounded-3xl p-6 md:p-8">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">2</span>
                  Pengalaman Kerja
                </h2>
                <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Peran
                </button>
              </div>
              
              <div class="border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-5 bg-slate-100 dark:bg-[#0B1221]/30 mb-4 group relative">
                <button class="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" title="Hapus">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Perusahaan</label>
                    <input type="text" placeholder="Creative Agency Inc" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jabatan</label>
                    <input type="text" placeholder="Senior UI/UX Designer" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bulan / Tahun Mulai</label>
                    <input type="month" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bulan / Tahun Selesai</label>
                    <input type="month" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                </div>
                <div class="flex items-center gap-2 mb-4">
                  <input type="checkbox" id="current_job_resume" class="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 bg-transparent">
                  <label for="current_job_resume" class="text-xs text-slate-600 dark:text-slate-400">Saya masih bekerja di sini</label>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deskripsi & Dampak Proyek</label>
                  <textarea rows="4" placeholder="Jelaskan peran komprehensif Anda, dan tonjolkan metrik atau project penting yang punya nilai visual atau fungsional tinggi..." class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
                </div>
              </div>
              
              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToResumeStep(1)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToResumeStep(3)" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <!-- Pendidikan (Resume) -->
            <div id="resume-step-3" class="resume-step hidden dash-card rounded-3xl p-6 md:p-8">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">3</span>
                  Pendidikan Terakhir
                </h2>
                <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  Tambah Pendidikan
                </button>
              </div>
              
              <div class="border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-5 bg-slate-100 dark:bg-[#0B1221]/30 mb-4 group relative">
                <button class="absolute top-4 right-4 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" title="Hapus">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div class="space-y-1.5 md:col-span-2">
                    <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama Institusi / Universitas</label>
                    <input type="text" placeholder="Institut Teknologi Bandung" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gelar / Konsentrasi</label>
                    <input type="text" placeholder="Sarjana Desain Visual" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tahun Mulai</label>
                      <input type="text" placeholder="2018" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tahun Lulus</label>
                      <input type="text" placeholder="2022" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all">
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToResumeStep(2)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToResumeStep(4)" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95">Selanjutnya <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <!-- Proyek & Keterampilan (Resume) -->
            <div id="resume-step-4" class="resume-step hidden dash-card rounded-3xl p-6 md:p-8">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">4</span>
                Proyek & Keterampilan Unggulan
              </h2>
              
              <div class="space-y-6">
                <!-- Proyek -->
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Sorotan Proyek</h3>
                    <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 px-2.5 py-1.5 rounded-lg transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                      Tambah Proyek
                    </button>
                  </div>
                  
                  <div class="border border-slate-300/50 dark:border-slate-700/50 rounded-2xl p-4 bg-slate-100 dark:bg-[#0B1221]/30 relative group mb-4">
                     <button class="absolute top-3 right-3 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" title="Hapus">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <input type="text" placeholder="Nama Proyek (misal: Taskify App)" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                        <input type="url" placeholder="Tautan Proyek / Demo URL" class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                     </div>
                     <textarea rows="2" placeholder="Jelaskan tujuan proyek, stack teknologi, peran dan visualisasi Anda..." class="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 outline-none resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"></textarea>
                  </div>
                </div>

                <!-- Keahlian -->
                <div class="border-t border-slate-200 dark:border-slate-700/50 pt-5">
                   <div class="space-y-1.5 focus-within:text-indigo-500 transition-colors">
                     <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider inherit">Keahlian Relevan (Teknis & Desain)</label>
                     <textarea rows="2" placeholder="Graphic Design, Figma, React, Prototyping, Adobe CC..." class="w-full bg-slate-100 dark:bg-[#0B1221]/50 border border-slate-300 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
                   </div>
                </div>
              </div>
              
              <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50">
                <button type="button" onclick="goToResumeStep(3)" class="bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg> Sebelumnya</button>
                <button type="button" onclick="goToResumeStep(5)" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95">Pilih Tema Visual <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
              </div>
            </div>

            <!-- Desain & Layout (Resume) -->
            <div id="resume-step-5" class="resume-step hidden w-full">
              <div class="dash-card rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 bg-transparent flex flex-col">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">5</span>
                  Pilih Tema Visual Resume
                </h2>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <!-- Tema 1 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 cursor-pointer overflow-hidden transition-all filter hover:brightness-110 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-gradient-to-br from-indigo-100 to-white dark:from-indigo-900 dark:to-slate-800 rounded border border-indigo-200 dark:border-indigo-700/50 flex flex-col gap-1.5 p-1.5 shrink-0 overflow-hidden shadow-inner">
                        <div class="w-5 h-5 bg-indigo-500/80 rounded-full mx-auto"></div>
                        <div class="w-full h-1 bg-indigo-400/50 rounded-sm"></div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                        <div class="w-full h-1 bg-slate-400/30 rounded-sm"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-900 dark:text-white text-sm">Prisma Modern</p>
                        <p class="text-[10px] text-indigo-600 dark:text-indigo-300 mt-0.5">Warna tegas & dinamis</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center shrink-0">
                      <div class="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                    </div>
                  </label>

                  <!-- Tema 2 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 flex flex-row gap-1 p-1.5 shrink-0 overflow-hidden">
                        <div class="w-1/3 h-full bg-slate-200 dark:bg-slate-700 rounded-sm flex flex-col gap-1 p-0.5">
                           <div class="w-full aspect-square bg-slate-300 dark:bg-slate-600 rounded-sm"></div>
                           <div class="w-full h-0.5 bg-slate-300 dark:bg-slate-600 rounded-sm"></div>
                        </div>
                        <div class="flex-1 flex flex-col gap-1">
                           <div class="w-full h-1 bg-slate-300 dark:bg-slate-600 rounded-sm"></div>
                           <div class="w-full h-0.5 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                           <div class="w-full h-0.5 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                        </div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Dua Kolom Klasik</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Besih & Minimalis</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>
                  
                  <!-- Tema 3 -->
                  <label class="relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-14 bg-[#1E293B] rounded border border-slate-700 flex flex-col gap-1.5 p-1.5 shrink-0 overflow-hidden relative">
                        <div class="w-full h-1/3 bg-gradient-to-r from-purple-500 to-pink-500 absolute top-0 left-0"></div>
                        <div class="w-4 h-4 bg-white/20 backdrop-blur border border-white/30 rounded-full z-10 mt-1"></div>
                        <div class="w-full h-1 bg-white/40 rounded-full z-10 mt-1"></div>
                        <div class="w-3/4 h-1 bg-white/20 rounded-full z-10"></div>
                      </div>
                      <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">Mode Gelap Kreatif</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">Untuk desainer & engineer</p>
                      </div>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0"></div>
                  </label>

                  <!-- Tema 4 -->
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
                </div>
              </div>

              <!-- Aksi Button -->
              <div class="mt-6 flex flex-col gap-4">
                <div class="flex items-center gap-4">
                  <button type="button" onclick="goToResumeStep(4)" class="shrink-0 bg-slate-100 dark:bg-[#0B1221]/50 hover:bg-slate-200 dark:hover:bg-[#1A2133] text-slate-700 dark:text-slate-300 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer" title="Kembali"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
                  <button id="btn-generate-resume" class="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] flex items-center justify-center gap-2 group">
                    <svg class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
                    Hasilkan Resume Visual
                  </button>
                </div>
              </div>

            </div>
          </div> <!-- END CONTAINER: MANUAL FORMS (RESUME) -->`;

html = html.substring(0, startIndex) + newResumeManual + html.substring(endIndex);
fs.writeFileSync('index.html', html, 'utf-8');
console.log("Successfully updated Resume Visual view");

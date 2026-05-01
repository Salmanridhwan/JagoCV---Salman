const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Update button
html = html.replace(
  '<button class="text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 dark:hover:text-blue-300">Upgrade</button>',
  '<button id="btn-upgrade-plan" class="text-blue-600 dark:text-blue-400 text-sm font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Upgrade</button>'
);

// Add view-pricing right before view-dashboard
const pricingHtml = `
      <!-- VIEW: PRICING -->
      <div id="view-pricing" class="hidden animate-[fadeIn_0.5s_ease_forwards]">
        <div class="max-w-6xl mx-auto mt-6">
          <!-- Back button -->
          <button id="btn-back-from-pricing" class="mb-10 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white px-3 py-2 rounded-xl transition-colors font-semibold">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Kembali ke Profil
          </button>
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <h2 class="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Investasikan pada <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Karier Anda</span></h2>
            <p class="text-lg text-slate-600 dark:text-slate-400">Pilih paket yang sesuai untuk membuka lebih banyak peluang karier dan fitur profesional.</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            <!-- Plan 1: Starter / Free -->
            <div class="bg-white dark:bg-[#0B1221]/80 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col h-full">
              <div class="mb-6">
                <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-6">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Basic</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Gratis selamanya, cocok bagi yang baru memulai.</p>
              </div>
              <div class="mb-8">
                <span class="text-4xl font-extrabold text-slate-900 dark:text-white">Rp 0</span>
                <span class="text-slate-500 dark:text-slate-400 font-medium">/bulan</span>
              </div>
              <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">Buat hingga 2 CV</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">1 Web Portfolio (Tema Standar)</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">Akses AI Teks (Terbatas)</span>
                </li>
                <li class="flex items-start gap-3 opacity-50">
                  <svg class="w-5 h-5 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  <span class="text-sm text-slate-500">Ekspor Multi-Format PDF/DOCX</span>
                </li>
              </ul>
              <button class="w-full py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mt-auto">Paket Anda Saat Ini</button>
            </div>

            <!-- Plan 2: Pro -->
            <div class="bg-gradient-to-b from-[#0e172a] to-[#1e293b] dark:from-[#111827] dark:to-[#1e293b] rounded-[2.5rem] p-8 border border-blue-500/30 shadow-2xl shadow-blue-900/20 flex flex-col h-full transform md:-translate-y-4 relative">
              <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-lg shadow-blue-500/20">
                <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"></path></svg>
                <span class="text-xs font-bold text-white uppercase tracking-wider">Populer</span>
              </div>
              <div class="mb-6">
                <div class="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Pro</h3>
                <p class="text-sm text-slate-300">Buka potensi penuh untuk memaksimalkan peluang.</p>
              </div>
              <div class="mb-8">
                <span class="text-4xl font-extrabold text-white">Rp 49K</span>
                <span class="text-slate-400 font-medium">/bulan</span>
              </div>
              <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 shrink-0">
                    <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="text-sm text-slate-200">Buat CV Tak Terbatas</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 shrink-0">
                    <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="text-sm text-slate-200">Semua Tema Web Portfolio (Termasuk Premium Animasi)</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 shrink-0">
                    <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="text-sm text-slate-200">Akses Penuh Fitur AI (Cover Letter, Perbaikan Teks, Analisis CV)</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5 shrink-0">
                    <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="text-sm text-slate-200">Unduh PDF Kualitas Tinggi tanpa Watermark</span>
                </li>
              </ul>
              <button class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all mt-auto transform hover:-translate-y-0.5">Pilih Pro</button>
            </div>

            <!-- Plan 3: Lifetime / Enterprise -->
            <div class="bg-white dark:bg-[#0B1221]/80 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col h-full">
              <div class="mb-6">
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Lifetime</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Bayar sekali, nikmati semua fitur unggulan selamanya.</p>
              </div>
              <div class="mb-8">
                <span class="text-4xl font-extrabold text-slate-900 dark:text-white">Rp 299K</span>
                <span class="text-slate-500 dark:text-slate-400 font-medium">/sekali bayar</span>
              </div>
              <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">Semua Fitur Pro Tanpa Batas Waktu</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">Akses Terdahulu ke Tema & Template Baru</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">Dukungan Prioritas 24/7 (WhatsApp & Email)</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <span class="text-sm text-slate-700 dark:text-slate-300">Custom Subdomain (opsi link personalisasi)</span>
                </li>
              </ul>
              <button class="w-full py-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors mt-auto">Pilih Lifetime</button>
            </div>
            
          </div>
        </div>
      </div>
`;
html = html.replace('<!-- VIEW: DASHBOARD -->', pricingHtml + '\n      <!-- VIEW: DASHBOARD -->');
fs.writeFileSync('index.html', html);
console.log('Added pricing view successfully');

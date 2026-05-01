const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// We will replace the views completely.
const loginStart = html.indexOf('<!-- Login Page (Hidden initially) -->');
const registerEnd = html.indexOf('<!-- App Wrapper (Hidden initially) -->');

if (loginStart > -1 && registerEnd > -1) {
  const newContent = `    <!-- Login Page (Hidden initially) -->
    <div id="view-login" class="hidden w-full min-h-screen bg-white dark:bg-[#070B19]">
      <div class="flex min-h-screen flex-col lg:flex-row">
        
        <!-- Left Side: Brand & Abstract -->
        <div class="flex flex-col justify-between w-full lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0A0F1F] p-8 sm:p-12 lg:px-16 lg:py-12 order-1 lg:order-1 min-h-[300px] lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:bottom-0">
          <!-- Ambient Effects -->
          <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div class="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
          
          <!-- Logo -->
          <div class="relative z-10 flex items-center gap-3 cursor-pointer group w-fit" onclick="document.getElementById('view-login').classList.remove('flex'); document.getElementById('view-login').classList.add('hidden'); document.getElementById('view-landing').classList.remove('hidden'); document.getElementById('view-landing').classList.add('flex', 'flex-col');">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] text-2xl group-hover:scale-105 transition-transform">
              J
            </div>
            <span class="text-2xl font-bold text-white tracking-wide">jagoCV</span>
          </div>

          <!-- Content Message -->
          <div class="relative z-10 max-w-lg my-12 lg:mb-20">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-6 sm:mb-8 backdrop-blur-sm">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Selamat Datang Kembali
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 leading-[1.2] tracking-tight">Lanjutkan <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">perjalanan karir</span>.</h1>
            <p class="text-slate-400 text-base sm:text-lg leading-relaxed">Masuk ke jagoCV untuk mengelola portofolio, mensunting CV, dan menemukan peluang baru.</p>
          </div>

          <!-- Footer Text -->
          <div class="hidden lg:flex relative z-10 text-slate-500 text-sm items-center gap-4">
            &copy; 2026 jagoCV AI
            <span class="w-1 h-1 rounded-full bg-slate-700"></span>
            <a href="#" class="hover:text-slate-300 transition-colors">Bantuan</a>
          </div>
        </div>

        <!-- Right Side: Login Form -->
        <div class="flex-1 flex items-center justify-center p-6 sm:p-12 w-full lg:w-1/2 order-2 lg:order-2 lg:ml-[50%] min-h-screen bg-white dark:bg-[#070B19] z-10 relative">
          <div class="w-full max-w-md mx-auto animate-[slideUp_0.5s_ease_forwards]">
            <div class="mb-8 text-left">
              <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Masuk ke Akun</h2>
              <p class="text-slate-500 dark:text-slate-400">Senang melihat Anda kembali!</p>
            </div>

            <!-- Login Wrapper -->
            <div class="space-y-6">
              <button id="btn-login-google" class="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 sm:py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Lanjutkan dengan Google
              </button>

              <div class="relative flex items-center py-2">
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span class="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-sm font-medium">atau dengan email</span>
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form class="space-y-4 text-left" onsubmit="event.preventDefault();">
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input type="email" class="w-full bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm" placeholder="nama@email.com">
                </div>
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                    <a href="#" class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Lupa?</a>
                  </div>
                  <input type="password" class="w-full bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm" placeholder="••••••••">
                </div>
                
                <div class="pt-2">
                  <button type="submit" id="btn-login-submit" class="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-[1px]">
                    Masuk Sekarang
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </div>
              </form>

              <div class="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                Belum punya akun? <a href="#" id="link-to-register" class="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors ml-1">Daftar sekarang</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Register Page (Hidden initially) -->
    <div id="view-register" class="hidden w-full min-h-screen bg-white dark:bg-[#070B19]">
      <div class="flex min-h-screen flex-col lg:flex-row">
        
        <!-- Left Side: Brand & Abstract -->
        <div class="flex flex-col justify-between w-full lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0A0F1F] p-8 sm:p-12 lg:px-16 lg:py-12 order-1 lg:order-1 min-h-[300px] lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:bottom-0">
          <!-- Ambient Effects -->
          <div class="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

          <!-- Logo -->
          <div class="relative z-10 flex items-center gap-3 cursor-pointer group w-fit" onclick="document.getElementById('view-register').classList.remove('flex'); document.getElementById('view-register').classList.add('hidden'); document.getElementById('view-landing').classList.remove('hidden'); document.getElementById('view-landing').classList.add('flex', 'flex-col');">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(79,70,229,0.5)] text-2xl group-hover:scale-105 transition-transform">
              J
            </div>
            <span class="text-2xl font-bold text-white tracking-wide">jagoCV</span>
          </div>

          <!-- Content Message -->
          <div class="relative z-10 max-w-lg my-12 lg:mb-10">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs sm:text-sm font-bold tracking-widest uppercase mb-6 sm:mb-8 backdrop-blur-sm">
              <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Buat Akun Gratis
            </div>
            <h3 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-[1.2] tracking-tight">Satu akun me-roket-kan <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">peluang karir.</span></h3>
            
            <div class="grid gap-3 sm:gap-4">
              <div class="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex items-center gap-4 transition-transform hover:-translate-y-1 hover:bg-white/10">
                <div class="hidden sm:flex w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 items-center justify-center shrink-0 border border-blue-500/30">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h4 class="text-white font-bold text-sm sm:text-base mb-0.5">Maksimal Score ATS</h4>
                  <p class="text-slate-400 text-xs sm:text-sm leading-relaxed">Template CV ramah mesin ATS perekrut.</p>
                </div>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md flex items-center gap-4 transition-transform hover:-translate-y-1 hover:bg-white/10">
                <div class="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 items-center justify-center shrink-0 border border-indigo-500/30">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                <div>
                  <h4 class="text-white font-bold text-sm sm:text-base mb-0.5">Penulisan AI</h4>
                  <p class="text-slate-400 text-xs sm:text-sm leading-relaxed">Asisten penyusun profil sekejap.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Text -->
          <div class="hidden lg:flex relative z-10 text-slate-500 text-sm items-center gap-4">
            &copy; 2026 jagoCV AI
            <span class="w-1 h-1 rounded-full bg-slate-700"></span>
            <a href="#" class="hover:text-slate-300 transition-colors">Syarat Pemakaian</a>
          </div>
        </div>

        <!-- Right Side: Register Form -->
        <div class="flex-1 flex items-center justify-center p-6 sm:p-12 w-full lg:w-1/2 order-2 lg:order-2 lg:ml-[50%] min-h-screen bg-white dark:bg-[#070B19] z-10 relative">
          <div class="w-full max-w-md mx-auto animate-[slideUp_0.5s_ease_forwards]">
            <div class="mb-8 text-left">
              <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Buat Akun Anda</h2>
              <p class="text-slate-500 dark:text-slate-400">Mulai bangun masa depan sekarang.</p>
            </div>

            <!-- Form Wrapper -->
            <div class="space-y-6">
              <button id="btn-register-google" class="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 px-4 sm:py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-sm">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Lanjutkan Google
              </button>

              <div class="relative flex items-center py-2">
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span class="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-sm font-medium">atau gunakan email</span>
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form class="space-y-4 text-left" onsubmit="event.preventDefault();">
                <div class="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Depan</label>
                    <input type="text" class="w-full bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" placeholder="Budi">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Belakang</label>
                    <input type="text" class="w-full bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" placeholder="S.">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input type="email" class="w-full bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" placeholder="nama@email.com">
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                  <input type="password" class="w-full bg-white dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 sm:py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm" placeholder="Minimal 8 karakter">
                </div>
                
                <div class="pt-2">
                  <button type="submit" id="btn-register-submit" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:-translate-y-[1px] shadow-lg shadow-indigo-500/25">
                    Daftar Sekarang
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </div>
                
                <p class="text-xs text-center text-slate-500 mt-4 leading-relaxed">
                  Dengan mendaftar, Anda menyetujui <a href="#" class="underline hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Syarat & Ketentuan</a>.
                </p>
              </form>

              <div class="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                Sudah punya akun? <a href="#" id="link-to-login" class="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors ml-1">Masuk di sini</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>\n\n`;

  html = html.substring(0, loginStart) + newContent + html.substring(registerEnd);
  fs.writeFileSync('index.html', html);
  console.log("Responsive auth views configured");
} else {
  console.log("Could not find start/end markers");
}

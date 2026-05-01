const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const loginStart = html.indexOf('<!-- Login Page (Hidden initially) -->');
const registerEnd = html.indexOf('<!-- App Wrapper (Hidden initially) -->');

if (loginStart > -1 && registerEnd > -1) {
  const newContent = `    <!-- Login Page (Hidden initially) -->
    <div id="view-login" class="hidden w-full min-h-screen bg-slate-50 dark:bg-[#070B19]">
      <div class="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        
        <!-- Left Side: Abstract Design -->
        <div class="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0A0F1F] p-12">
          <!-- Abstract Blobs -->
          <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
          <div class="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen"></div>
          
          <div class="relative z-10 flex items-center gap-3 cursor-pointer group" onclick="document.getElementById('view-login').classList.remove('flex'); document.getElementById('view-login').classList.add('hidden'); document.getElementById('view-landing').classList.remove('hidden'); document.getElementById('view-landing').classList.add('flex', 'flex-col');">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(59,130,246,0.5)] text-xl group-hover:scale-105 transition-transform">
              J
            </div>
            <span class="text-xl font-bold text-white tracking-wide">jagoCV</span>
          </div>

          <div class="relative z-10 max-w-lg">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-sm">
              <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Selamat Datang Kembali
            </div>
            <h1 class="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">Lanjutkan <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">perjalanan karir</span> Anda.</h1>
            <p class="text-slate-400 text-lg leading-relaxed">Masuk ke jagoCV untuk mengelola portofolio, mengedit CV, dan menemukan peluang baru. Kami siap membantu Anda menonjol.</p>
          </div>

          <div class="relative z-10 text-slate-500 text-sm flex items-center gap-4">
            &copy; 2026 jagoCV AI
            <span class="w-1 h-1 rounded-full bg-slate-700"></span>
            <a href="#" class="hover:text-slate-300 transition-colors">Bantuan</a>
          </div>
        </div>

        <!-- Right Side: Login Form -->
        <div class="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-[#070B19]">
          <div class="w-full max-w-md animate-[slideUp_0.5s_ease_forwards]">
            <!-- Mobile Brand -->
            <div class="flex lg:hidden items-center justify-center gap-3 mb-10 cursor-pointer" onclick="document.getElementById('view-login').classList.remove('flex'); document.getElementById('view-login').classList.add('hidden'); document.getElementById('view-landing').classList.remove('hidden'); document.getElementById('view-landing').classList.add('flex', 'flex-col');">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <span class="text-xl font-bold text-slate-900 dark:text-white tracking-wide">jagoCV</span>
            </div>

            <div class="mb-10 text-center">
              <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Masuk ke Akun</h2>
              <p class="text-slate-500 dark:text-slate-400">Senang melihat Anda kembali!</p>
            </div>

            <!-- Login Output Wrapper -->
            <div class="space-y-6">
              <button id="btn-login-google" class="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-sm">
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

              <form class="space-y-4" onsubmit="event.preventDefault();">
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input type="email" class="w-full bg-slate-50 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:bg-white dark:focus:bg-slate-900" placeholder="nama@email.com">
                </div>
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                    <a href="#" class="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">Lupa Password?</a>
                  </div>
                  <input type="password" class="w-full bg-slate-50 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:bg-white dark:focus:bg-slate-900" placeholder="••••••••">
                </div>
                
                <button type="submit" id="btn-login-submit" class="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-slate-900/10 dark:shadow-none mt-4">
                  Masuk Sekarang
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </form>

              <div class="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                Belum punya akun? <a href="#" id="link-to-register" class="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">Daftar sekarang</a>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>


    <!-- Register Page (Hidden initially) -->
    <div id="view-register" class="hidden w-full min-h-screen bg-slate-50 dark:bg-[#070B19]">
      <div class="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        
        <!-- Left Side: Register Form -->
        <div class="flex items-center justify-center p-6 sm:p-12 bg-white dark:bg-[#070B19] order-2 lg:order-1 relative z-10 border-r border-slate-200 dark:border-slate-800/50">
          <div class="w-full max-w-lg animate-[slideUp_0.5s_ease_forwards]">
            <!-- Mobile Brand -->
            <div class="flex lg:hidden items-center justify-center gap-3 mb-10 cursor-pointer" onclick="document.getElementById('view-register').classList.remove('flex'); document.getElementById('view-register').classList.add('hidden'); document.getElementById('view-landing').classList.remove('hidden'); document.getElementById('view-landing').classList.add('flex', 'flex-col');">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                J
              </div>
              <span class="text-xl font-bold text-slate-900 dark:text-white tracking-wide">jagoCV</span>
            </div>

            <div class="mb-8 text-center">
              <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Buat Akun Gratis</h2>
              <p class="text-slate-500 dark:text-slate-400">Bergabunglah dengan ribuan profesional lainnya.</p>
            </div>

            <!-- Form Wrapper -->
            <div class="space-y-6">
              <button id="btn-register-google" class="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-sm">
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Daftar dengan Google
              </button>

              <div class="relative flex items-center py-2">
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span class="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-sm font-medium">atau gunakan email</span>
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <form class="space-y-4" onsubmit="event.preventDefault();">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Depan</label>
                    <input type="text" class="w-full bg-slate-50 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:bg-white dark:focus:bg-slate-900" placeholder="Budi">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Belakang</label>
                    <input type="text" class="w-full bg-slate-50 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:bg-white dark:focus:bg-slate-900" placeholder="Setiawan">
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input type="email" class="w-full bg-slate-50 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:bg-white dark:focus:bg-slate-900" placeholder="nama@email.com">
                </div>
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
                  <input type="password" class="w-full bg-slate-50 dark:bg-[#0B1221] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all focus:bg-white dark:focus:bg-slate-900" placeholder="Minimal 8 karakter">
                </div>
                
                <button type="submit" id="btn-register-submit" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-indigo-500/20 mt-4">
                  Daftar Sekarang
                  <svg class="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
                </button>
                
                <p class="text-xs text-center text-slate-500 mt-4">
                  Dengan mendaftar, Anda menyetujui <a href="#" class="underline font-medium hover:text-slate-800 dark:hover:text-slate-300">Syarat & Ketentuan</a> serta <a href="#" class="underline font-medium hover:text-slate-800 dark:hover:text-slate-300">Kebijakan Privasi</a> kami.
                </p>
              </form>

              <div class="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                Sudah punya akun? <a href="#" id="link-to-login" class="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">Masuk di sini</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Benefits / Abstract -->
        <div class="hidden lg:flex order-1 lg:order-2 flex-col relative overflow-hidden bg-gradient-to-br from-[#0c1222] to-slate-900 p-12 justify-center border-l-4 border-indigo-500/30">
          <!-- Abstract Blobs -->
          <div class="absolute top-[10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
          <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen"></div>

          <!-- Feature Bento Grid inside Register -->
          <div class="relative z-10 w-full max-w-lg mx-auto">
            <h3 class="text-4xl font-extrabold text-white mb-10 leading-tight">Satu akun untuk me-roket-kan <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">peluang karir Anda.</span></h3>
            
            <div class="grid gap-5">
              <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div class="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h4 class="text-white font-bold text-lg mb-1">Score ATS Maksimal</h4>
                  <p class="text-slate-400 text-sm leading-relaxed">Template CV yang dioptimalkan untuk menembus filter sistem HR otomatis (Applicant Tracking System) perusahaan besar.</p>
                </div>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div class="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                <div>
                  <h4 class="text-white font-bold text-lg mb-1">Penulisan Ditenagai AI</h4>
                  <p class="text-slate-400 text-sm leading-relaxed">Asisten kecerdasan buatan membantu merangkai kalimat profesional, memoles deskripsi pengalaman, dan menerjemahkan ke bahasa Inggris.</p>
                </div>
              </div>

              <div class="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div class="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                </div>
                <div>
                  <h4 class="text-white font-bold text-lg mb-1">Web Portfolio Instan</h4>
                  <p class="text-slate-400 text-sm leading-relaxed">Hanya dengan satu klik, konversi CV Anda menjadi tautan web portofolio interaktif yang siap dibagikan ke perekrut.</p>
                </div>
              </div>
            </div>
            
            <div class="mt-8 flex items-center gap-4 border-t border-white/10 pt-8">
              <div class="flex -space-x-3">
                <img src="https://i.pravatar.cc/100?img=1" class="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" alt="User">
                <img src="https://i.pravatar.cc/100?img=2" class="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" alt="User">
                <img src="https://i.pravatar.cc/100?img=3" class="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" alt="User">
                <div class="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 text-white flex items-center justify-center text-xs font-bold">+10k</div>
              </div>
              <p class="text-slate-400 text-sm">Bergabung dengan lebih dari <strong>10,000+</strong> pengguna bahagia di seluruh Indonesia.</p>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>\n\n`;

  html = html.substring(0, loginStart) + newContent + html.substring(registerEnd);
  fs.writeFileSync('index.html', html);
  console.log("Forms updated successfully");
} else {
  console.log("Could not find start/end markers");
}

const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
let ts = fs.readFileSync('src/main.ts', 'utf8');

// 1. Add Register to Landing Nav
const navLoginPattern = '<button id="btn-nav-login" class="text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white font-medium transition-colors">Masuk</button>';
const navRegPattern = '<button id="btn-nav-register" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">Daftar</button>';

if (!html.includes('btn-nav-register')) {
  html = html.replace(navLoginPattern, navLoginPattern + '\n            ' + navRegPattern);
}

// 2. Clone and modify login view to create register view
const loginStart = html.indexOf('<div id="view-login"');
const loginEnd = html.indexOf('<!-- App Wrapper (Hidden initially) -->');

if (loginStart > -1 && loginEnd > -1 && !html.includes('id="view-register"')) {
  let loginHtml = html.substring(loginStart, loginEnd);
  
  let registerHtml = loginHtml.replace('id="view-login"', 'id="view-register"');
  registerHtml = registerHtml.replace(/view-login/g, 'view-register');
  
  // Replace content texts
  registerHtml = registerHtml.replace('Selamat Datang Kembali', 'Buat Akun Baru');
  registerHtml = registerHtml.replace('Masuk untuk melanjutkan ke dashboard jagoCV.', 'Daftar untuk mulai membangun karier Anda bersama jagoCV.');
  
  // Change form fields
  const emailInput = '<div class="mb-5">';
  const nameInput = `<div class="mb-5">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                  <input type="text" placeholder="Masukkan nama lengkap Anda" class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1221] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div class="mb-5">`;
                
  registerHtml = registerHtml.replace('<div class="mb-5">', nameInput);
  
  // Button text
  registerHtml = registerHtml.replace('id="btn-login-submit" class="w-full py-3.5', 'id="btn-register-submit" class="w-full py-3.5');
  registerHtml = registerHtml.replace('Masuk ke Dashboard', 'Daftar Sekarang');
  
  // Social button
  registerHtml = registerHtml.replace('Masuk dengan Google', 'Daftar dengan Google');
  registerHtml = registerHtml.replace('id="btn-login-google"', 'id="btn-register-google"');
  
  // Add IDs to links so we can wire them up
  const originalLoginLink = '<p class="text-center text-slate-600 dark:text-slate-400 mt-8">Belum punya akun? <a href="#" id="link-to-register" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Daftar disini</a></p>';
  html = html.replace('<p class="text-center text-slate-600 dark:text-slate-400 mt-8">Belum punya akun? <a href="#" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Daftar disini</a></p>', originalLoginLink);
  
  registerHtml = registerHtml.replace('<p class="text-center text-slate-600 dark:text-slate-400 mt-8">Belum punya akun? <a href="#" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Daftar disini</a></p>', '<p class="text-center text-slate-600 dark:text-slate-400 mt-8">Sudah punya akun? <a href="#" id="link-to-login" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Masuk disini</a></p>');
  
  // Also fix the link in the newly added one (if the replace failed to catch)
  registerHtml = registerHtml.replace('id="link-to-register"', 'id="link-to-login"');
  registerHtml = registerHtml.replace('Belum punya akun?', 'Sudah punya akun?');
  registerHtml = registerHtml.replace('Daftar disini', 'Masuk disini');

  html = html.substring(0, loginEnd) + '\n    <!-- Register Page (Hidden initially) -->\n    ' + registerHtml + '\n\n    ' + html.substring(loginEnd);
}

// 3. Update main.ts
if (!ts.includes('viewRegister')) {
  // Add declarations
  ts = ts.replace('const viewLogin = document.getElementById("view-login");', 'const viewLogin = document.getElementById("view-login");\n  const viewRegister = document.getElementById("view-register");');
  ts = ts.replace('const btnNavLogin = document.getElementById("btn-nav-login");', 'const btnNavLogin = document.getElementById("btn-nav-login");\n  const btnNavRegister = document.getElementById("btn-nav-register");');
  
  ts = ts.replace('const btnLoginGoogle = document.getElementById("btn-login-google");', 'const btnLoginGoogle = document.getElementById("btn-login-google");\n  const btnRegisterGoogle = document.getElementById("btn-register-google");\n  const btnRegisterSubmit = document.getElementById("btn-register-submit");\n  const linkToRegister = document.getElementById("link-to-register");\n  const linkToLogin = document.getElementById("link-to-login");');
  
  // Add functions and hooks
  const registerHooks = `
  function launchRegisterApp() {
       if (viewLanding) {
          viewLanding.classList.add("hidden");
          viewLanding.classList.remove("block", "flex-col");
       }
       if (viewLogin) {
          viewLogin.classList.add("hidden");
          viewLogin.classList.remove("flex");
       }
       if (viewRegister) {
          viewRegister.classList.remove("hidden");
          viewRegister.classList.add("flex");
       }
       window.scrollTo(0, 0);
  }

  if (btnNavRegister) {
      btnNavRegister.addEventListener("click", launchRegisterApp);
  }

  if (linkToRegister) {
      linkToRegister.addEventListener("click", (e) => {
          e.preventDefault();
          launchRegisterApp();
      });
  }

  if (linkToLogin) {
      linkToLogin.addEventListener("click", (e) => {
          e.preventDefault();
          launchLoginApp();
      });
  }

  if (btnRegisterSubmit) {
      btnRegisterSubmit.addEventListener("click", launchDashboardApp);
  }
  `;
  
  ts = ts.replace('if (btnNavLogin) {', registerHooks + '\n  if (btnNavLogin) {');
  
  // Update launchLoginApp to hide register view
  const loginHookFix = `
       if (viewRegister) {
          viewRegister.classList.add("hidden");
          viewRegister.classList.remove("flex");
       }`;
       
  ts = ts.replace('viewLogin.classList.add("flex");\n       }', 'viewLogin.classList.add("flex");\n       }' + loginHookFix);
}

fs.writeFileSync('index.html', html);
fs.writeFileSync('src/main.ts', ts);
console.log('Register page created');

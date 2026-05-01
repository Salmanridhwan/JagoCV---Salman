const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const cvTarget = `<button id="btn-create-cv" class="flex-1 bg-[#1E5EFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-sm">Buat CV ATS</button>
            <button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </button>`;

const cvReplace = `<button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button id="btn-create-cv" class="flex-1 bg-[#1E5EFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-sm">Buat CV ATS</button>`;

const resumeTarget = `<button id="btn-design-resume" class="flex-1 bg-[#1E5EFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-sm">Desain Resume</button>
            <button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>`;

const resumeReplace = `<button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button id="btn-design-resume" class="flex-1 bg-[#1E5EFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-sm">Desain Resume</button>`;

const portTarget = `<button id="btn-build-portfolio" class="flex-1 bg-[#1E5EFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-sm">Buat Portofolio</button>
            <button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50">
               <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </button>`;

const portReplace = `<button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button id="btn-build-portfolio" class="flex-1 bg-[#1E5EFF] hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all text-sm">Buat Portofolio</button>`;

if(html.includes(cvTarget)) html = html.replace(cvTarget, cvReplace);
if(html.includes(resumeTarget)) html = html.replace(resumeTarget, resumeReplace);
if(html.includes(portTarget)) html = html.replace(portTarget, portReplace);

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Reordered dashboard feature buttons');

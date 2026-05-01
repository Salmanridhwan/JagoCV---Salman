const fs = require('fs');
let ts = fs.readFileSync('src/main.ts', 'utf-8');

const themeSelectorScript = `
  // Make template options interactive
  const cvOptions = document.querySelectorAll('#cv-step-5 label');
  cvOptions.forEach(opt => {
     opt.addEventListener('click', () => {
         cvOptions.forEach(o => {
            o.className = "relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all";
            const check = o.querySelector('.w-5.h-5.rounded-full.border-2');
            if (check) check.innerHTML = "";
            if (check) check.className = "w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center shrink-0 text-white";
         });
         opt.className = "relative flex items-center justify-between p-4 border rounded-2xl border-blue-500 bg-blue-50 dark:bg-[#1E5EFF]/10 cursor-pointer overflow-hidden transition-all filter hover:brightness-110";
         const check = opt.querySelector('.w-5.h-5.rounded-full.border-2');
         if (check) {
            check.className = "w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center shrink-0 text-white";
            check.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
         }
     });
  });

  const resumeOptions = document.querySelectorAll('#resume-step-5 label');
  resumeOptions.forEach(opt => {
     opt.addEventListener('click', () => {
         resumeOptions.forEach(o => {
            o.className = "relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-50 dark:bg-[#0B1221]/50 cursor-pointer transition-all";
            const check = o.querySelector('.w-5.h-5.rounded-full.border-2');
            if (check) check.innerHTML = "";
            if (check) check.className = "w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center shrink-0 text-white";
         });
         opt.className = "relative flex items-center justify-between p-4 border rounded-2xl border-indigo-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer overflow-hidden transition-all";
         const check = opt.querySelector('.w-5.h-5.rounded-full.border-2');
         if (check) {
            check.className = "w-5 h-5 rounded-full border-2 border-indigo-500 bg-indigo-500 flex items-center justify-center shrink-0 text-white";
            check.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
         }
     });
  });

  const portfolioOptions = document.querySelectorAll('#portfolio-step-7 label');
  portfolioOptions.forEach(opt => {
     opt.addEventListener('click', () => {
         portfolioOptions.forEach(o => {
            o.className = "relative flex items-center justify-between p-4 border rounded-2xl border-slate-300 dark:border-slate-700 hover:border-slate-500 bg-slate-100 dark:bg-[#0B1221]/50 cursor-pointer transition-all";
            const check = o.querySelector('.w-5.h-5.rounded-full.border-2');
            if (check) check.innerHTML = "";
            if (check) check.className = "w-5 h-5 rounded-full border-2 border-slate-400 dark:border-slate-600 shrink-0 flex items-center justify-center text-white";
         });
         opt.className = "relative flex items-center justify-between p-4 border rounded-2xl border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 cursor-pointer overflow-hidden transition-all";
         const check = opt.querySelector('.w-5.h-5.rounded-full.border-2');
         if (check) {
            check.className = "w-5 h-5 rounded-full border-2 border-cyan-500 flex items-center justify-center shrink-0 text-white";
            check.innerHTML = '<div class="w-2.5 h-2.5 bg-cyan-500 rounded-full"></div>';
         }
     });
  });
`;

ts = ts.replace('// Input Mode Toggles Logic (CV)', themeSelectorScript + '\n  // Input Mode Toggles Logic (CV)');

fs.writeFileSync('src/main.ts', ts, 'utf-8');
console.log('Added Theme Selector interactivity.');

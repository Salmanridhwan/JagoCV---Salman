const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The three chat widgets have these specific markers:
// 1. bg-white/5 border border-indigo-500/30 (global chat)
// 2. bg-indigo-600/20 px-6 py-4 border-b border-indigo-500/30 (header)
// 3. bg-indigo-950/50 border border-indigo-500/20 (chat bubble)
// 4. bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 (quick actions)
// 5. p-4 bg-slate-100 dark:bg-[#0B1221]/50 border-t border-indigo-500/30 (input area box)

// Chat outer container (all of them have bg-white/5)
html = html.replace(/bg-white\/5 border border-indigo-500\/30/g, 'bg-slate-50 border border-indigo-200 dark:bg-white/5 dark:border-indigo-500/30');

// Chat header
html = html.replace(/bg-indigo-600\/20 px-6 py-4 border-b border-indigo-500\/30/g, 'bg-indigo-100 dark:bg-indigo-600/20 px-6 py-4 border-b border-indigo-200 dark:border-indigo-500/30');

// Header Text color (subtitle)
html = html.replace(/text-xs text-indigo-300/g, 'text-xs text-[#8f96fd] dark:text-indigo-300');

// Chat Bubble
html = html.replace(/bg-indigo-950\/50 border border-indigo-500\/20 p-4 rounded-2xl rounded-tl-none/g, 'bg-[#898eac] dark:bg-indigo-950/50 border-none dark:border-indigo-500/20 p-4 rounded-2xl rounded-tl-none');
html = html.replace(/text-[s]m text-slate-200/g, 'text-sm text-white dark:text-slate-200');

// Quick Actions
html = html.replace(/bg-indigo-600\/20 hover:bg-indigo-600\/40 text-indigo-300 text-xs font-medium rounded-xl border border-indigo-500\/30/g, 'bg-[#ded7ff] hover:bg-[#d0c6fa] dark:bg-indigo-600/20 dark:hover:bg-indigo-600/40 text-[#8f96fd] dark:text-indigo-300 text-xs font-medium rounded-xl border border-[#c4bdff] dark:border-indigo-500/30');

// Input Area outer box
html = html.replace(/p-4 bg-slate-100 dark:bg-\[#0B1221\]\/50 border-t border-indigo-500\/30/g, 'p-4 bg-slate-50 dark:bg-[#0B1221]/50 border-t border-indigo-200 dark:border-indigo-500/30');

// The input element itself inside chat
html = html.replace(/js-chat-input flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-800 dark:border-slate-700/g, 'js-chat-input flex-1 bg-white/50 dark:bg-slate-900 border border-slate-700 dark:border-slate-700');

// Wait, the input has border-slate-800, which looks too bold. It should be light grey border: border-slate-300
html = html.replace(/border border-slate-700 dark:border-slate-700/g, 'border border-slate-800 dark:border-slate-700'); 
// oops, let me just replace the input class again
html = html.replace(/js-chat-input flex-1 bg-white\/50 dark:bg-slate-900 border border-slate-800/g, 'js-chat-input flex-1 bg-white/50 dark:bg-slate-900 border border-slate-300');

// Specifically for the button in the input area
html = html.replace(/bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-300 transition-colors shadow-lg/g, 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-300 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-none');

fs.writeFileSync('index.html', html);
console.log('Chat UI updated.');

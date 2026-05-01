const fs = require('fs');

let ts = fs.readFileSync('src/main.ts', 'utf-8');

const targetBlockStart = `    const grid = document.getElementById("recent-docs-grid");
    const listBody = document.getElementById("recent-docs-list");
    
    if (grid && listBody) {`;

const renderFunctionText = `    const grid = document.getElementById("recent-docs-grid");
    const listBody = document.getElementById("recent-docs-list");
    
    window.showToast = (msg) => {
      const toast = document.createElement("div");
      toast.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-[slideInRight_0.3s_ease_forwards]";
      toast.innerHTML = \`<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span class="text-sm font-medium">\${msg}</span>\`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.replace("animate-[slideInRight_0.3s_ease_forwards]", "animate-[zoomOut_0.3s_ease_forwards]");
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };

    function renderDocs(filter) {
      if (!grid || !listBody) return;
      grid.innerHTML = \`
        <!-- Create Blank Card -->
        <div class="group relative bg-[#F8FAFC]/80 dark:bg-[#0a0f1c]/50 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl overflow-hidden aspect-[3/4] flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-blue-900/10" onclick="window.showToast('Membuat dokumen kosong baru...')">
          <div class="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          </div>
          <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Buat Kosong</span>
        </div>
      \`;
      listBody.innerHTML = "";

      const filteredDocs = filter === "Semua" ? data.recentDocs : data.recentDocs.filter(d => {
         if (filter === "CV ATS") return d.type === "ATS CV";
         if (filter === "Resume" || filter === "Visual Resume") return d.type === "Visual Resume";
         if (filter === "Web Portfolio") return d.type === "Web Portfolio";
         if (filter === "Cover Letter") return d.type === "Cover Letter";
         return false;
      });

      filteredDocs.forEach(doc => {
        let typeLabel = "Dokumen";
        if (doc.type === "ATS CV") typeLabel = "ATS CV";
        if (doc.type === "Visual Resume") typeLabel = "Resume";
        if (doc.type === "Web Portfolio") typeLabel = "Web Portfolio";

        const div = document.createElement("div");
        div.className = "group relative bg-white dark:bg-[#0B1221]/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden aspect-[3/4] flex flex-col";
        div.innerHTML = \`
          <div class="flex-1 bg-slate-50 dark:bg-[#070B19] p-4 relative overflow-hidden group-hover:bg-slate-100 dark:group-hover:bg-slate-800/30 transition-colors" onclick="window.showToast('Membuka ' + '\${doc.title}')">
            <!-- Simulated document UI -->
            <div class="w-full h-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded px-3 py-4 flex flex-col gap-2 opacity-80 pointer-events-none">
               \${doc.type === 'Web Portfolio' ? '<div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mb-2"></div>' : ''}
               <div class="w-1/2 h-2 \${doc.type === 'Web Portfolio' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-slate-300 dark:bg-slate-600'} rounded-full \${doc.type !== 'Web Portfolio' ? 'mx-auto' : ''}"></div>
               \${doc.type !== 'Web Portfolio' ? '<div class="w-1/3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>' : ''}
               <div class="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
               <div class="w-[90%] h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
               <div class="w-[80%] h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
               
               \${doc.type !== 'Web Portfolio' ? \`
               <div class="mt-4 w-1/3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
               <div class="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1"></div>
               <div class="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
               \` : ''}
            </div>
          </div>
          <!-- Context Menu Button -->
          <button class="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-blue-600 backdrop-blur-sm z-10" onclick="event.stopPropagation(); window.showToast('Menampilkan opsi menu...')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
          </button>
          <div class="p-3 bg-white dark:bg-[#0B1221] border-t border-slate-100 dark:border-slate-800/80 shrink-0">
            <h3 class="text-sm font-bold text-slate-800 dark:text-white truncate">\${doc.title}</h3>
            <p class="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
              <span>\${typeLabel}</span>
              <span>\${doc.date}</span>
            </p>
          </div>
        \`;
        grid.appendChild(div);

        // Populate table (list view)
        let badgeColor = "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
        if (doc.status === "Selesai") badgeColor = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
        if (doc.status === "Diterbitkan") badgeColor = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
        if (doc.status === "Draf") badgeColor = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";

        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer";
        tr.innerHTML = \`
          <td class="py-4 px-8" onclick="window.showToast('Membuka ' + '\${doc.title}')">
            <p class="font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">\${doc.title}</p>
            <p class="text-xs text-slate-500 mt-1 font-medium">\${doc.id}</p>
          </td>
          <td class="py-4 px-8" onclick="window.showToast('Membuka ' + '\${doc.title}')">
            <span class="text-sm text-slate-600 dark:text-slate-400 font-medium">\${doc.type}</span>
          </td>
          <td class="py-4 px-8" onclick="window.showToast('Membuka ' + '\${doc.title}')">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border \${badgeColor}">
              \${doc.status}
            </span>
          </td>
          <td class="py-4 px-8 text-sm text-slate-600 dark:text-slate-400 font-medium" onclick="window.showToast('Membuka ' + '\${doc.title}')">\${doc.date}</td>
          <td class="py-4 px-8 text-right">
            <button class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium text-sm" onclick="event.stopPropagation(); window.showToast('Mengedit ' + '\${doc.title}')">Edit</button>
          </td>
        \`;
        listBody.appendChild(tr);
      });
    }

    if (grid && listBody) {
       renderDocs("Semua");
       
       // Add filter click event handling
       const filterButtons = document.querySelectorAll(".hide-scrollbar button");
       filterButtons.forEach(btn => {
         btn.addEventListener("click", (e) => {
            // Un-active all
            filterButtons.forEach(b => {
               if(b === e.target) {
                  b.className = "px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium whitespace-nowrap transition-colors";
               } else if (b.textContent === e.target.textContent) {
                  b.className = "px-4 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium whitespace-nowrap transition-colors";
               } else {
                  if (b.className.includes("bg-slate-900")) {
                     b.className = "px-4 py-1.5 rounded-full bg-white/60 dark:bg-[#0B1221]/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium whitespace-nowrap transition-colors";
                  }
               }
            });
            renderDocs(e.target.textContent.trim());
         });
       });
`;

let endIndex = ts.indexOf('    }'); // End of the `if (grid && listBody)` block in main.ts
// specifically:
//      });
//    }
//
//    const btnGrid = document.getElementById("btn-view-grid");
const afterBlockMarker = '    const btnGrid = document.getElementById("btn-view-grid");';
let startIndex = ts.indexOf(targetBlockStart);
let endIndexReal = ts.indexOf(afterBlockMarker);

if (startIndex !== -1 && endIndexReal !== -1) {
    let replaced = ts.substring(0, startIndex) + renderFunctionText + "\n    }\n\n" + ts.substring(endIndexReal);
    fs.writeFileSync('src/main.ts', replaced, 'utf-8');
    console.log("src/main.ts updated successfully with interactive dots/edit and filters.");
} else {
    console.log("Could not find markers.", startIndex, endIndexReal);
}

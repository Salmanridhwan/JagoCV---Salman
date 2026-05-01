const fs = require('fs');

let ts = fs.readFileSync('src/main.ts', 'utf-8');

const jsLogic = `
  // Preview Gallery Logic
  const viewPreviewGallery = document.getElementById("view-preview-gallery");
  const btnBackPreviewGallery = document.getElementById("btn-back-preview-gallery");
  
  const tabGalleryCv = document.getElementById("tab-gallery-cv");
  const tabGalleryResume = document.getElementById("tab-gallery-resume");
  const tabGalleryPortfolio = document.getElementById("tab-gallery-portfolio");
  
  const contentGalleryCv = document.getElementById("gallery-content-cv");
  const contentGalleryResume = document.getElementById("gallery-content-resume");
  const contentGalleryPortfolio = document.getElementById("gallery-content-portfolio");

  const btnPreviewDashCv = document.getElementById("btn-preview-dash-cv");
  const btnPreviewDashResume = document.getElementById("btn-preview-dash-resume");
  const btnPreviewDashPortfolio = document.getElementById("btn-preview-dash-portfolio");

  function showGalleryTab(tabName) {
     if(!contentGalleryCv || !contentGalleryResume || !contentGalleryPortfolio) return;
     
     contentGalleryCv.classList.add("hidden");
     contentGalleryCv.classList.remove("block");
     contentGalleryResume.classList.add("hidden");
     contentGalleryResume.classList.remove("block");
     contentGalleryPortfolio.classList.add("hidden");
     contentGalleryPortfolio.classList.remove("block");

     tabGalleryCv.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
     tabGalleryResume.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
     tabGalleryPortfolio.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

     if(tabName === "cv") {
        contentGalleryCv.classList.remove("hidden");
        contentGalleryCv.classList.add("block");
        tabGalleryCv.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-[#1E5EFF] text-white shadow-lg shadow-blue-500/30";
     } else if(tabName === "resume") {
        contentGalleryResume.classList.remove("hidden");
        contentGalleryResume.classList.add("block");
        tabGalleryResume.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/30";
     } else if(tabName === "portfolio") {
        contentGalleryPortfolio.classList.remove("hidden");
        contentGalleryPortfolio.classList.add("block");
        tabGalleryPortfolio.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-cyan-600 text-white shadow-lg shadow-cyan-500/30";
     }
  }

  if (btnPreviewDashCv) {
     btnPreviewDashCv.addEventListener("click", () => {
        hideAllViews();
        if(viewPreviewGallery) showView(viewPreviewGallery);
        showGalleryTab("cv");
     });
  }

  if (btnPreviewDashResume) {
     btnPreviewDashResume.addEventListener("click", () => {
        hideAllViews();
        if(viewPreviewGallery) showView(viewPreviewGallery);
        showGalleryTab("resume");
     });
  }

  if (btnPreviewDashPortfolio) {
     btnPreviewDashPortfolio.addEventListener("click", () => {
        hideAllViews();
        if(viewPreviewGallery) showView(viewPreviewGallery);
        showGalleryTab("portfolio");
     });
  }

  if (btnBackPreviewGallery) {
     btnBackPreviewGallery.addEventListener("click", () => {
        hideAllViews();
        showView(viewDashboard);
     });
  }

  if(tabGalleryCv) tabGalleryCv.addEventListener("click", () => showGalleryTab("cv"));
  if(tabGalleryResume) tabGalleryResume.addEventListener("click", () => showGalleryTab("resume"));
  if(tabGalleryPortfolio) tabGalleryPortfolio.addEventListener("click", () => showGalleryTab("portfolio"));
`;

// Insert the JS logic right before the closing brace of the main DOMContentLoaded block if it exists
// or just at the end.
// Wait, I can append it to the end or inside the main IIFE or DOMContentLoaded listener.
// Let's see how main.ts is structured. I'll just append it to the file. It will run normally if things are scoped ok.
// Let's actually find the line where it closes the main block.
// Let's check the end of main.ts
const mainTsEnd = ts.substring(ts.length - 100);

if (ts.includes('}); // DOMContentLoaded end if exists')) {
   // not standard
}
// just append
ts += "\\n" + jsLogic + "\\n";

fs.writeFileSync('src/main.ts', ts, 'utf-8');
console.log('Added preview gallery JS');

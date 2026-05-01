const fs = require('fs');

let ts = fs.readFileSync('src/main.ts', 'utf-8');

// we need to insert the variables
const declarations = `
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
`;

let insertDeclarationsIdx = ts.indexOf('  const viewLanding = document.getElementById("view-landing");');
if(insertDeclarationsIdx !== -1) {
    ts = ts.substring(0, insertDeclarationsIdx) + declarations + ts.substring(insertDeclarationsIdx);
} else {
    // just put after `document.addEventListener("DOMContentLoaded", () => {`
    let docReadyStr = 'document.addEventListener("DOMContentLoaded", () => {';
    let docReadyIdx = ts.indexOf(docReadyStr);
    if(docReadyIdx !== -1) {
       let pos = docReadyIdx + docReadyStr.length;
       ts = ts.substring(0, pos) + '\\n' + declarations + ts.substring(pos);
    }
}

// now update hideAllViews
const hideAllStr = 'viewResumeResult, viewPortfolioResult, viewProfile, viewPricing';
const hideAllNew = 'viewResumeResult, viewPortfolioResult, viewProfile, viewPricing, viewPreviewGallery';
ts = ts.replace(hideAllStr, hideAllNew);

// now insert logic near btnCreateCv event listener
const btnCreateCvStr = `  if (btnCreateCv) {
    btnCreateCv.addEventListener("click", () => {`;

const logic = `
  function showGalleryTab(tabName) {
     if(!contentGalleryCv || !contentGalleryResume || !contentGalleryPortfolio) return;
     
     contentGalleryCv.classList.add("hidden");
     contentGalleryCv.classList.remove("block");
     contentGalleryResume.classList.add("hidden");
     contentGalleryResume.classList.remove("block");
     contentGalleryPortfolio.classList.add("hidden");
     contentGalleryPortfolio.classList.remove("block");

     if(tabGalleryCv) tabGalleryCv.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
     if(tabGalleryResume) tabGalleryResume.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
     if(tabGalleryPortfolio) tabGalleryPortfolio.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

     if(tabName === "cv") {
        contentGalleryCv.classList.remove("hidden");
        contentGalleryCv.classList.add("block");
        if(tabGalleryCv) tabGalleryCv.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-[#1E5EFF] text-white shadow-lg shadow-blue-500/30";
     } else if(tabName === "resume") {
        contentGalleryResume.classList.remove("hidden");
        contentGalleryResume.classList.add("block");
        if(tabGalleryResume) tabGalleryResume.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/30";
     } else if(tabName === "portfolio") {
        contentGalleryPortfolio.classList.remove("hidden");
        contentGalleryPortfolio.classList.add("block");
        if(tabGalleryPortfolio) tabGalleryPortfolio.className = "px-6 py-3 rounded-full text-sm font-bold transition-all bg-cyan-600 text-white shadow-lg shadow-cyan-500/30";
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

let btnCreateCvIdx = ts.indexOf(btnCreateCvStr);
if (btnCreateCvIdx !== -1) {
    ts = ts.substring(0, btnCreateCvIdx) + logic + ts.substring(btnCreateCvIdx);
} else {
    ts += '\\n' + logic + '\\n';
}

fs.writeFileSync('src/main.ts', ts, 'utf-8');
console.log('Fixed main.ts preview logic hookups');

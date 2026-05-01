// Gallery Tab Logic

export function bindGalleryEvents(): void {
  const tabGalleryCv = document.getElementById("tab-gallery-cv");
  const tabGalleryResume = document.getElementById("tab-gallery-resume");
  const tabGalleryPortfolio = document.getElementById("tab-gallery-portfolio");
  const contentGalleryCv = document.getElementById("content-gallery-cv");
  const contentGalleryResume = document.getElementById(
    "content-gallery-resume",
  );
  const contentGalleryPortfolio = document.getElementById(
    "content-gallery-portfolio",
  );

  function showGalleryTab(tabName: "cv" | "resume" | "portfolio"): void {
    if (!contentGalleryCv || !contentGalleryResume || !contentGalleryPortfolio)
      return;

    contentGalleryCv.classList.add("hidden");
    contentGalleryCv.classList.remove("block");
    contentGalleryResume.classList.add("hidden");
    contentGalleryResume.classList.remove("block");
    contentGalleryPortfolio.classList.add("hidden");
    contentGalleryPortfolio.classList.remove("block");

    if (tabGalleryCv)
      tabGalleryCv.className =
        "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
    if (tabGalleryResume)
      tabGalleryResume.className =
        "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";
    if (tabGalleryPortfolio)
      tabGalleryPortfolio.className =
        "px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

    if (tabName === "cv") {
      contentGalleryCv.classList.remove("hidden");
      contentGalleryCv.classList.add("block");
      if (tabGalleryCv)
        tabGalleryCv.className =
          "px-6 py-3 rounded-full text-sm font-bold transition-all bg-[#1E5EFF] text-white shadow-lg shadow-blue-500/30";
    } else if (tabName === "resume") {
      contentGalleryResume.classList.remove("hidden");
      contentGalleryResume.classList.add("block");
      if (tabGalleryResume)
        tabGalleryResume.className =
          "px-6 py-3 rounded-full text-sm font-bold transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/30";
    } else if (tabName === "portfolio") {
      contentGalleryPortfolio.classList.remove("hidden");
      contentGalleryPortfolio.classList.add("block");
      if (tabGalleryPortfolio)
        tabGalleryPortfolio.className =
          "px-6 py-3 rounded-full text-sm font-bold transition-all bg-cyan-600 text-white shadow-lg shadow-cyan-500/30";
    }
  }

  // Bind Dash Preview buttons
  const viewPreviewGallery = document.getElementById("view-preview-gallery");
  const viewDashboard = document.getElementById("view-dashboard");

  function hideAllViewsLocal() {
    // Basic local helper, relying on router for the complete function in reality
    const allViews = document.querySelectorAll('[id^="view-"]');
    allViews.forEach((v) => {
      v.classList.add("hidden");
      v.classList.remove("block");
    });
  }
  function showViewLocal(v: HTMLElement | null) {
    if (v) {
      v.classList.remove("hidden");
      v.classList.add("block");
    }
  }

  const btnPreviewDashCv = document.getElementById("btn-preview-dash-cv");
  const btnPreviewDashResume = document.getElementById(
    "btn-preview-dash-resume",
  );
  const btnPreviewDashPortfolio = document.getElementById(
    "btn-preview-dash-portfolio",
  );
  const btnBackPreviewGallery = document.getElementById(
    "btn-back-preview-gallery",
  );

  if (btnPreviewDashCv) {
    btnPreviewDashCv.addEventListener("click", () => {
      hideAllViewsLocal();
      showViewLocal(viewPreviewGallery);
      showGalleryTab("cv");
      window.scrollTo(0, 0);
    });
  }

  if (btnPreviewDashResume) {
    btnPreviewDashResume.addEventListener("click", () => {
      hideAllViewsLocal();
      showViewLocal(viewPreviewGallery);
      showGalleryTab("resume");
      window.scrollTo(0, 0);
    });
  }

  if (btnPreviewDashPortfolio) {
    btnPreviewDashPortfolio.addEventListener("click", () => {
      hideAllViewsLocal();
      showViewLocal(viewPreviewGallery);
      showGalleryTab("portfolio");
      window.scrollTo(0, 0);
    });
  }

  if (btnBackPreviewGallery) {
    btnBackPreviewGallery.addEventListener("click", () => {
      hideAllViewsLocal();
      showViewLocal(viewDashboard);
      window.scrollTo(0, 0);
    });
  }

  if (tabGalleryCv)
    tabGalleryCv.addEventListener("click", () => showGalleryTab("cv"));
  if (tabGalleryResume)
    tabGalleryResume.addEventListener("click", () => showGalleryTab("resume"));
  if (tabGalleryPortfolio)
    tabGalleryPortfolio.addEventListener("click", () =>
      showGalleryTab("portfolio"),
    );
}

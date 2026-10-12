import landingHtml from "../../html/landing.html?raw";
import loginHtml from "../../html/login.html?raw";
import registerHtml from "../../html/register.html?raw";
import profileHtml from "../../html/profile.html?raw";
import editProfileHtml from "../../html/edit-profile.html?raw";
import pricingHtml from "../../html/pricing.html?raw";
import pointHistoryHtml from "../../html/point-history.html?raw";
import dashboardHtml from "../../html/dashboard.html?raw";
import previewGalleryHtml from "../../html/preview-gallery.html?raw";
import createCvHtml from "../../html/create-cv.html?raw";
import designResumeHtml from "../../html/design-resume.html?raw";
import buildPortfolioHtml from "../../html/build-portfolio.html?raw";
import cvResultHtml from "../../html/cv-result.html?raw";
import resumeResultHtml from "../../html/resume-result.html?raw";
import portfolioResultHtml from "../../html/portfolio-result.html?raw";
import genericModalHtml from "../../html/generic-modal.html?raw";

export function injectHtmlTemplates() {
  const inject = (id: string, htmlString: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = htmlString;
    } else {
      console.warn(`Template injector could not find container for ID: ${id}`);
    }
  };

  inject("view-landing", landingHtml);
  inject("view-login", loginHtml);
  inject("view-register", registerHtml);
  inject("view-profile", profileHtml);
  inject("view-edit-profile", editProfileHtml);
  inject("view-pricing", pricingHtml);
  inject("view-point-history", pointHistoryHtml);
  inject("view-dashboard", dashboardHtml);
  inject("view-preview-gallery", previewGalleryHtml);
  inject("view-create-cv", createCvHtml);
  inject("view-design-resume", designResumeHtml);
  inject("view-build-portfolio", buildPortfolioHtml);
  inject("view-cv-result", cvResultHtml);
  inject("view-resume-result", resumeResultHtml);
  inject("view-portfolio-result", portfolioResultHtml);
  inject("generic-modal", genericModalHtml);
}

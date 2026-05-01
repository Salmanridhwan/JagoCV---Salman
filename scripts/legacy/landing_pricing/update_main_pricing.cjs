const fs = require('fs');
let ts = fs.readFileSync('src/main.ts', 'utf8');

// Add variable declarations
ts = ts.replace(
  'const viewPortfolioResult = document.getElementById("view-portfolio-result");',
  'const viewPortfolioResult = document.getElementById("view-portfolio-result");\n  const viewPricing = document.getElementById("view-pricing");'
);

ts = ts.replace(
  'const btnBackFromProfile = document.getElementById("btn-back-from-profile");',
  'const btnBackFromProfile = document.getElementById("btn-back-from-profile");\n  const btnUpgradePlan = document.getElementById("btn-upgrade-plan");\n  const btnBackFromPricing = document.getElementById("btn-back-from-pricing");'
);

// Add event listeners
const listeners = `
  if (btnUpgradePlan) {
    btnUpgradePlan.addEventListener("click", () => {
       hideAllViews();
       showView(viewPricing);
    });
  }

  if (btnBackFromPricing) {
    btnBackFromPricing.addEventListener("click", () => {
       hideAllViews();
       showView(viewProfile);
    });
  }
`;

ts = ts.replace(
  'if (btnBackFromProfile) {',
  listeners + '\n  if (btnBackFromProfile) {'
);

fs.writeFileSync('src/main.ts', ts);
console.log('Appended pricing routing');

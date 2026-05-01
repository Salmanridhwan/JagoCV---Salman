const fs = require('fs');
let ts = fs.readFileSync('src/main.ts', 'utf8');

ts = ts.replace(
  '[viewDashboard, viewCreateCv, viewDesignResume, viewBuildPortfolio, viewCvResult, viewResumeResult, viewPortfolioResult, viewProfile].forEach(view => {',
  '[viewDashboard, viewCreateCv, viewDesignResume, viewBuildPortfolio, viewCvResult, viewResumeResult, viewPortfolioResult, viewProfile, viewPricing].forEach(view => {'
);
fs.writeFileSync('src/main.ts', ts);
console.log('Done');

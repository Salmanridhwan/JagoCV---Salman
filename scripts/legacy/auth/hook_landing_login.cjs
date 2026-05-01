const fs = require('fs');
let ts = fs.readFileSync('src/main.ts', 'utf8');

const loginHook = `  if (btnNavLogin) {
      btnNavLogin.addEventListener("click", launchLoginApp);
  }
  
  const landingLoginBtns = document.querySelectorAll('.btn-landing-login');
  landingLoginBtns.forEach(btn => {
      btn.addEventListener("click", launchLoginApp);
  });
`;

ts = ts.replace('  if (btnNavLogin) {\n      btnNavLogin.addEventListener("click", launchLoginApp);\n  }', loginHook);

fs.writeFileSync('src/main.ts', ts);
console.log('Appended login hook for pricing buttons on landing page.');

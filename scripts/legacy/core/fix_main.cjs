const fs = require('fs');
let code = fs.readFileSync('src/main.ts', 'utf8');

code = code.replace(
  /function launchLoginApp\(\) \{[\s\S]*?(?=function launchRegisterApp)/, 
  `function launchLoginApp() {
     if (viewLanding) {
        viewLanding.classList.add("hidden");
        viewLanding.classList.remove("block", "flex-col");
     }
     if (viewLogin) {
        viewLogin.classList.remove("hidden");
        viewLogin.classList.add("flex");
     }
     if (viewRegister) {
        viewRegister.classList.add("hidden");
        viewRegister.classList.remove("flex");
     }
     if (appWrapper) {
        appWrapper.classList.add("hidden");
        appWrapper.classList.remove("flex");
     }
     window.scrollTo(0, 0);
  }

  `
);

code = code.replace(
  /function launchRegisterApp\(\) \{[\s\S]*?(?=if\s*\()/, 
  `function launchRegisterApp() {
     if (viewLanding) {
        viewLanding.classList.add("hidden");
        viewLanding.classList.remove("block", "flex-col");
     }
     if (viewLogin) {
        viewLogin.classList.add("hidden");
        viewLogin.classList.remove("flex");
     }
     if (viewRegister) {
        viewRegister.classList.remove("hidden");
        viewRegister.classList.add("flex");
     }
     if (appWrapper) {
        appWrapper.classList.add("hidden");
        appWrapper.classList.remove("flex");
     }
     window.scrollTo(0, 0);
  }

  `
);

fs.writeFileSync('src/main.ts', code);
console.log('Fixed main.ts launch functions');

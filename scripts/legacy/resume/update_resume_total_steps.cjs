const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Replace totalSteps in goToResumeStep
const targetFn = `function goToResumeStep(stepIndex) {
    document.querySelectorAll('.resume-step').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    });
    
    const targetStep = document.getElementById('resume-step-' + stepIndex);
    if (targetStep) {
      targetStep.classList.remove('hidden');
      targetStep.classList.add('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    }

    const totalSteps = 4;`;
    
const replacementFn = `function goToResumeStep(stepIndex) {
    document.querySelectorAll('.resume-step').forEach(el => {
      el.classList.add('hidden');
      el.classList.remove('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    });
    
    const targetStep = document.getElementById('resume-step-' + stepIndex);
    if (targetStep) {
      targetStep.classList.remove('hidden');
      targetStep.classList.add('block', 'animate-[slideInRight_0.4s_ease_forwards]');
    }

    const totalSteps = 5;`;

if(html.includes(targetFn)) {
  html = html.replace(targetFn, replacementFn);
  fs.writeFileSync('index.html', html, 'utf-8');
  console.log("Successfully updated totalSteps for goToResumeStep");
} else {
  console.log("targetFn not found");
}

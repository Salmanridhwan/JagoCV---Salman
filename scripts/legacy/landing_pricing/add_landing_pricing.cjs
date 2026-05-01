const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Extract pricing block
// We need exactly the `<div class="text-center...` and `<div class="grid...` blocks from the Pricing View
const pricingHeaderStart = html.indexOf('<div class="text-center max-w-3xl mx-auto mb-16">');
const pricingBlockEnd = html.indexOf('</div>\n        </div>\n      </div>\n\n      <!-- VIEW: DASHBOARD -->');

if (pricingHeaderStart === -1 || pricingBlockEnd === -1) {
  console.log("Could not find the pricing block source");
  process.exit(1);
}

const pricingContent = html.substring(pricingHeaderStart, pricingBlockEnd);

// Wrap it in a landing page section
const landingPricingSection = `
      <!-- Pricing Section -->
      <section id="pricing" class="py-24 relative overflow-hidden z-10 bg-slate-50 dark:bg-[#070B19]">
        <div class="max-w-7xl mx-auto px-6 relative">
          \${pricingContent}
        </div>
      </section>
`;

// Replace `<!-- FAQ Section -->` with our section + FAQ section
html = html.replace('<!-- FAQ Section -->', landingPricingSection.replace('${pricingContent}', pricingContent) + '\n      <!-- FAQ Section -->');

fs.writeFileSync('index.html', html);
console.log('Added pricing to landing page successfully');

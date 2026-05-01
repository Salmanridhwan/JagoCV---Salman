const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Insert Pricing into navigation
const navLinks = '<a href="#faq" class="hidden md:block text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white font-medium transition-colors">FAQ</a>';
html = html.replace(navLinks, '<a href="#pricing" class="hidden md:block text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white font-medium transition-colors">Harga</a>\n            ' + navLinks);

// The pricing section is between <!-- Pricing Section --> and <!-- FAQ Section -->
const pricingStartIdx = html.indexOf('<!-- Pricing Section -->');
const faqStartIdx = html.indexOf('<!-- FAQ Section -->');

if (pricingStartIdx !== -1 && faqStartIdx !== -1) {
    let pricingSection = html.substring(pricingStartIdx, faqStartIdx);

    // Modify the buttons inside landing pricing section to point to login page
    // Replace <button class="..." >Paket Anda Saat Ini</button> -> <button class="... btn-landing-login">Mulai Gratis</button>
    pricingSection = pricingSection.replace('Paket Anda Saat Ini</button>', 'Mulai Gratis</button>');
    pricingSection = pricingSection.replace('Pilih Pro</button>', 'Pilih Pro</button>');
    pricingSection = pricingSection.replace('Pilih Lifetime</button>', 'Pilih Lifetime</button>');
    
    // add an identifiable class to these buttons to wire up click events
    pricingSection = pricingSection.replace(/<button class="w-full py-3.5/g, '<button class="btn-landing-login w-full py-3.5');
    
    // We already have generic ID references, so we will use the class to attach event listeners
    
    html = html.substring(0, pricingStartIdx) + pricingSection + html.substring(faqStartIdx);
}

fs.writeFileSync('index.html', html);
console.log('Landing page navigation and pricing buttons updated');

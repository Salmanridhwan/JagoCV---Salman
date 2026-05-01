const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

const previewGalleryHTML = `
      <!-- VIEW: PREVIEW GALLERY -->
      <div id="view-preview-gallery" class="hidden animate-[fadeIn_0.5s_ease_forwards] w-full max-w-6xl mx-auto px-6 py-12">
        <div class="mb-10">
          <button id="btn-back-preview-gallery" class="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 font-medium text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Kembali ke Dasbor
          </button>
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">Galeri Pratinjau Format</h1>
          <p class="text-slate-600 dark:text-slate-400">Pilih format yang sesuai dengan tujuan karir Anda. Lihat contoh nyata dari setiap format di bawah ini.</p>
        </div>

        <!-- Format Selector Tabs -->
        <div class="flex flex-wrap gap-3 mb-10 pb-4 border-b border-slate-200 dark:border-slate-800">
          <button id="tab-gallery-cv" class="px-6 py-3 rounded-full text-sm font-bold transition-all bg-[#1E5EFF] text-white shadow-lg shadow-blue-500/30">CV Optimal ATS</button>
          <button id="tab-gallery-resume" class="px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">Resume Visual Modern</button>
          <button id="tab-gallery-portfolio" class="px-6 py-3 rounded-full text-sm font-bold transition-all bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">Portofolio Interaktif</button>
        </div>

        <!-- Galleries Container -->
        <div class="w-full relative min-h-[600px] flex items-start justify-center">
            
            <!-- Gallery: CV ATS -->
            <div id="gallery-content-cv" class="w-full block animate-[slideInUp_0.4s_ease_out]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div class="order-2 md:order-1 flex justify-center">
                  <div class="w-full max-w-[400px] aspect-[1/1.414] bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 flex flex-col gap-3 scale-95 sm:scale-100">
                    <div class="text-center border-b-2 border-slate-900 pb-3 mb-3">
                      <div class="text-xl font-bold text-slate-900 uppercase">Alexandra Smith</div>
                      <div class="text-[10px] text-slate-600">Software Engineer | alex@example.com | (555) 123-4567 | github.com/alex</div>
                    </div>
                    <div class="text-xs font-bold uppercase text-slate-800 mb-1 border-b border-slate-300 pb-1">Experience</div>
                    <div class="flex justify-between text-[10px] font-bold text-slate-900">
                      <span>Senior Backend Developer - TechCorp</span><span>2021 - Present</span>
                    </div>
                    <ul class="list-disc pl-4 text-[9px] text-slate-700 space-y-1 mb-2">
                       <li>Architected microservices leading to 40% reduction in server costs.</li>
                       <li>Led a team of 5 engineers to deliver the core payments API.</li>
                    </ul>
                    <div class="flex justify-between text-[10px] font-bold text-slate-900">
                      <span>Software Engineer - StartupInc</span><span>2018 - 2021</span>
                    </div>
                    <ul class="list-disc pl-4 text-[9px] text-slate-700 space-y-1">
                       <li>Developed the main React.js dashboard increasing user retention.</li>
                    </ul>
                    <div class="text-xs font-bold uppercase text-slate-800 mt-2 mb-1 border-b border-slate-300 pb-1">Education</div>
                    <div class="flex justify-between text-[10px] font-bold text-slate-900">
                      <span>B.S. Computer Science - State University</span><span>2014 - 2018</span>
                    </div>
                  </div>
                </div>
                <div class="order-1 md:order-2">
                   <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-[#1E253A] text-blue-700 dark:text-[#88A4E6] text-xs font-bold uppercase tracking-wider mb-4">Ramah ATS</div>
                   <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Sederhana Namun Kuat</h2>
                   <p class="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Format CV ini menghilangkan elemen desain yang tidak dapat dibaca oleh AI atau software rekrutmen. Struktur hirarkisnya memastikan pengalaman kerja Anda langsung diurai oleh Applicant Tracking Systems (ATS).</p>
                   <ul class="space-y-3 mb-8">
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> 100% Dapat dibaca mesin</li>
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Memenuhi standar industri Barat & Global</li>
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Tidak rentan terhadap korupsi format PDF</li>
                   </ul>
                   <button onclick="document.getElementById('btn-create-cv').click()" class="bg-[#1E5EFF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">Buat CV ATS Sekarang <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button>
                </div>
              </div>
            </div>

            <!-- Gallery: Resume -->
            <div id="gallery-content-resume" class="w-full hidden animate-[slideInUp_0.4s_ease_out]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div class="order-2 md:order-1 flex justify-center">
                  <div class="w-full max-w-[400px] aspect-[1/1.414] bg-slate-50 border border-slate-200 shadow-2xl flex scale-95 sm:scale-100 overflow-hidden">
                    <!-- Sidebar -->
                    <div class="w-[35%] bg-indigo-900 text-indigo-100 p-5 flex flex-col gap-4">
                       <div class="w-16 h-16 rounded-full bg-indigo-800 border-2 border-indigo-400 mx-auto"></div>
                       <div class="text-center">
                         <div class="text-sm font-bold text-white">Alex Smith</div>
                         <div class="text-[9px] text-indigo-300 mt-1">Creative Designer</div>
                       </div>
                       <div class="text-[9px] space-y-2 mt-4">
                         <div class="font-bold border-b border-indigo-700 pb-1 mb-2">CONTACT</div>
                         <div>📞 (555) 123-4567</div>
                         <div>✉️ alex@art.com</div>
                         <div>📍 New York, NY</div>
                       </div>
                       <div class="text-[9px] space-y-2 mt-4">
                         <div class="font-bold border-b border-indigo-700 pb-1 mb-2">SKILLS</div>
                         <div class="flex flex-wrap gap-1">
                           <span class="px-1.5 py-0.5 bg-indigo-800 rounded">Figma</span>
                           <span class="px-1.5 py-0.5 bg-indigo-800 rounded">Adobe CC</span>
                           <span class="px-1.5 py-0.5 bg-indigo-800 rounded">UI/UX</span>
                         </div>
                       </div>
                    </div>
                    <!-- Main -->
                    <div class="w-[65%] bg-white p-6 flex flex-col gap-4">
                       <div>
                         <div class="text-xs font-bold text-indigo-900 uppercase mb-1 tracking-wider inline-block border-b-2 border-indigo-500">Profile</div>
                         <p class="text-[8px] text-slate-600 leading-relaxed mt-1">Passionate designer with 5+ years of experience in crafting digital products that are both beautiful and functional. Proven track record in B2C applications.</p>
                       </div>
                       <div>
                         <div class="text-xs font-bold text-indigo-900 uppercase mb-2 tracking-wider inline-block border-b-2 border-indigo-500">Experience</div>
                         <div class="mb-3">
                           <div class="text-[10px] font-bold text-slate-900">Lead Designer</div>
                           <div class="text-[8px] text-indigo-600 mb-1">DesignStudio • 2020 - Present</div>
                           <ul class="text-[8px] text-slate-600 list-disc pl-3 space-y-0.5">
                             <li>Revamped the entire UI component library.</li>
                             <li>Collaborated with engineering to implement design tokens.</li>
                           </ul>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
                <div class="order-1 md:order-2">
                   <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">Resume Kreatif</div>
                   <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Tampil Menonjol & Visual</h2>
                   <p class="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Cocok untuk industri kreatif, startup, atau saat Anda mengirim dokumen langsung ke manusia (bukan sistem). Menggunakan tata letak grid, warna, dan elemen pemisah.</p>
                   <ul class="space-y-3 mb-8">
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Tipografi yang memukau</li>
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Pilihan warna tanpa batas</li>
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Mendukung foto profil</li>
                   </ul>
                   <button onclick="document.getElementById('btn-design-resume').click()" class="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">Desain Resume Sekarang <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button>
                </div>
              </div>
            </div>

            <!-- Gallery: Portfolio -->
            <div id="gallery-content-portfolio" class="w-full hidden animate-[slideInUp_0.4s_ease_out]">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div class="order-2 md:order-1 flex justify-center">
                  <div class="w-full max-w-[320px] h-[550px] bg-[#070B19] rounded-[40px] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col p-4">
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl"></div>
                    
                    <div class="flex-1 overflow-y-auto hide-scrollbar pt-6 pb-20">
                      <div class="flex flex-col items-center text-center mb-6">
                        <div class="w-20 h-20 rounded-full bg-cyan-900 border-2 border-cyan-400 mb-3 p-1">
                          <img src="https://ui-avatars.com/api/?name=JS&background=random" class="w-full h-full rounded-full" alt="Avatar"/>
                        </div>
                        <h3 class="text-white font-bold text-lg">Alex Smith</h3>
                        <p class="text-cyan-400 text-xs">Frontend Dev @ TechInc</p>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-slate-800/50 rounded-2xl p-3 border border-slate-700 aspect-square flex flex-col items-center justify-center gap-2">
                           <div class="text-2xl">🚀</div>
                           <span class="text-white text-[10px] font-bold">Proyek</span>
                        </div>
                        <div class="bg-slate-800/50 rounded-2xl p-3 border border-slate-700 aspect-square flex flex-col items-center justify-center gap-2">
                           <div class="text-2xl">✍️</div>
                           <span class="text-white text-[10px] font-bold">Blog</span>
                        </div>
                      </div>
                      
                      <div class="space-y-3">
                        <div class="bg-blue-600/20 rounded-2xl p-4 border border-blue-500/30">
                           <h4 class="text-white text-xs font-bold mb-1">Hubungi Saya</h4>
                           <p class="text-blue-200 text-[9px]">Mari bekerja sama di proyek selanjutnya.</p>
                        </div>
                        <div class="bg-slate-800/50 rounded-2xl p-3 border border-slate-700 flex items-center justify-between">
                           <span class="text-white text-xs">LinkedIn</span>
                           <div class="w-6 h-6 rounded-full bg-slate-700"></div>
                        </div>
                        <div class="bg-slate-800/50 rounded-2xl p-3 border border-slate-700 flex items-center justify-between">
                           <span class="text-white text-xs">GitHub</span>
                           <div class="w-6 h-6 rounded-full bg-slate-700"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="order-1 md:order-2">
                   <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">Web / Seluler</div>
                   <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Tautan di Bio & Portofolio</h2>
                   <p class="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Gabungkan proyek, tautan sosial, dan profil Anda menjadi satu halaman interaktif yang indah, dirancang khusus agar terlihat luar biasa di perangkat seluler (dan desktop).</p>
                   <ul class="space-y-3 mb-8">
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Mobile-first Bento UI</li>
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Hosting bawaan (salin & bagikan tautan)</li>
                     <li class="flex items-center gap-2 text-slate-700 dark:text-slate-300"><svg class="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Interaksi mikro animasi penuh</li>
                   </ul>
                   <button onclick="document.getElementById('btn-build-portfolio').click()" class="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">Buat Portofolio Sekarang <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg></button>
                </div>
              </div>
            </div>

        </div>
      </div>
`;

// Insert the gallery HTML right before VIEW: CREATE CV 
const cvComment = '<!-- VIEW: CREATE CV -->';
html = html.replace(cvComment, previewGalleryHTML + '\n      ' + cvComment);

// Add IDs to the pratinjau buttons
// Target CV Dashboard Pratinjau button:
html = html.replace(
  '<button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">\n              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>\n            </button>\n            <button id="btn-create-cv" class="flex-1 bg-[#1E5EFF]',
  '<button id="btn-preview-dash-cv" class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">\n              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>\n            </button>\n            <button id="btn-create-cv" class="flex-1 bg-[#1E5EFF]'
);

// Target Resume Dashboard Pratinjau button:
html = html.replace(
  '<button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">\n              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>\n            </button>\n            <button id="btn-design-resume" class="flex-1 bg-[#1E5EFF]',
  '<button id="btn-preview-dash-resume" class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">\n              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>\n            </button>\n            <button id="btn-design-resume" class="flex-1 bg-[#1E5EFF]'
);

// Target Portfolio Dashboard Pratinjau button:
html = html.replace(
  '<button class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">\n              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>\n            </button>\n            <button id="btn-build-portfolio" class="flex-1 bg-[#1E5EFF]',
  '<button id="btn-preview-dash-portfolio" class="w-[46px] h-[46px] flex items-center justify-center bg-transparent hover:bg-slate-800/80 rounded-xl text-slate-400 hover:text-slate-300 transition-colors border border-slate-200/10 dark:border-slate-700/50" title="Pratinjau">\n              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>\n            </button>\n            <button id="btn-build-portfolio" class="flex-1 bg-[#1E5EFF]'
);


fs.writeFileSync('index.html', html, 'utf-8');
console.log('Added preview gallery HTML and IDs');

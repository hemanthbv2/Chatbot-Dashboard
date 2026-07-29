const fs = require('fs');
const path = require('path');

const dir = 'd:\\hemanth bv\\Dashboard\\public\\rvcn-dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const backButtonHtml = `
        <div style="margin-top: auto; padding-bottom: 20px;">
            <a href="/" style="display:flex; align-items:center; gap:10px; padding:12px; color:var(--text); text-decoration:none; background:var(--primary); border-radius:8px; font-size:14px; font-weight:600; justify-content:center; transition:0.2s;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Master
            </a>
        </div>
        `;

for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if back button already exists, if not, add it
    if (!content.includes('Back to Master')) {
        if (content.includes('<div class="sidebar-footer">')) {
            content = content.replace('<div class="sidebar-footer">', backButtonHtml + '<div class="sidebar-footer">');
            console.log('Updated ' + file + ' (sidebar-footer)');
        } else if (content.includes('<div class="sf">')) {
            content = content.replace('<div class="sf">', backButtonHtml + '<div class="sf">');
            console.log('Updated ' + file + ' (sf)');
        }
        fs.writeFileSync(fullPath, content, 'utf8');
    } else {
        console.log('Already has button: ' + file);
    }
}

const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\HP\\Downloads\\rvcn with dash v1\\rvcn-chatbot';
const destDir = path.join(__dirname, 'plugins');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const institutes = [
    { 
        id: 'rvps', 
        name: 'RV Public School', 
        key: 'rvps_key_12345',
        oldId: 'rvcn',
        oldName: 'RV College of Nursing',
        oldKey: 'rvcn_key_12345'
    },
    { 
        id: 'rvghs', 
        name: 'RV Girls High School', 
        key: 'rvghs_key_12345',
        oldId: 'rvcn',
        oldName: 'RV College of Nursing',
        oldKey: 'rvcn_key_12345'
    }
];

function copyDirRecursive(src, dest, replacements) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        // Rename the main PHP file
        let destName = entry.name.replace('rvcn-chatbot.php', `${replacements.id}-chatbot.php`);
        let destPath = path.join(dest, destName);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath, replacements);
        } else {
            // Read file content
            let content = fs.readFileSync(srcPath);

            // Only apply string replacements to text files
            const ext = path.extname(srcPath);
            if (['.js', '.html', '.php', '.css'].includes(ext)) {
                let text = content.toString('utf8');

                // Apply replacements
                text = text.replace(new RegExp(replacements.oldId, 'g'), replacements.id); // rvcn -> rvps
                text = text.replace(new RegExp(replacements.oldId.toUpperCase(), 'g'), replacements.id.toUpperCase()); // RVCN -> RVPS
                text = text.replace(new RegExp(replacements.oldName, 'g'), replacements.name); // RV College of Nursing -> RV Public School
                text = text.replace(new RegExp(replacements.oldKey, 'g'), replacements.key); // API Key

                fs.writeFileSync(destPath, text, 'utf8');
            } else {
                // Copy binary files directly (like images)
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
}

for (let inst of institutes) {
    console.log(`Generating plugin for ${inst.name}...`);
    const instDestDir = path.join(destDir, `${inst.id}-chatbot`);
    copyDirRecursive(sourceDir, instDestDir, inst);
    console.log(`✅ Created at ${instDestDir}`);
}

console.log('All plugins generated successfully!');

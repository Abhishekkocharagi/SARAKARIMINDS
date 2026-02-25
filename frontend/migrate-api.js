const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('localhost:5000')) {
                console.log(`Updating ${fullPath}`);
                content = content.replace(/localhost:5000/g, '127.0.0.1:5000');
                fs.writeFileSync(fullPath, content);
            }
        }
    });
}

walk(srcDir);

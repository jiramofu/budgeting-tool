const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

let totalFixes = 0;

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Replace req.organizationId) with req.organizationId!) only where not already present
  content = content.replace(/(?<!!)req\.organizationId\)/g, 'req.organizationId!)');
  
  if (content !== originalContent) {
    const count = (content.match(/req\.organizationId!\)/g) || []).length - 
                  (originalContent.match(/req\.organizationId!\)/g) || []).length;
    if (count > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed ${file}: ${count} occurrences`);
      totalFixes += count;
    }
  }
});

console.log(`\nTotal fixes applied: ${totalFixes}`);

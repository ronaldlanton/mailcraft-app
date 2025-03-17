// This script removes problematic CSS selectors from the output CSS files
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to look for and remove
const problematicPatterns = [
  // Match selectors with HTML entities
  /\.\\\[\&amp\\;\S*\]\:\\S*\s*\{[^}]*\}/g,
  // Match the specific problematic class with &amp; in content
  /\&amp\;\s+svg\s*\{[^}]*\}/g
];

// Find all CSS files in the build directory
const cssFiles = glob.sync(path.join(process.cwd(), '.next/static/css/*.css'));

console.log(`Found ${cssFiles.length} CSS files to process`);

cssFiles.forEach(file => {
  console.log(`Processing: ${file}`);
  let content = fs.readFileSync(file, 'utf8');
  
  // Keep original length for comparison
  const originalLength = content.length;
  
  // Replace each problematic pattern
  problematicPatterns.forEach(pattern => {
    content = content.replace(pattern, '');
  });
  
  // Write back to the file if changes were made
  if (content.length !== originalLength) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned problematic patterns from: ${file}`);
  } else {
    console.log(`No problematic patterns found in: ${file}`);
  }
});

console.log('CSS cleaning completed.'); 
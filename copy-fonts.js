// Script to copy all fonts from @expo paths to a flat /fonts/ directory
const fs = require('fs');
const path = require('path');

const webappDir = path.join(__dirname, 'server', 'webapp');
const fontsDir = path.join(webappDir, 'fonts');

// Create fonts dir
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Recursively find all .ttf files
function findFiles(dir, ext) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(findFiles(full, ext));
      } else if (item.endsWith(ext)) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

// Find all .ttf files under webapp/assets
const ttfFiles = findFiles(path.join(webappDir, 'assets'), '.ttf');

console.log(`Found ${ttfFiles.length} font files:`);

// Build a map of filename -> original relative path (from webapp root)
const fontMap = {};
for (const file of ttfFiles) {
  const basename = path.basename(file);
  const relPath = file.replace(webappDir, '').replace(/\\/g, '/');
  fontMap[basename] = relPath;
  
  // Copy to flat fonts/ dir
  const dest = path.join(fontsDir, basename);
  fs.copyFileSync(file, dest);
  console.log(`  ${basename} -> /fonts/${basename}`);
  console.log(`  (was: ${relPath})`);
}

// Save the mapping for the server middleware
const mapFile = path.join(webappDir, 'fonts', '_font_map.json');
fs.writeFileSync(mapFile, JSON.stringify(fontMap, null, 2));
console.log(`\nFont map saved to ${mapFile}`);
console.log('Done!');

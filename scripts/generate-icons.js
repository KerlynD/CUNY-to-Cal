const fs = require('fs');
const path = require('path');

// This script helps you generate the required icon sizes for your Chrome extension
// You'll need to install a package to resize images, or manually resize them

console.log('🎨 CUNY-to-Cal Icon Generator');
console.log('============================\n');

const sourceIcon = path.join(__dirname, '../src/icons/cunytocal.png');
const iconsDir = path.join(__dirname, '../src/icons');

// Check if source icon exists
if (!fs.existsSync(sourceIcon)) {
  console.error('❌ Source icon not found at:', sourceIcon);
  process.exit(1);
}

console.log('✅ Found source icon:', sourceIcon);

const requiredSizes = [
  { size: 16, name: 'cunytocal-16.png', description: 'Extension management page' },
  { size: 48, name: 'cunytocal-48.png', description: 'Extension management page & extensions page' },
  { size: 128, name: 'cunytocal-128.png', description: 'Installation & Chrome Web Store' }
];

console.log('\n📋 Required icon sizes for Chrome Extension:');
requiredSizes.forEach(({ size, name, description }) => {
  console.log(`   ${size}x${size}px - ${name} - ${description}`);
});

console.log('\n🔧 To generate these icons, you have several options:');
console.log('\n1. 📐 ONLINE TOOL (Recommended):');
console.log('   • Visit: https://www.iloveimg.com/resize-image');
console.log('   • Upload your cunytocal.png');
console.log('   • Resize to each required size');
console.log('   • Save as cunytocal-16.png, cunytocal-48.png, cunytocal-128.png');

console.log('\n2. 🎨 PHOTOSHOP/GIMP:');
console.log('   • Open cunytocal.png');
console.log('   • Use "Export As" or "Save for Web"');
console.log('   • Create each size manually');

console.log('\n3. 💻 COMMAND LINE (if you have ImageMagick):');
console.log('   magick cunytocal.png -resize 16x16 cunytocal-16.png');
console.log('   magick cunytocal.png -resize 48x48 cunytocal-48.png');
console.log('   magick cunytocal.png -resize 128x128 cunytocal-128.png');

console.log('\n4. 🌐 ONLINE FAVICON GENERATOR:');
console.log('   • Visit: https://favicon.io/favicon-converter/');
console.log('   • Upload your image and download the generated sizes');

console.log('\n📁 Save all generated icons in: src/icons/');
console.log('\n🚀 After creating the icons, run: npm run build');

// Check if the required icons already exist
console.log('\n📊 Current icon status:');
requiredSizes.forEach(({ name }) => {
  const iconPath = path.join(iconsDir, name);
  const exists = fs.existsSync(iconPath);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${name} ${exists ? '(exists)' : '(missing)'}`);
});

console.log('\n💡 Pro tip: Keep your original cunytocal.png as the source file!');
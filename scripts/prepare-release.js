const fs = require('fs');
const path = require('path');

console.log('🚀 CUNY to Calendar - Release Preparation');
console.log('========================================\n');

// Read package.json to get version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`📦 Preparing release for version: ${version}`);

// Check if all required files exist
const requiredFiles = [
  'cuny-to-cal.zip',
  'README.md',
  'LICENSE',
  'CHANGELOG.md',
  'PUBLISHING.md'
];

console.log('\n📋 Checking required files:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check icon files
console.log('\n🎨 Checking icon files:');
const iconFiles = [
  'src/icons/cunytocal.png',
  'src/icons/cunytocal-16.png',
  'src/icons/cunytocal-48.png',
  'src/icons/cunytocal-128.png'
];

iconFiles.forEach(file => {
  const exists = fs.existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check if dist folder exists and has content
console.log('\n🏗️ Checking build output:');
const distExists = fs.existsSync('dist');
const manifestExists = fs.existsSync('dist/manifest.json');
const iconsExist = fs.existsSync('dist/icons');

console.log(`   ${distExists ? '✅' : '❌'} dist/ directory`);
console.log(`   ${manifestExists ? '✅' : '❌'} dist/manifest.json`);
console.log(`   ${iconsExist ? '✅' : '❌'} dist/icons/`);

if (distExists && fs.existsSync('cuny-to-cal.zip')) {
  const stats = fs.statSync('cuny-to-cal.zip');
  const sizeKB = Math.round(stats.size / 1024);
  console.log(`   ✅ cuny-to-cal.zip (${sizeKB}KB)`);
}

// Release checklist
console.log('\n📝 Release Checklist:');
console.log('   □ Run tests: npm run ci-test');
console.log('   □ Build extension: npm run build');
console.log('   □ Create package: npm run zip');
console.log('   □ Test extension manually in Chrome');
console.log('   □ Update CHANGELOG.md if needed');
console.log('   □ Commit all changes: git add . && git commit');
console.log('   □ Push to GitHub: git push origin main');
console.log('   □ Create GitHub release with cuny-to-cal.zip');
console.log('   □ Submit to Chrome Web Store');

console.log('\n🌐 Publishing URLs:');
console.log('   📦 GitHub Releases: https://github.com/KerlynD/CUNY-to-Cal/releases');
console.log('   🏪 Chrome Web Store: https://chrome.google.com/webstore/devconsole/');

console.log('\n📖 Documentation:');
console.log('   📋 Full guide: See PUBLISHING.md');
console.log('   📝 Store listing: Copy description from PUBLISHING.md');
console.log('   📸 Screenshots: Take 1280x800px screenshots for store');

if (allFilesExist && distExists && manifestExists) {
  console.log('\n🎉 Ready for release! All required files are present.');
  console.log('📦 Package size and file count look good.');
  console.log('🚀 Follow the steps in PUBLISHING.md to complete the release.');
} else {
  console.log('\n⚠️ Missing required files. Please check the items marked with ❌');
  console.log('🔧 Run npm run build and npm run zip to generate missing files.');
}

console.log('\n💡 Quick start:');
console.log('   1. npm run ci-test    # Verify everything works');
console.log('   2. git add . && git commit -m "Release v' + version + '"');
console.log('   3. git push origin main');
console.log('   4. Create GitHub release at /releases/new');
console.log('   5. Upload cuny-to-cal.zip to Chrome Web Store');
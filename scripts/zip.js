const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createZip() {
  const distPath = path.join(__dirname, '..', 'dist');
  const outputPath = path.join(__dirname, '..', 'cuny-to-cal.zip');

  if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } 
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✅ Extension packaged successfully!`);
      console.log(`📦 File: cuny-to-cal.zip`);
      console.log(`📏 Size: ${sizeInMB} MB`);
      console.log(`📁 Files: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('❌ Error creating zip:', err);
      reject(err);
    });

    archive.pipe(output);

    archive.directory(distPath, false);

    archive.finalize();
  });
}

createZip().catch(err => {
  console.error('❌ Failed to create zip:', err);
  process.exit(1);
}); 
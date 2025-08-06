const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

async function createZip() {
  const distPath = path.join(__dirname, '..', 'dist');
  const outputPath = path.join(__dirname, '..', 'cuny-to-cal.zip');

  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Remove existing zip file
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // Create a file to stream archive data to
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Best compression
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

    // Pipe archive data to the file
    archive.pipe(output);

    // Add the entire dist directory to the zip
    archive.directory(distPath, false);

    // Finalize the archive
    archive.finalize();
  });
}

// Run the script
createZip().catch(err => {
  console.error('❌ Failed to create zip:', err);
  process.exit(1);
}); 
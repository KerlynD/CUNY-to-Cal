const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description) {
  console.log(`\n${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    process.exit(1);
  }
}

console.log('🧪 Testing CI/CD Pipeline Locally');
console.log('==================================');

// Install dependencies
console.log('\n📦 Installing dependencies...');
if (fs.existsSync('package-lock.json')) {
  console.log('✅ Found package-lock.json, using npm ci');
  runCommand('npm ci', 'Dependency installation');
} else {
  console.log('⚠️  No package-lock.json found, using npm install');
  runCommand('npm install', 'Dependency installation');
}

// Run all checks
runCommand('npm run type-check', 'Type checking');
runCommand('npm run lint', 'Linting');
runCommand('npm test', 'Unit tests');
runCommand('npm run test:e2e', 'E2E tests');
runCommand('npm run build', 'Building extension');
runCommand('npm run zip', 'Creating zip package');

console.log('\n✅ All CI/CD steps completed successfully!');
console.log('🚀 Ready for deployment!');
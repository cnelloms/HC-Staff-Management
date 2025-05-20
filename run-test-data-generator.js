import { exec } from 'child_process';

// Run the stress test data generator with proper Node.js options
exec('node --experimental-specifier-resolution=node generate-test-data.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});
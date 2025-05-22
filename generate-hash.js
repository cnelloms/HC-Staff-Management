const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  // Use bcrypt.hashSync for simplicity in a script
  const hash = bcrypt.hashSync(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verify the hash works
  const isValid = bcrypt.compareSync(password, hash);
  console.log('Verification test:', isValid);
}

generateHash();

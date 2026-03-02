const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2b$10$QdtTFBsYugfbZpHkBTpeM./QeaZofL/JhHLPniP.aCEjZ6NiCTWk.';
  const password = 'admin123';
  const match = await bcrypt.compare(password, hash);
  console.log('Match:', match);
}

test();

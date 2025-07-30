const registerUser = require('./lib/registerUser');

(async () => {
  try {
    await registerUser({
      email: 'test@example.com',
      username: 'tesztfelhasznalo',
      password: 'jelszo123'
    });
    console.log('✅ Regisztráció sikeres');
  } catch (e) {
    console.error('❌ Hiba:', e.message);
    process.exit(1);
  }
})();

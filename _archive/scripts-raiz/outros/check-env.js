
require('dotenv').config();
console.log('--- ENV CHECK ---');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Not Set');
console.log('DB_HOST:', process.env.DB_HOST || 'Not Set');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'Not Set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not Set');

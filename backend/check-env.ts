import dotenv from 'dotenv';
dotenv.config();
console.log('--- ENV CHECK ---');
console.log('All available env vars:', Object.keys(process.env));
console.log('-----------------');
process.exit(0);

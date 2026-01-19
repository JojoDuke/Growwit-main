import dotenv from 'dotenv';
import path from 'path';

// Force load from the backend directory specifically
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('🌐 Environment Initialization...');
console.log('📍 CWD:', process.cwd());
console.log('🔑 GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Found' : '❌ MISSING');
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Found' : '❌ MISSING');

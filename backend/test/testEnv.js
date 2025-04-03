require('dotenv').config({ path: './.env' });

console.log('Full process.env:', process.env);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

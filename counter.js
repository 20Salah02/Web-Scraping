const fs = require('fs');

const FILE_NAME = '.txt';

const rawData = fs.readFileSync(FILE_NAME, 'utf-8');
const lines = rawData.split('\n').filter(line => line.trim() !== '');

const uniqueNumbers = new Set();

for (let line of lines) {
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const phone = parts[0].replace(/[\s\-().+]/g, '').trim();
    if (phone) uniqueNumbers.add(phone);
}

console.log(`✅ Total unique phone numbers: ${uniqueNumbers.size}`);

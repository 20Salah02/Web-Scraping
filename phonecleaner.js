const fs = require('fs');

const rawData = fs.readFileSync('restaurant_marrakech_data.txt', 'utf-8');
const lines = rawData.split('\n');

const cleaned = [];

for (let line of lines) {
    const parts = line.split(',');
    if (parts.length < 2) continue;

    let phone = parts[0].replace(/[\s\-().]/g, '').trim();
    const name = parts[1].trim();

    if (phone.startsWith('+212')) {
        phone = phone.slice(1); 
        cleaned.push(`${phone}, ${name}`);
    } else if (phone.startsWith('212')) {
        cleaned.push(`${phone}, ${name}`);
    } else if (phone.startsWith('06') || phone.startsWith('07')) {
        phone = `212${phone.slice(1)}`;
        cleaned.push(`${phone}, ${name}`);
    }
}

fs.writeFileSync('marrakesh_restaurants_data_clean.txt', cleaned.join('\n'), 'utf-8');

console.log(`✅ تم تنظيف ${cleaned.length} رقم، النتائج في Merzouga_hotel_data_clean.txt`);

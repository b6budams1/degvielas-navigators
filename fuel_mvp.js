const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'lv-LV,lv;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

async function scrape() {
    console.log("🎨 Projektējam datu struktūru...");
    let db = [];

    // --- RIMI ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?pageSize=40', { headers });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const price = $(el).find('.price-tag').text().trim().replace(/\s+/g, '');
            const img = $(el).find('img').attr('src');
            const date = $(el).find('.card__date').text().trim() || "Šonedēļ";
            if (name && price) db.push({ store: 'Rimi', name, price, img, date, cat: 'Pārtika' });
        });
        console.log("✅ Rimi ielādēts");
    } catch (e) { console.log("❌ Rimi kļūda"); }

    // --- LIDL ---
    try {
        const { data } = await axios.get('https://www.lidl.lv/lv/piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.ret-o-card').each((i, el) => {
            const name = $(el).find('.ret-o-card__headline').text().trim();
            const price = $(el).find('.ret-o-price-tag__price').text().trim().replace(',', '.') + "€";
            const img = $(el).find('img').attr('src');
            const date = $(el).find('.ret-o-card__content .n-o-m-label').text().trim() || "Šonedēļ";
            if (name && price) db.push({ store: 'Lidl', name, price, img, date, cat: 'Akcijas' });
        });
        console.log("✅ Lidl ielādēts");
    } catch (e) { console.log("❌ Lidl kļūda"); }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
    console.log(`🚀 Saglabātas ${db.length} preces ar bildēm un datumiem.`);
}

scrape();

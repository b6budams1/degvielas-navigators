const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept-Language': 'lv-LV,lv;q=0.9'
};

async function scrape() {
    console.log("🛠️ Sākam datu apkopi ar jaunākajiem selektoriem...");
    let db = [];

    // --- RIMI (Salabots cenas un bildes nolasītājs) ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?pageSize=80', { headers, timeout: 15000 });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            // Jaunais Rimi cenas formāts
            const priceWhole = $(el).find('.price-tag > span[aria-hidden="true"]').first().text().trim();
            const priceCents = $(el).find('.price-tag > sup[aria-hidden="true"]').text().trim() || '00';
            const unitPrice = $(el).find('.card__price-per').text().trim();
            
            let img = $(el).find('img').attr('src');
            if (img && img.includes('medium')) img = img.replace('medium', 'large');

            const date = $(el).find('.card__date').text().trim() || "Šonedēļ";

            if (name && priceWhole) {
                db.push({ 
                    store: 'Rimi', 
                    name, 
                    price: `${priceWhole},${priceCents}`, 
                    unit: unitPrice,
                    img, 
                    date 
                });
            }
        });
        console.log(`✅ Rimi: Atrasts ${db.length}`);
    } catch (e) { console.log("❌ Rimi kļūda (lapas izmaiņas)"); }

    // --- LIDL (Salabota adrese un struktūra) ---
    try {
        // Lidl tagad izmanto dinamiskas kampaņu lapas
        const { data } = await axios.get('https://www.lidl.lv/c/lv-LV/aktualie-piedavajumi', { headers, timeout: 15000 });
        const $ = cheerio.load(data);
        $('.product-grid-box').each((i, el) => {
            const name = $(el).find('.product-grid-box__title').text().trim();
            const priceText = $(el).find('.product-grid-box__price').text().trim();
            const img = $(el).find('img').attr('src');
            const date = "Piedāvājums spēkā";

            if (name && priceText) {
                // Notīram cenu no liekā teksta
                const cleanPrice = priceText.match(/\d+,\d+/);
                db.push({ 
                    store: 'Lidl', 
                    name, 
                    price: cleanPrice ? cleanPrice[0] : priceText, 
                    unit: '', 
                    img, 
                    date 
                });
            }
        });
        console.log(`✅ Lidl: Pievienots (Kopā: ${db.length})`);
    } catch (e) { console.log("❌ Lidl kļūda (jauna lapa)"); }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
    console.log(`🚀 DARBS PABEIGTS: ${db.length} akcijas saglabātas.`);
}

scrape();

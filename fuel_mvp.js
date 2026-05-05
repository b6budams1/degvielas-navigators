const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrape() {
    console.log("🕵️ Sākam akciju apkopošanu...");
    let db = [];

    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

    // --- BARBORA / MAXIMA (Visstabilākais avots) ---
    try {
        const { data } = await axios.get('https://www.barbora.lv/akcijas', { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        $('.b-product--item').each((i, el) => {
            const name = $(el).find('.b-product-title').text().trim();
            const price = $(el).find('.b-product-promo-current-price').text().trim();
            const img = $(el).find('img').attr('src');
            if (name && price) {
                db.push({ store: 'Maxima', name, price: price.replace(',', '.'), unit: 'Akcija', img, date: 'Šonedēļ' });
            }
        });
        console.log(`✅ Maxima: Atrasts ${db.length}`);
    } catch (e) { console.log("❌ Maxima kļūda"); }

    // --- RIMI ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?pageSize=40', { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const price = $(el).find('.price-tag').first().text().trim().replace(/\s+/g, '');
            const img = $(el).find('img').attr('src');
            if (name && price) {
                db.push({ store: 'Rimi', name, price: price.replace('€', ''), unit: 'Rimi akcija', img, date: 'Līdz svētdienai' });
            }
        });
        console.log(`✅ Rimi: Kopā tagad ${db.length}`);
    } catch (e) { console.log("❌ Rimi kļūda"); }

    // JA NEKAS NEATRODAS (Drošības spilvens) - ieliekam Tavas avenes kā pirmo preci
    if (db.length === 0) {
        db.push({
            store: 'Lidl',
            name: 'Svaigas avenes',
            price: '1,79',
            unit: '125 g iepakojums (14,32 €/kg)',
            img: 'https://sc01.alicdn.com/kf/A76c9db96a2504dd0ac38c476b4309173X.png',
            date: 'Akcija līdz 10.05'
        });
    }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
}
scrape();

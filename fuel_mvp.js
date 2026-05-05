const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'lv-LV,lv;q=0.9,en;q=0.8'
};

async function scrape() {
    console.log("🔍 Sākam datu vākšanu ar jauno Hibrīda metodi...");
    let db = [];

    // --- RIMI (Stabilā HTML metode) ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?pageSize=80', { headers });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const priceWhole = $(el).find('.price-tag > span[aria-hidden="true"]').first().text().trim();
            const priceCents = $(el).find('.price-tag > sup[aria-hidden="true"]').text().trim() || '00';
            const img = $(el).find('img').attr('src');
            
            if (name && priceWhole) {
                db.push({
                    store: 'Rimi',
                    name,
                    price: `${priceWhole},${priceCents}`,
                    unit: $(el).find('.card__price-per').text().trim() || 'gab',
                    img: img && img.includes('medium') ? img.replace('medium', 'large') : img,
                    date: "Akcija spēkā"
                });
            }
        });
        console.log(`✅ Rimi: Atrasts ${db.length}`);
    } catch (e) { console.log("❌ Rimi kļūda (HTML)"); }

    // --- BARBORA (Tiešais JSON kanāls) ---
    try {
        const { data } = await axios.get('https://barbora.lv/api/eshop/v1/promo/GetHomePromos', { headers });
        if (data.promotions) {
            data.promotions.forEach(p => {
                if (p.products) {
                    p.products.forEach(item => {
                        db.push({
                            store: 'Maxima',
                            name: item.title,
                            price: item.price.toString().replace('.', ','),
                            unit: item.measure || 'gab',
                            img: item.image,
                            date: "Akcija spēkā"
                        });
                    });
                }
            });
        }
        console.log(`✅ Maxima pievienota. Kopā: ${db.length}`);
    } catch (e) { console.log("❌ Maxima API kļūda"); }

    // --- LIDL ---
    try {
        const { data } = await axios.get('https://www.lidl.lv/lv/piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.product-grid-box').each((i, el) => {
            const name = $(el).find('.product-grid-box__title').text().trim();
            const price = $(el).find('.ods-price__value').text().trim();
            const img = $(el).find('img').attr('src');
            if (name && price) {
                db.push({
                    store: 'Lidl',
                    name,
                    price: price.replace('€', '').trim(),
                    unit: 'gab',
                    img,
                    date: "Akcija spēkā"
                });
            }
        });
        console.log(`✅ Lidl pievienots. Kopā: ${db.length}`);
    } catch (e) { console.log("❌ Lidl kļūda"); }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
    console.log(`🏁 FINIŠS: Saglabātas ${db.length} akcijas.`);
}

scrape();

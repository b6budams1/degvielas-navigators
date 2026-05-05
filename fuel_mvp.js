const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept-Language': 'lv-LV,lv;q=0.9'
};

async function scrape() {
    let db = [];

    // --- RIMI ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?pageSize=80', { headers });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            // Salabojam cenas nolasīšanu
            const priceWhole = $(el).find('.price-tag > span').first().text().trim();
            const priceCents = $(el).find('.price-tag > sup').text().trim() || '00';
            const unitPrice = $(el).find('.card__price-per').text().trim(); // piem. 2.49 €/kg
            
            let img = $(el).find('img').attr('src');
            if (img) img = img.replace('small', 'large').replace('medium', 'large'); // Mēģinām dabūt labāku kvalitāti

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
    } catch (e) { console.log("Rimi kļūda"); }

    // --- LIDL ---
    try {
        const { data } = await axios.get('https://www.lidl.lv/lv/piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.ret-o-card').each((i, el) => {
            const name = $(el).find('.ret-o-card__headline').text().trim();
            const price = $(el).find('.ret-o-price-tag__price').text().trim();
            const unit = $(el).find('.ret-o-price-tag__description').text().trim();
            const img = $(el).find('img').attr('src');
            const date = $(el).find('.n-o-m-label').first().text().trim() || "Akcija spēkā";

            if (name && price) db.push({ store: 'Lidl', name, price, unit, img, date });
        });
    } catch (e) { console.log("Lidl kļūda"); }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
    console.log(`✅ Savāktas ${db.length} preces`);
}

scrape();

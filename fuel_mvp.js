const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'lv-LV,lv;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function fetchAllDiscounts() {
    console.log("🔄 Sākam atjaunināto akciju apkopošanu...");
    let allPromotions = [];

    // --- RIMI (Jaunā adrese) ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            // Jaunais cenas selektors
            const priceWhole = $(el).find('.price-tag.card__price span').eq(0).text().trim();
            const priceCents = $(el).find('.price-tag.card__price sup').text().trim();
            if (name && priceWhole) {
                allPromotions.push({ store: 'Rimi', name, price: `${priceWhole}.${priceCents}€`, category: 'Pārtika' });
            }
        });
        console.log(`✅ Rimi: atrastas ${allPromotions.length} akcijas`);
    } catch (e) { console.log("⚠️ Rimi kļūda (lapas izmaiņas)"); }

    // --- BARBORA / MAXIMA ---
    try {
        const { data } = await axios.get('https://www.barbora.lv/akcijas', { headers });
        const $ = cheerio.load(data);
        $('.b-product-pyramid--item').each((i, el) => {
            const name = $(el).find('.b-product-title').text().trim();
            const price = $(el).find('.b-product-promo-current-price').text().trim();
            if (name && price) {
                allPromotions.push({ store: 'Maxima', name, price: price.replace('€', '').trim() + '€', category: 'Pārtika' });
            }
        });
        console.log(`✅ Maxima: kopā tagad ${allPromotions.length} akcijas`);
    } catch (e) { console.log("⚠️ Maxima kļūda"); }

    const output = {
        updatedAt: new Date().toISOString(),
        items: allPromotions
    };

    fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
    console.log(`🚀 DARBS PABEIGTS: Saglabātas ${allPromotions.length} akcijas!`);
}

fetchAllDiscounts();

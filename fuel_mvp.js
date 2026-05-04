const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' };

async function fetchAllDiscounts() {
    let allPromotions = [];

    // --- RIMI ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas?pageSize=80', { headers });
        const $ = cheerio.load(data);
        $('.js-product-container').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const price = $(el).find('.card__price-main').text().trim().replace('\n', '').replace(' ', '');
            if (name && price) allPromotions.push({ store: 'Rimi', name, price, category: 'Pārtika' });
        });
    } catch (e) { console.log("Rimi kļūda"); }

    // --- MAXIMA (Barbora) ---
    try {
        const { data } = await axios.get('https://www.barbora.lv/akcijas', { headers });
        const $ = cheerio.load(data);
        $('.b-product-pyramid--item').each((i, el) => {
            const name = $(el).find('.b-product-title').text().trim();
            const price = $(el).find('.b-product-promo-current-price').text().trim();
            if (name && price) allPromotions.push({ store: 'Maxima', name, price, category: 'Pārtika' });
        });
    } catch (e) { console.log("Barbora kļūda"); }

    // --- LIDL ---
    try {
        const { data } = await axios.get('https://www.lidl.lv/lv/piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.ret-o-card').each((i, el) => {
            const name = $(el).find('.ret-o-card__headline').text().trim();
            const price = $(el).find('.ret-o-price-tag__price').text().trim();
            if (name && price) allPromotions.push({ store: 'Lidl', name, price, category: 'Akcijas' });
        });
    } catch (e) { console.log("Lidl kļūda"); }

    fs.writeFileSync('data.json', JSON.stringify({
        updatedAt: new Date().toISOString(),
        items: allPromotions
    }, null, 2));
    console.log(`✅ Saglabātas ${allPromotions.length} akcijas!`);
}

fetchAllDiscounts();

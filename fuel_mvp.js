const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'lv-LV,lv;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function fetchAllDiscounts() {
    console.log("🔍 Sākam akciju meklēšanu...");
    let allPromotions = [];

    // --- RIMI ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi', { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const price = $(el).find('.price-tag.card__price').text().trim().replace(/\s+/g, ' ');
            if (name && price) allPromotions.push({ store: 'Rimi', name, price, category: 'Pārtika' });
        });
        console.log(`✅ Rimi: Atrasts ${allPromotions.length}`);
    } catch (e) { console.log("❌ Rimi neizdevās (bloķēts vai cita kļūda)"); }

    // --- MAXIMA (Barbora) ---
    try {
        const { data } = await axios.get('https://www.barbora.lv/akcijas', { headers, timeout: 10000 });
        const $ = cheerio.load(data);
        // Barbora jaunā UI selektori
        $('div[class*="product-card"]').each((i, el) => {
            const name = $(el).find('a[class*="break-words"]').text().trim();
            const price = $(el).find('span[class*="font-bold"]').first().text().trim();
            if (name && price) {
                allPromotions.push({ store: 'Maxima', name, price: price.replace(',', '.') + '€', category: 'Pārtika' });
            }
        });
        console.log(`✅ Maxima: Kopā tagad ${allPromotions.length}`);
    } catch (e) { console.log("❌ Maxima kļūda"); }

    const output = {
        updatedAt: new Date().toISOString(),
        items: allPromotions
    };

    fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
    console.log(`🏁 DARBS PABEIGTS: ${allPromotions.length} preces saglabātas.`);
}

fetchAllDiscounts();

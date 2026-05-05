const axios = require('axios');
const fs = require('fs');

async function scrape() {
    console.log("🚀 Sākam datu iegūšanu caur tiešajiem kanāliem...");
    let db = [];

    // --- RIMI (Izmantojam viņu iekšējo API) ---
    try {
        const rimiUrl = 'https://www.rimi.lv/e-veikals/lv/search/query?query=:relevance:allCategories:akcijas-piedavajumi&pageSize=80';
        const { data } = await axios.get(rimiUrl);
        
        if (data.results) {
            data.results.forEach(item => {
                db.push({
                    store: 'Rimi',
                    name: item.name,
                    price: item.price.value.toString().replace('.', ','),
                    unit: item.price.formattedValue.split(' ')[1] || 'gab',
                    img: item.images && item.images[0] ? 'https://www.rimi.lv' + item.images[0].url : '',
                    date: "Akcija spēkā"
                });
            });
        }
        console.log(`✅ Rimi: Ielādētas ${db.length} preces`);
    } catch (e) { console.log("❌ Rimi API kļūda"); }

    // --- LIDL (Jaunā kampaņu metode) ---
    try {
        const { data } = await axios.get('https://www.lidl.lv/c/lv-LV/aktualie-piedavajumi');
        const cheerio = require('cheerio');
        const $ = cheerio.load(data);
        
        $('.product-grid-box').each((i, el) => {
            const name = $(el).find('.product-grid-box__title').text().trim();
            const price = $(el).find('.ods-price__value').text().trim() || $(el).find('.product-grid-box__price').text().trim();
            const img = $(el).find('img').attr('src');
            
            if (name && price) {
                db.push({
                    store: 'Lidl',
                    name,
                    price: price.replace('€', '').trim(),
                    unit: 'gab',
                    img,
                    date: "Piedāvājums spēkā"
                });
            }
        });
        console.log(`✅ Lidl: Kopā tagad ${db.length} preces`);
    } catch (e) { console.log("❌ Lidl kļūda"); }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
    console.log(`🏁 DARBS PABEIGTS: Saglabātas ${db.length} akcijas.`);
}

scrape();

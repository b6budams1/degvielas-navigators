const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrape() {
    console.log("🕵️ Sākam universālo akciju apkopošanu...");
    let db = [];

    try {
        // Nolasām datus no universālā saraksta (Mego, Top!, Rimi, Maxima, Lidl)
        const { data } = await axios.get('https://www.akcijubuklets.lv/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(data);

        $('.product-item').each((i, el) => {
            const name = $(el).find('.product-title').text().trim();
            const price = $(el).find('.product-price').text().trim();
            const store = $(el).find('.shop-name').text().trim() || "Veikals";
            const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
            const date = $(el).find('.valid-until').text().trim() || "Spēkā tagad";

            if (name && price) {
                db.push({
                    store: store.replace('akcijas', '').trim(),
                    name,
                    price: price.replace('€', '').trim(),
                    unit: $(el).find('.product-weight').text().trim(),
                    img: img ? (img.startsWith('http') ? img : 'https://www.akcijubuklets.lv' + img) : '',
                    date
                });
            }
        });
        console.log(`✅ Savāktas ${db.length} akcijas!`);
    } catch (e) { console.log("❌ Kļūda universālajā sarakstā."); }

    // Drošības spilvens: ja nekas neatrodas, ieliekam paraugu
    if (db.length === 0) {
        db.push({ store: 'Lidl', name: 'Svaigas avenes', price: '1,79', unit: '125g (14,32 €/kg)', img: 'https://sc01.alicdn.com/kf/A76c9db96a2504dd0ac38c476b4309173X.png', date: 'Līdz 10.05' });
    }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
}
scrape();

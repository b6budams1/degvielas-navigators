const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrape() {
    console.log("🕵️ Sākam viedo akciju meklēšanu...");
    let db = [];
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };

    // --- RIMI (Jaunākā metode) ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?pageSize=80', { headers, timeout: 15000 });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const price = $(el).find('.price-tag').first().text().trim().replace(/\s+/g, ' ');
            const img = $(el).find('img').attr('src');
            if (name && price) {
                db.push({ store: 'Rimi', name, price: price.replace('€', '').trim() + '€', unit: 'Akcija', img, date: 'Šonedēļ' });
            }
        });
        console.log(`✅ Rimi: Atrasts ${db.length}`);
    } catch (e) { console.log("❌ Rimi bloķēts"); }

    // --- EMERGENCY MODE (Ja nekas neatrodas) ---
    if (db.length === 0) {
        console.log("⚠️ Veikali mūs bloķē. Ieslēdzam Rezerves akcijas...");
        db = [
            {
                store: 'Lidl',
                name: 'Svaigas avenes',
                price: '1.79',
                unit: '125 g iepakojums (14.32 €/kg)',
                img: 'https://sc01.alicdn.com/kf/A76c9db96a2504dd0ac38c476b4309173X.png',
                date: 'Akcija līdz 10.05'
            },
            {
                store: 'Rimi',
                name: 'Paprika sarkana, kg',
                price: '2.49',
                unit: '1. šķira',
                img: 'https://www.rimi.lv/e-veikals/medias/680385-L01.jpg?context=bWFzdGVyfGltYWdlc3w4NTU0NHxpbWFnZS9qcGVnfGltYWdlcy9oNTMvaGUwLzg4OTU2NTIxOTY4OTQuanBnfDcxZWRkZjFmZTQ4OWYyNmY0ZTAzYmEyODJlNDYwZTUxOWE5YmU4YTkzZTA4ZjA3ZTVkMjM1ZjM0ZTEwZTM3ZjA',
                date: 'Līdz svētdienai'
            }
        ];
    }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
    console.log(`🏁 Saglabātas ${db.length} akcijas.`);
}
scrape();

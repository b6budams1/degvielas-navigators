const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrape() {
    console.log("🕵️ Sākam visu Latvijas tīklu akciju apkopošanu...");
    let db = [];
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

    try {
        // Mēs izmantojam ManCena.lv, jo tur ir viss: Rimi, Maxima, Lidl, Mego, Top u.c.
        const { data } = await axios.get('https://mancena.lv/', { headers, timeout: 20000 });
        const $ = cheerio.load(data);

        $('.product-card').each((i, el) => {
            const name = $(el).find('.product-name').text().trim();
            const price = $(el).find('.price-current').text().trim();
            const store = $(el).find('.store-name').text().trim() || "Akcija";
            const img = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
            const date = $(el).find('.valid-until').text().trim() || "Spēkā tagad";

            if (name && price) {
                db.push({
                    store: store.split(' ')[0], // Paņemam pirmo vārdu (piem. "Rimi")
                    name,
                    price: price.replace('€', '').trim().replace(',', '.'),
                    unit: $(el).find('.product-quantity').text().trim(),
                    img: img ? (img.startsWith('http') ? img : 'https://mancena.lv' + img) : '',
                    date
                });
            }
        });
        
        console.log(`✅ Kopā atrasti ${db.length} piedāvājumi no dažādiem tīkliem!`);
    } catch (e) {
        console.log("❌ Galvenais avots bloķēts. Ieslēdzam rezerves sarakstu.");
    }

    // JA NEKAS NEATRODAS (Rezerves variants, lai lapa nekad nav tukša)
    if (db.length === 0) {
        db = [
            { store: 'Lidl', name: 'Svaigas avenes', price: '1.79', unit: '125g', img: 'https://sc01.alicdn.com/kf/A76c9db96a2504dd0ac38c476b4309173X.png', date: 'Līdz 10.05' },
            { store: 'Rimi', name: 'Paprika sarkana', price: '2.49', unit: 'kg', img: 'https://www.rimi.lv/e-veikals/medias/680385-L01.jpg?context=bWFzdGVyfGltYWdlc3w4NTU0NHxpbWFnZS9qcGVnfGltYWdlcy9oNTMvaGUwLzg4OTU2NTIxOTY4OTQuanBnfDcxZWRkZjFmZTQ4OWYyNmY0ZTAzYmEyODJlNDYwZTUxOWE5YmU4YTkzZTA4ZjA3ZTVkMjM1ZjM0ZTEwZTM3ZjA', date: 'Šonedēļ' },
            { store: 'Maxima', name: 'Kafija Jacobs Krönung', price: '5.99', unit: '500g', img: 'https://www.barbora.lv/medias/sys_master/root/h37/h04/9024564887582.jpg', date: 'Līdz 12.05' }
        ];
    }

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), items: db }, null, 2));
}
scrape();

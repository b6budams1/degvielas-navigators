const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'lv-LV,lv;q=0.9'
};

async function fetchAllDiscounts() {
    console.log("🚀 Sākam masveida akciju vākšanu...");
    let allPromotions = [];

    // --- RIMI (Jaunais kods) ---
    try {
        const { data } = await axios.get('https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.product-grid__item').each((i, el) => {
            const name = $(el).find('.card__name').text().trim();
            const priceEuro = $(el).find('.price-tag > span').first().text().trim();
            const priceCents = $(el).find('.price-tag > sup').text().trim();
            
            if (name && priceEuro) {
                allPromotions.push({ 
                    store: 'Rimi', 
                    name: name, 
                    price: `${priceEuro}.${priceCents}`, 
                    category: 'Pārtika' 
                });
            }
        });
        console.log(`✅ Rimi: Atrastas ${allPromotions.filter(i => i.store === 'Rimi').length} akcijas`);
    } catch (e) { console.log("❌ Rimi kļūda"); }

    // --- BARBORA / MAXIMA (Jaunais kods) ---
    try {
        const { data } = await axios.get('https://www.barbora.lv/akcijas', { headers });
        const $ = cheerio.load(data);
        // Barbora izmanto jaunu Next.js struktūru
        $('div[class*="product-card"]').each((i, el) => {
            const name = $(el).find('a[class*="break-words"]').text().trim();
            // Mēģinām atrast cenu dažādos veidos
            const price = $(el).find('span[class*="font-bold"]').first().text().trim();
            
            if (name && price && price.includes(',')) {
                allPromotions.push({ 
                    store: 'Maxima', 
                    name: name, 
                    price: price.replace(',', '.').replace('€', '').trim(), 
                    category: 'Pārtika' 
                });
            }
        });
        console.log(`✅ Maxima: Atrastas ${allPromotions.filter(i => i.store === 'Maxima').length} akcijas`);
    } catch (e) { console.log("❌ Maxima kļūda"); }

    // Saglabājam datus
    const finalData = {
        updatedAt: new Date().toISOString(),
        items: allPromotions
    };

    fs.writeFileSync('data.json', JSON.stringify(finalData, null, 2));
    console.log(`✨ Gatavs! Kopā saglabātas ${allPromotions.length} preces.`);
}

fetchAllDiscounts();

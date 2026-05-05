const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'lv-LV,lv;q=0.9'
};

async function fetchAllDiscounts() {
    console.log("🚀 Sākam lielo akciju vākšanu (Rimi, Maxima, Lidl)...");
    let allPromotions = [];

    // --- RIMI (Vairākas lapas) ---
    for (let page = 1; page <= 3; page++) {
        try {
            const { data } = await axios.get(`https://www.rimi.lv/e-veikals/lv/akcijas-piedavajumi?page=${page}&pageSize=80`, { headers, timeout: 15000 });
            const $ = cheerio.load(data);
            $('.product-grid__item').each((i, el) => {
                const name = $(el).find('.card__name').text().trim();
                const priceEuro = $(el).find('.price-tag > span').first().text().trim();
                const priceCents = $(el).find('.price-tag > sup').text().trim() || '00';
                if (name && priceEuro) allPromotions.push({ store: 'Rimi', name, price: `${priceEuro}.${priceCents}€`, category: 'Pārtika' });
            });
            console.log(`✅ Rimi: Lapā ${page} atrastas preces. Kopā: ${allPromotions.length}`);
        } catch (e) { console.log(`❌ Rimi lapa ${page} neizdevās`); break; }
    }

    // --- MAXIMA (Barbora tiešais API) ---
    try {
        // Izmantojam viltību - prasām Barborai datus formātā, ko viņi sūta savai mobilajai lietotnei
        const { data } = await axios.get('https://www.barbora.lv/api/eshop/v1/cart/getitems', { headers }); 
        // Ja API neļauj, mēģinām vēlreiz caur HTML ar jaunu selektoru
        const response = await axios.get('https://www.barbora.lv/akcijas', { headers });
        const $ = cheerio.load(response.data);
        $('.b-product--item, .product-card-next').each((i, el) => {
            const name = $(el).find('.b-product-title, a[class*="break-words"]').text().trim();
            const price = $(el).find('.b-product-promo-current-price, span[class*="font-bold"]').first().text().trim();
            if (name && price) allPromotions.push({ store: 'Maxima', name, price: price.replace(',', '.') + '€', category: 'Pārtika' });
        });
        console.log(`✅ Maxima pievienota. Kopā: ${allPromotions.length}`);
    } catch (e) { console.log("❌ Maxima kļūda"); }

    // --- LIDL ---
    try {
        const { data } = await axios.get('https://www.lidl.lv/lv/piedavajumi', { headers });
        const $ = cheerio.load(data);
        $('.ret-o-card').each((i, el) => {
            const name = $(el).find('.ret-o-card__headline').text().trim();
            const price = $(el).find('.ret-o-price-tag__price').text().trim();
            if (name && price) allPromotions.push({ store: 'Lidl', name, price: price.replace(',', '.') + '€', category: 'Akcijas' });
        });
        console.log(`✅ Lidl pievienots. Kopā: ${allPromotions.length}`);
    } catch (e) { console.log("❌ Lidl kļūda"); }

    const output = {
        updatedAt: new Date().toISOString(),
        items: allPromotions
    };

    fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
    console.log(`🏁 GATAVS! Datubāzē tagad ir ${allPromotions.length} akcijas.`);
}

fetchAllDiscounts();

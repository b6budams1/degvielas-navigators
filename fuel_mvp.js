const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' };

async function fetchPrices() {
    console.log("Sākam vākt datus...");
    const results = [];

    // Circle K
    try {
        const { data } = await axios.get('https://www.circlek.lv/degviela-miles/degvielas-cenas', { headers });
        const $ = cheerio.load(data);
        $('table tbody tr').each((i, el) => {
            const type = $(el).find('td').eq(0).text().trim();
            const price = parseFloat($(el).find('td').eq(1).text().trim().replace(' EUR', ''));
            if (type && price) results.push({ network: 'Circle K', type, price, address: 'Visā tīklā', lat: 56.95, lon: 24.1 });
        });
    } catch (e) { console.log("Circle K kļūda"); }

    // Virši
    try {
        const { data } = await axios.get('https://www.virsi.lv/lv/privatpersonam/degviela/degvielas-un-elektrouzlades-cenas', { headers });
        const $ = cheerio.load(data);
        $('.fuel-block .price-card').each((i, el) => {
            const type = $(el).find('.price span').eq(0).text().trim();
            const price = parseFloat($(el).find('.price span').eq(1).text().trim());
            const address = $(el).find('.address').text().trim();
            if (type && price) results.push({ network: 'Virši', type, price, address, lat: 56.92, lon: 24.05 });
        });
    } catch (e) { console.log("Virši kļūda"); }

    const output = { updatedAt: new Date().toISOString(), stations: results };
    fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
    console.log("Dati saglabāti!");
}

fetchPrices();

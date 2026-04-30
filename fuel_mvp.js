const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchPrices() {
    const results = [];
    // Circle K
    try {
        const { data } = await axios.get('https://www.circlek.lv/degviela-miles/degvielas-cenas');
        const $ = cheerio.load(data);
        $('table tbody tr').each((i, el) => {
            const type = $(el).find('td').eq(0).text().trim();
            const price = parseFloat($(el).find('td').eq(1).text().trim().replace(' EUR', ''));
            if (type && price) results.push({ network: 'Circle K', type, price, address: 'Visā tīklā', lat: 56.95, lon: 24.1 });
        });
    } catch (e) {}
    // Virši
    try {
        const { data } = await axios.get('https://www.virsi.lv/lv/privatpersonam/degviela/degvielas-un-elektrouzlades-cenas');
        const $ = cheerio.load(data);
        $('.fuel-block .price-card').each((i, el) => {
            const type = $(el).find('.price span').eq(0).text().trim();
            const price = parseFloat($(el).find('.price span').eq(1).text().trim());
            const address = $(el).find('.address').text().trim();
            if (type && price) results.push({ network: 'Virši', type, price, address, lat: 56.92, lon: 24.05 });
        });
    } catch (e) {}

    fs.writeFileSync('data.json', JSON.stringify({ updatedAt: new Date().toISOString(), stations: results }, null, 2));
}
fetchPrices();

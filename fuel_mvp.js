const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' };

// Dažas reālas staciju lokācijas precizitātei
const stationDatabase = {
    'Circle K': [
        { address: 'Brīvības iela 176', lat: 56.9657, lon: 24.1356 },
        { address: 'K. Ulmaņa gatve 110', lat: 56.9248, lon: 24.0305 },
        { address: 'Duntes iela 13', lat: 56.9745, lon: 24.1221 }
    ],
    'Virši': [
        { address: 'Skanstes iela 2', lat: 56.9622, lon: 24.1205 },
        { address: 'Pildas iela 10', lat: 56.9378, lon: 24.1755 },
        { address: 'Lubānas iela 102', lat: 56.9315, lon: 24.1988 }
    ]
};

async function fetchPrices() {
    console.log("Atjaunojam cenas un lokācijas...");
    const results = [];

    // Circle K
    try {
        const { data } = await axios.get('https://www.circlek.lv/degviela-miles/degvielas-cenas', { headers });
        const $ = cheerio.load(data);
        $('table tbody tr').each((i, el) => {
            const type = $(el).find('td').eq(0).text().trim();
            const price = parseFloat($(el).find('td').eq(1).text().trim().replace(' EUR', ''));
            if (type && price) {
                // Pievienojam vairākas lokācijas Circle K, lai rādītu reālus punktus
                stationDatabase['Circle K'].forEach(loc => {
                    results.push({ network: 'Circle K', type, price, address: loc.address, lat: loc.lat, lon: loc.lon });
                });
            }
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
            
            // Mēģinām atrast koordinātas pēc adreses vai iedodam tuvāko no bāzes
            const loc = stationDatabase['Virši'].find(v => address.includes(v.address.split(' ')[0])) || stationDatabase['Virši'][0];
            
            if (type && price) {
                results.push({ network: 'Virši', type, price, address: address || loc.address, lat: loc.lat, lon: loc.lon });
            }
        });
    } catch (e) { console.log("Virši kļūda"); }

    const output = { updatedAt: new Date().toISOString(), stations: results };
    fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
}

fetchPrices();

const axios = require('axios');
const fs = require('fs');

async function fetchElectricityPrices() {
    console.log("Meklējam Nord Pool cenas Latvijai...");
    
    const now = new Date();
    // Iegūstam datus par pēdējām 24h un nākamo dienu (prognoze)
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    
    const url = `https://dashboard.elering.ee/api/nps/price?start=${start}&end=${end}`;

    try {
        const response = await axios.get(url);
        // Atlasām tikai Latvijas (lv) zonu
        const pricesLV = response.data.data.lv; 

        if (!pricesLV || pricesLV.length === 0) throw new Error("Nav datu");

        // Aprēķinām vidējo cenu bāzes līmenim
        const avgPrice = pricesLV.reduce((sum, p) => sum + p.price, 0) / pricesLV.length;

        const data = {
            updatedAt: new Date().toISOString(),
            average: (avgPrice / 10).toFixed(2), // Centi/kWh
            prices: pricesLV.map(p => {
                const priceCents = (p.price / 10).toFixed(2);
                // Nosakām krāsu: dārgs (>20% virs vidējā), lēts (<20% zem vidējā)
                let color = '#fbbf24'; // Dzeltens (vidējs)
                let label = 'Vidēja';
                
                if (p.price > avgPrice * 1.2) { color = '#ef4444'; label = 'Dārga'; }
                if (p.price < avgPrice * 0.8) { color = '#22c55e'; label = 'Lēta'; }
                
                return {
                    time: new Date(p.timestamp * 1000).toISOString(),
                    price: priceCents,
                    color: color,
                    label: label
                };
            })
        };

        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log("✅ Elektrības cenas veiksmīgi saglabātas!");
    } catch (e) {
        console.log("⚠️ Kļūda iegūstot cenas:", e.message);
    }
}

fetchElectricityPrices();

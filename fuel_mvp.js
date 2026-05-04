const axios = require('axios');
const fs = require('fs');

async function fetchElectricityPrices() {
    console.log("Savācam Nord Pool datus šodienai un rītdienai...");
    
    // Iegūstam datus par plašāku laika posmu (3 dienas, lai būtu droši)
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2).toISOString();
    
    const url = `https://dashboard.elering.ee/api/nps/price?start=${start}&end=${end}`;

    try {
        const response = await axios.get(url);
        const pricesLV = response.data.data.lv; 

        if (!pricesLV || pricesLV.length === 0) throw new Error("Dati nav pieejami");

        // Vidējā cena aprēķinam
        const avgPrice = pricesLV.reduce((sum, p) => sum + p.price, 0) / pricesLV.length;

        const data = {
            updatedAt: new Date().toISOString(),
            prices: pricesLV.map(p => {
                const priceCents = (p.price / 10).toFixed(2);
                let color = '#fbbf24'; // Vidējs
                let label = 'VIDĒJA';
                
                if (p.price > avgPrice * 1.2) { color = '#ef4444'; label = 'DĀRGA'; }
                if (p.price < avgPrice * 0.8) { color = '#22c55e'; label = 'LĒTA'; }
                
                return {
                    time: new Date(p.timestamp * 1000).toISOString(),
                    price: parseFloat(priceCents),
                    color: color,
                    label: label
                };
            })
        };

        fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
        console.log("✅ Dati atjaunoti!");
    } catch (e) {
        console.log("Kļūda:", e.message);
    }
}

fetchElectricityPrices();

// modules/nutrition/openfoodfacts.routes.js
// Proxy vers l'API OpenFoodFacts pour éviter les problèmes CORS/CSP/réseau côté client.

const express = require('express');
const router = express.Router();

// Petit cache mémoire pour éviter de re-taper l'API pour le même produit
// (durée 1h - les données nutritionnelles ne bougent pas)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1h en ms

router.get('/openfoodfacts/:barcode', async (req, res) => {
    const { barcode } = req.params;

    // Validation basique : un code-barres c'est 8 à 14 chiffres
    if (!/^\d{8,14}$/.test(barcode)) {
        return res.status(400).json({ error: "Code-barres invalide" });
    }

    // Check cache
    const cached = cache.get(barcode);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
    }

    try {
        // Node.js 18+ a fetch() natif. Si tu es sur une version plus ancienne,
        // installe node-fetch : npm install node-fetch
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
            {
                headers: {
                    // OpenFoodFacts demande qu'on s'identifie avec un User-Agent
                    'User-Agent': 'TrackCaloriLog - https://trackcalorilog.onrender.com'
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({
                error: "Erreur OpenFoodFacts",
                status: response.status
            });
        }

        const data = await response.json();

        // Si produit non trouvé, on renvoie un 404 propre
        if (data.status !== 1 || !data.product) {
            return res.status(404).json({ error: "Produit non trouvé" });
        }

        // On extrait uniquement ce dont le frontend a besoin
        // (réduit la taille de la réponse - OFF renvoie des MÉGAS de données)
        const p = data.product;
        const n = p.nutriments || {};

        const cleaned = {
            barcode,
            name: p.product_name_fr || p.product_name || p.generic_name_fr || p.generic_name || '',
            brand: (p.brands || '').split(',')[0].trim(),
            calories100g: n['energy-kcal_100g'] ?? null,
            proteins100g: n.proteins_100g ?? null,
            carbs100g: n.carbohydrates_100g ?? null,
            fats100g: n.fat_100g ?? null,
            fiber100g: n.fiber_100g ?? null,
            salt100g: n.salt_100g ?? null,
            imageUrl: p.image_front_small_url || null
        };

        // On met en cache
        cache.set(barcode, { data: cleaned, timestamp: Date.now() });

        res.json(cleaned);

    } catch (error) {
        console.error("Erreur proxy OpenFoodFacts:", error);
        res.status(500).json({ error: "Impossible de contacter OpenFoodFacts" });
    }
});

module.exports = router;
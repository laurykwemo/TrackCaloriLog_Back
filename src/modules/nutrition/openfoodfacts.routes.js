// modules/nutrition/openfoodfacts.routes.js
// Proxy vers l'API OpenFoodFacts pour éviter les problèmes CORS/CSP/réseau côté client.
// Récupère également le potassium (champ disponible sur ~30-40% des produits OFF).

const express = require('express');
const router = express.Router();

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1h

router.get('/openfoodfacts/:barcode', async (req, res) => {
    const { barcode } = req.params;

    if (!/^\d{8,14}$/.test(barcode)) {
        return res.status(400).json({ error: "Code-barres invalide" });
    }

    const cached = cache.get(barcode);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return res.json(cached.data);
    }

    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
            {
                headers: {
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

        if (data.status !== 1 || !data.product) {
            return res.status(404).json({ error: "Produit non trouvé" });
        }

        const p = data.product;
        const n = p.nutriments || {};

        // OpenFoodFacts donne le potassium en GRAMMES dans potassium_100g
        // On le convertit en MILLIGRAMMES pour cohérence avec les conventions nutritionnelles
        // (les emballages affichent toujours le K en mg)
        const potassiumGrams = n.potassium_100g;
        const potassiumMg = potassiumGrams != null ? Math.round(potassiumGrams * 1000) : null;

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
            potassium100g: potassiumMg, // ← AJOUT (mg/100g)
            imageUrl: p.image_front_small_url || null
        };

        cache.set(barcode, { data: cleaned, timestamp: Date.now() });

        res.json(cleaned);

    } catch (error) {
        console.error("Erreur proxy OpenFoodFacts:", error);
        res.status(500).json({ error: "Impossible de contacter OpenFoodFacts" });
    }
});

module.exports = router;
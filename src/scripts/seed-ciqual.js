/**
 * Script de seed Ciqual
 * ----------------------
 * Pré-remplit le catalogue Food avec ~93 aliments bruts issus de la table Ciqual 2020
 * (ANSES — Agence nationale de sécurité sanitaire), base de données française officielle.
 *
 * Usage :
 *   node scripts/seed-ciqual.js
 *
 * Le script est IDEMPOTENT : on peut le relancer sans créer de doublons,
 * il met à jour les entrées existantes (matchées par ciqualCode).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Food } = require('../modules/nutrition/nutrition.model');

// === DONNÉES CIQUAL 2020 ===
// Toutes les valeurs sont POUR 100g (sauf potassium en mg/100g, sel en g/100g)
const CIQUAL_FOODS = [
    { name: "Banane", ciqualCode: "13005", calories100g: 90.5, proteins100g: 1.06, carbs100g: 19.7, fats100g: 0.5, fiber100g: 2.7, salt100g: 0.013, potassium100g: 320.0 },
    { name: "Pomme", ciqualCode: "13039", calories100g: 49.6, proteins100g: 0.25, carbs100g: 11.6, fats100g: 0.25, fiber100g: 1.4, salt100g: 0.004, potassium100g: 119.0 },
    { name: "Poire", ciqualCode: "13037", calories100g: 48.0, proteins100g: 0.49, carbs100g: 10.9, fats100g: 0.27, fiber100g: 2.9, salt100g: 0.004, potassium100g: 132.0 },
    { name: "Orange", ciqualCode: "13034", calories100g: 45.5, proteins100g: 0.75, carbs100g: 8.03, fats100g: 0.5, fiber100g: 2.7, salt100g: 0.013, potassium100g: 180.0 },
    { name: "Clémentine", ciqualCode: "13024", calories100g: 47.3, proteins100g: 0.81, carbs100g: 9.17, fats100g: 0.5, fiber100g: 1.7, salt100g: 0.013, potassium100g: 140.0 },
    { name: "Kiwi", ciqualCode: "13021", calories100g: 60.5, proteins100g: 0.88, carbs100g: 11.0, fats100g: 0.6, fiber100g: 2.4, salt100g: 0.013, potassium100g: 290.0 },
    { name: "Fraise", ciqualCode: "13014", calories100g: 38.6, proteins100g: 0.63, carbs100g: 6.03, fats100g: 0.5, fiber100g: 3.8, salt100g: 0.013, potassium100g: 140.0 },
    { name: "Framboise", ciqualCode: "13015", calories100g: 49.2, proteins100g: 1.19, carbs100g: 5.83, fats100g: 0.8, fiber100g: 4.3, salt100g: 0.013, potassium100g: 170.0 },
    { name: "Myrtille", ciqualCode: "13028", calories100g: 57.7, proteins100g: 0.87, carbs100g: 10.6, fats100g: 0.33, fiber100g: 2.4, salt100g: 0.003, potassium100g: 77.0 },
    { name: "Raisin", ciqualCode: "13044", calories100g: 73.4, proteins100g: 0.75, carbs100g: 16.6, fats100g: 0.5, fiber100g: 1.0, salt100g: 0.013, potassium100g: 200.0 },
    { name: "Pêche", ciqualCode: "13043", calories100g: 43.3, proteins100g: 1.08, carbs100g: 9.0, fats100g: 0.33, fiber100g: 1.6, salt100g: 0.007, potassium100g: 215.0 },
    { name: "Abricot", ciqualCode: "13000", calories100g: 45.9, proteins100g: 0.81, carbs100g: 9.01, fats100g: 0.5, fiber100g: 1.7, salt100g: 0.013, potassium100g: 260.0 },
    { name: "Cerise", ciqualCode: "13008", calories100g: 55.7, proteins100g: 0.81, carbs100g: 13.0, fats100g: 0.3, fiber100g: 1.6, salt100g: 0.013, potassium100g: 190.0 },
    { name: "Pastèque", ciqualCode: "13036", calories100g: 38.9, proteins100g: 0.69, carbs100g: 8.33, fats100g: 0.5, fiber100g: 0.5, salt100g: 0.013, potassium100g: 100.0 },
    { name: "Melon", ciqualCode: "13026", calories100g: 62.7, proteins100g: 1.13, carbs100g: 14.8, fats100g: 0.5, fiber100g: 1.3, salt100g: 0.06, potassium100g: 380.0 },
    { name: "Ananas", ciqualCode: "13002", calories100g: 54.4, proteins100g: 0.5, carbs100g: 11.7, fats100g: 0.5, fiber100g: 1.2, salt100g: 0.013, potassium100g: 140.0 },
    { name: "Mangue", ciqualCode: "13025", calories100g: 73.9, proteins100g: 0.63, carbs100g: 14.3, fats100g: 0.5, fiber100g: 1.6, salt100g: 0.013, potassium100g: 150.0 },
    { name: "Avocat", ciqualCode: "13004", calories100g: 205.0, proteins100g: 1.56, carbs100g: 0.83, fats100g: 20.6, fiber100g: 3.6, salt100g: 0.015, potassium100g: 430.0 },
    { name: "Datte sèche", ciqualCode: "13011", calories100g: 268.3, proteins100g: 1.81, carbs100g: 64.7, fats100g: 0.25, fiber100g: 7.3, salt100g: 0.098, potassium100g: 696.0 },
    { name: "Figue sèche", ciqualCode: "13013", calories100g: 237.0, proteins100g: 2.99, carbs100g: 54.3, fats100g: 0.87, fiber100g: 9.72, salt100g: 0.22, potassium100g: 845.0 },
    { name: "Pruneau", ciqualCode: "13042", calories100g: 229.0, proteins100g: 1.63, carbs100g: 55.4, fats100g: 0.4, fiber100g: 5.1, salt100g: 0.013, potassium100g: 610.0 },
    { name: "Épinard cru", ciqualCode: "20059", calories100g: 24.0, proteins100g: 2.62, carbs100g: 2.25, fats100g: 0.5, fiber100g: 2.37, salt100g: 0.17, potassium100g: 504.0 },
    { name: "Brocoli cru", ciqualCode: "20057", calories100g: 26.9, proteins100g: 3.95, carbs100g: 1.7, fats100g: 0.48, fiber100g: 2.9, salt100g: 0.048, potassium100g: 357.0 },
    { name: "Chou-fleur cru", ciqualCode: "20016", calories100g: 26.2, proteins100g: 1.81, carbs100g: 2.13, fats100g: 0.7, fiber100g: 2.2, salt100g: 0.015, potassium100g: 270.0 },
    { name: "Carotte crue", ciqualCode: "20009", calories100g: 40.2, proteins100g: 0.63, carbs100g: 7.59, fats100g: 0.5, fiber100g: 2.7, salt100g: 0.11, potassium100g: 230.0 },
    { name: "Tomate crue", ciqualCode: "20047", calories100g: 19.3, proteins100g: 0.86, carbs100g: 2.49, fats100g: 0.26, fiber100g: 1.2, salt100g: 0.008, potassium100g: 256.0 },
    { name: "Courgette crue", ciqualCode: "20020", calories100g: 16.5, proteins100g: 1.23, carbs100g: 1.8, fats100g: 0.26, fiber100g: 1.05, salt100g: 0.023, potassium100g: 262.0 },
    { name: "Concombre cru", ciqualCode: "20019", calories100g: 15.6, proteins100g: 0.64, carbs100g: 2.54, fats100g: 0.11, fiber100g: 0.6, salt100g: 0.012, potassium100g: 157.0 },
    { name: "Poivron cru", ciqualCode: "20041", calories100g: 23.8, proteins100g: 0.8, carbs100g: 4.55, fats100g: 0.27, fiber100g: 1.5, salt100g: 0.021, potassium100g: 155.0 },
    { name: "Laitue", ciqualCode: "20031", calories100g: 12.3, proteins100g: 1.3, carbs100g: 1.33, fats100g: 0.2, fiber100g: 1.2, salt100g: 0.021, potassium100g: 200.0 },
    { name: "Champignon de Paris cru", ciqualCode: "20056", calories100g: 28.0, proteins100g: 2.62, carbs100g: 3.15, fats100g: 0.36, fiber100g: 1.0, salt100g: 0.098, potassium100g: 364.0 },
    { name: "Oignon cru", ciqualCode: "20034", calories100g: 35.0, proteins100g: 1.1, carbs100g: 6.25, fats100g: 0.62, fiber100g: 1.7, salt100g: 0.098, potassium100g: 190.0 },
    { name: "Échalote crue", ciqualCode: "20097", calories100g: 63.6, proteins100g: 1.81, carbs100g: 12.2, fats100g: 0.5, fiber100g: 2.6, salt100g: 0.013, potassium100g: 220.0 },
    { name: "Haricot vert cru", ciqualCode: "20061", calories100g: 25.9, proteins100g: 1.85, carbs100g: 4.14, fats100g: 0.21, fiber100g: 2.85, salt100g: 0.01, potassium100g: 224.0 },
    { name: "Petit pois cru", ciqualCode: "25037", calories100g: 105.0, proteins100g: 6.13, carbs100g: 8.39, fats100g: 5.1, fiber100g: 0.5, salt100g: 0.82, potassium100g: 223.0 },
    { name: "Aubergine crue", ciqualCode: "20053", calories100g: 15.3, proteins100g: 1.12, carbs100g: 2.39, fats100g: 0.14, fiber100g: 2.7, salt100g: 0.006, potassium100g: 235.0 },
    { name: "Betterave rouge cuite", ciqualCode: "20003", calories100g: 42.8, proteins100g: 1.44, carbs100g: 7.13, fats100g: 0.4, fiber100g: 2.5, salt100g: 0.23, potassium100g: 320.0 },
    { name: "Endive crue", ciqualCode: "20026", calories100g: 20.2, proteins100g: 1.19, carbs100g: 2.83, fats100g: 0.5, fiber100g: 1.1, salt100g: 0.013, potassium100g: 150.0 },
    { name: "Poireau cru", ciqualCode: "20039", calories100g: 32.3, proteins100g: 1.49, carbs100g: 4.9, fats100g: 0.25, fiber100g: 2.27, salt100g: 0.036, potassium100g: 208.0 },
    { name: "Pomme de terre crue", ciqualCode: "4008", calories100g: 80.5, proteins100g: 2.16, carbs100g: 16.2, fats100g: 0.18, fiber100g: 1.8, salt100g: 0.016, potassium100g: 418.0 },
    { name: "Patate douce crue", ciqualCode: "4101", calories100g: 86.3, proteins100g: 1.51, carbs100g: 18.3, fats100g: 0.15, fiber100g: 2.87, salt100g: 0.098, potassium100g: 373.0 },
    { name: "Asperge crue", ciqualCode: "20073", calories100g: 19.6, proteins100g: 2.04, carbs100g: 2.4, fats100g: 0.21, fiber100g: 1.95, salt100g: 0.011, potassium100g: 202.0 },
    { name: "Céleri-branche cru", ciqualCode: "20023", calories100g: 17.6, proteins100g: 0.63, carbs100g: 2.41, fats100g: 0.5, fiber100g: 2.2, salt100g: 0.2, potassium100g: 390.0 },
    { name: "Radis rouge cru", ciqualCode: "20045", calories100g: 14.5, proteins100g: 0.94, carbs100g: 1.53, fats100g: 0.5, fiber100g: 1.4, salt100g: 0.04, potassium100g: 250.0 },
    { name: "Maïs doux conserve", ciqualCode: "20066", calories100g: 106.0, proteins100g: 2.82, carbs100g: 18.4, fats100g: 1.68, fiber100g: 3.1, salt100g: 0.59, potassium100g: 224.0 },
    { name: "Riz blanc cru", ciqualCode: "9100", calories100g: 352.0, proteins100g: 7.4, carbs100g: 78.0, fats100g: 0.91, fiber100g: 1.05, salt100g: 0.006, potassium100g: 121.0 },
    { name: "Riz complet cru", ciqualCode: "9102", calories100g: 350.0, proteins100g: 7.38, carbs100g: 71.4, fats100g: 2.8, fiber100g: 5.0, salt100g: 0.01, potassium100g: 219.0 },
    { name: "Pâtes blanches sèches", ciqualCode: "9810", calories100g: 336.0, proteins100g: 12.6, carbs100g: 65.8, fats100g: 1.79, fiber100g: 3.0, salt100g: 0.031, potassium100g: 219.0 },
    { name: "Pâtes complètes sèches", ciqualCode: "9870", calories100g: 353.0, proteins100g: 12.6, carbs100g: 67.6, fats100g: 2.2, fiber100g: 6.1, salt100g: 0.016, potassium100g: 378.0 },
    { name: "Quinoa cru", ciqualCode: "9340", calories100g: 358.0, proteins100g: 14.1, carbs100g: 58.1, fats100g: 6.07, fiber100g: 7.0, salt100g: 0.013, potassium100g: 563.0 },
    { name: "Boulgour cru", ciqualCode: "9690", calories100g: 351.0, proteins100g: 12.4, carbs100g: 66.8, fats100g: 1.71, fiber100g: 9.57, salt100g: 0.043, potassium100g: 410.0 },
    { name: "Semoule de blé crue", ciqualCode: "9610", calories100g: 352.0, proteins100g: 12.0, carbs100g: 71.6, fats100g: 1.25, fiber100g: 3.37, salt100g: 0.003, potassium100g: 152.0 },
    { name: "Flocons d'avoine cuits", ciqualCode: "9313", calories100g: 75.5, proteins100g: 2.72, carbs100g: 11.9, fats100g: 1.52, fiber100g: 1.7, salt100g: 0.01, potassium100g: 70.0 },
    { name: "Pain de mie complet", ciqualCode: "7111", calories100g: 262.0, proteins100g: 9.33, carbs100g: 43.7, fats100g: 4.06, fiber100g: 6.23, salt100g: 1.18, potassium100g: 226.0 },
    { name: "Baguette", ciqualCode: "7001", calories100g: 287.0, proteins100g: 9.06, carbs100g: 58.3, fats100g: 1.4, fiber100g: 2.7, salt100g: 1.3, potassium100g: 180.0 },
    { name: "Pain complet", ciqualCode: "7256", calories100g: 217.0, proteins100g: 13.7, carbs100g: 32.9, fats100g: 1.87, fiber100g: 7.07, salt100g: 0.98, potassium100g: 0 },
    { name: "Lentille sèche crue", ciqualCode: "20504", calories100g: 316.1, proteins100g: 25.4, carbs100g: 50.6, fats100g: 1.34, fiber100g: 7.63, salt100g: 0.21, potassium100g: 674.0 },
    { name: "Pois chiche sec", ciqualCode: "20516", calories100g: 324.6, proteins100g: 20.5, carbs100g: 47.5, fats100g: 5.85, fiber100g: 13.3, salt100g: 0.08, potassium100g: 759.0 },
    { name: "Haricot blanc sec", ciqualCode: "20501", calories100g: 268.0, proteins100g: 19.1, carbs100g: 43.9, fats100g: 1.78, fiber100g: 16.8, salt100g: 0.028, potassium100g: 1660.0 },
    { name: "Haricot rouge sec", ciqualCode: "20525", calories100g: 283.9, proteins100g: 22.5, carbs100g: 46.1, fats100g: 1.06, fiber100g: 15.2, salt100g: 0.03, potassium100g: 1360.0 },
    { name: "Poulet blanc cuit", ciqualCode: "25184", calories100g: 175.0, proteins100g: 4.44, carbs100g: 31.5, fats100g: 3.19, fiber100g: 0.99, salt100g: 0.78, potassium100g: 0 },
    { name: "Poulet cuisse cuite", ciqualCode: "36004", calories100g: 213.0, proteins100g: 25.9, carbs100g: 2.0, fats100g: 11.3, fiber100g: 0, salt100g: 0.23, potassium100g: 324.0 },
    { name: "Dinde escalope cuite", ciqualCode: "36308", calories100g: 128.0, proteins100g: 24.6, carbs100g: 0.5, fats100g: 3.04, fiber100g: 0, salt100g: 0.25, potassium100g: 249.0 },
    { name: "Bœuf haché 5% cru", ciqualCode: "6250", calories100g: 130.0, proteins100g: 21.9, carbs100g: 0.3, fats100g: 4.59, fiber100g: 0, salt100g: 0.097, potassium100g: 353.0 },
    { name: "Bœuf haché 15% cru", ciqualCode: "6254", calories100g: 209.0, proteins100g: 20.2, carbs100g: 0.47, fats100g: 14.1, fiber100g: 0, salt100g: 0.1, potassium100g: 302.0 },
    { name: "Saumon cuit", ciqualCode: "25996", calories100g: 205.0, proteins100g: 23.0, carbs100g: 0, fats100g: 12.5, fiber100g: 0, salt100g: 0.13, potassium100g: 383.0 },
    { name: "Thon naturel conserve", ciqualCode: "26039", calories100g: 111.0, proteins100g: 26.8, carbs100g: 0, fats100g: 0.4, fiber100g: 0, salt100g: 0.74, potassium100g: 207.0 },
    { name: "Cabillaud cru", ciqualCode: "26043", calories100g: 77.6, proteins100g: 18.1, carbs100g: 0, fats100g: 0.57, fiber100g: 0.2, salt100g: 0.23, potassium100g: 357.0 },
    { name: "Crevette cuite", ciqualCode: "10006", calories100g: 89.9, proteins100g: 18.3, carbs100g: 1.47, fats100g: 1.2, fiber100g: 0, salt100g: 1.15, potassium100g: 97.0 },
    { name: "Œuf cru", ciqualCode: "25475", calories100g: 222.0, proteins100g: 10.1, carbs100g: 30.9, fats100g: 5.98, fiber100g: 1.88, salt100g: 1.45, potassium100g: 186.0 },
    { name: "Œuf dur", ciqualCode: "25585", calories100g: 139.0, proteins100g: 21.9, carbs100g: 0.33, fats100g: 5.2, fiber100g: 3.0, salt100g: 0.86, potassium100g: 430.0 },
    { name: "Jambon blanc", ciqualCode: "28906", calories100g: 119.0, proteins100g: 20.3, carbs100g: 1.03, fats100g: 3.66, fiber100g: 0.32, salt100g: 1.82, potassium100g: 313.0 },
    { name: "Sardine huile conserve", ciqualCode: "26034", calories100g: 207.0, proteins100g: 24.4, carbs100g: 0.49, fats100g: 12.0, fiber100g: 0, salt100g: 0.75, potassium100g: 368.0 },
    { name: "Lait demi-écrémé UHT", ciqualCode: "19037", calories100g: 46.6, proteins100g: 3.31, carbs100g: 4.8, fats100g: 1.52, fiber100g: 0, salt100g: 0.09, potassium100g: 160.0 },
    { name: "Lait écrémé UHT", ciqualCode: "19050", calories100g: 33.4, proteins100g: 3.44, carbs100g: 4.64, fats100g: 0.06, fiber100g: 0, salt100g: 0.098, potassium100g: 166.0 },
    { name: "Yaourt nature", ciqualCode: "19538", calories100g: 76.8, proteins100g: 2.7, carbs100g: 12.9, fats100g: 1.6, fiber100g: 0.05, salt100g: 0.1, potassium100g: 112.0 },
    { name: "Fromage blanc 0%", ciqualCode: "19644", calories100g: 49.4, proteins100g: 7.78, carbs100g: 3.89, fats100g: 0.04, fiber100g: 0, salt100g: 0.11, potassium100g: 144.0 },
    { name: "Fromage blanc 3% MG", ciqualCode: "19646", calories100g: 76.9, proteins100g: 7.86, carbs100g: 3.46, fats100g: 3.26, fiber100g: 0, salt100g: 0.11, potassium100g: 132.0 },
    { name: "Comté", ciqualCode: "12110", calories100g: 418.0, proteins100g: 26.7, carbs100g: 0, fats100g: 34.6, fiber100g: 0, salt100g: 0.8, potassium100g: 116.0 },
    { name: "Mozzarella", ciqualCode: "19590", calories100g: 227.0, proteins100g: 16.1, carbs100g: 0.75, fats100g: 17.7, fiber100g: 0, salt100g: 0.6, potassium100g: 76.0 },
    { name: "Emmental", ciqualCode: "12115", calories100g: 373.0, proteins100g: 27.3, carbs100g: 0, fats100g: 28.8, fiber100g: 0, salt100g: 0.61, potassium100g: 97.1 },
    { name: "Beurre", ciqualCode: "16400", calories100g: 753.0, proteins100g: 0.69, carbs100g: 0.9, fats100g: 82.9, fiber100g: 0, salt100g: 0.063, potassium100g: 28.0 },
    { name: "Amande", ciqualCode: "15000", calories100g: 590.1, proteins100g: 22.6, carbs100g: 9.51, fats100g: 51.3, fiber100g: 12.5, salt100g: 0.013, potassium100g: 800.0 },
    { name: "Noix", ciqualCode: "15005", calories100g: 696.0, proteins100g: 15.7, carbs100g: 6.88, fats100g: 67.3, fiber100g: 6.7, salt100g: 0.13, potassium100g: 430.0 },
    { name: "Noisette", ciqualCode: "4013", calories100g: 181.0, proteins100g: 2.76, carbs100g: 24.9, fats100g: 7.22, fiber100g: 2.82, salt100g: 0.93, potassium100g: 550.0 },
    { name: "Noix de cajou", ciqualCode: "15019", calories100g: 624.3, proteins100g: 18.0, carbs100g: 26.7, fats100g: 49.5, fiber100g: 3.85, salt100g: 1.15, potassium100g: 546.0 },
    { name: "Pistache", ciqualCode: "15009", calories100g: 598.3, proteins100g: 22.3, carbs100g: 15.9, fats100g: 49.5, fiber100g: 9.32, salt100g: 1.67, potassium100g: 655.0 },
    { name: "Cacahuète grillée salée", ciqualCode: "15002", calories100g: 614.8, proteins100g: 26.2, carbs100g: 15.0, fats100g: 50.0, fiber100g: 8.04, salt100g: 1.33, potassium100g: 531.0 },
    { name: "Graine de courge", ciqualCode: "15028", calories100g: 603.1, proteins100g: 35.6, carbs100g: 4.71, fats100g: 49.1, fiber100g: 6.0, salt100g: 0.018, potassium100g: 809.0 },
    { name: "Graine de chia", ciqualCode: "15047", calories100g: 385.2, proteins100g: 19.5, carbs100g: 7.72, fats100g: 30.7, fiber100g: 34.4, salt100g: 0.04, potassium100g: 407.0 },
    { name: "Graine de sésame", ciqualCode: "15010", calories100g: 569.9, proteins100g: 20.8, carbs100g: 9.85, fats100g: 49.7, fiber100g: 14.9, salt100g: 0.1, potassium100g: 468.0 },
    { name: "Graine de tournesol", ciqualCode: "15011", calories100g: 640.3, proteins100g: 25.1, carbs100g: 10.1, fats100g: 55.5, fiber100g: 6.4, salt100g: 0.014, potassium100g: 578.0 },
    { name: "Beurre de cacahuète", ciqualCode: "15202", calories100g: 638.5, proteins100g: 25.4, carbs100g: 16.1, fats100g: 52.5, fiber100g: 5.0, salt100g: 0.97, potassium100g: 629.0 }
];

async function seed() {
    const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!MONGODB_URI) {
        console.error('❌ Variable d\'environnement MONGODB_URI (ou MONGO_URI) manquante.');
        process.exit(1);
    }

    try {
        console.log('🔌 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté.\n');

        let created = 0;
        let updated = 0;
        let unchanged = 0;

        for (const food of CIQUAL_FOODS) {
            // On cherche par ciqualCode pour idempotence
            const existing = await Food.findOne({ ciqualCode: food.ciqualCode });

            const payload = {
                ...food,
                source: 'ciqual',
                brand: 'Ciqual (ANSES)' // marquage clair pour l'utilisateur
            };

            if (!existing) {
                await Food.create(payload);
                created++;
                console.log(`➕ Créé   : ${food.name}`);
            } else {
                // Mise à jour si données différentes
                const hasChanged = (
                    existing.calories100g !== food.calories100g ||
                    existing.potassium100g !== food.potassium100g
                );
                if (hasChanged) {
                    await Food.updateOne({ _id: existing._id }, payload);
                    updated++;
                    console.log(`🔄 MAJ    : ${food.name}`);
                } else {
                    unchanged++;
                }
            }
        }

        console.log('\n=================================');
        console.log(`✨ Seed Ciqual terminé`);
        console.log(`   Créés     : ${created}`);
        console.log(`   Mis à jour: ${updated}`);
        console.log(`   Inchangés : ${unchanged}`);
        console.log(`   Total     : ${CIQUAL_FOODS.length}`);
        console.log('=================================\n');

    } catch (error) {
        console.error('❌ Erreur :', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté.');
    }
}

seed();
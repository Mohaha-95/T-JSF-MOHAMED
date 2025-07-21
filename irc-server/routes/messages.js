const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// ✅ Vérifier si la route GET est bien appelée
router.get('/', async (req, res) => {
    console.log("✅ Route GET /api/messages appelée !");
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des messages :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// ✅ Vérifier si la route POST est bien appelée
router.post('/', async (req, res) => {
    console.log("✅ Route POST /api/messages appelée avec body :", req.body);
    try {
        const { userId, username, text } = req.body;

        if (!userId || !username || !text) {
            console.error("⚠️ Données invalides reçues :", req.body);
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const newMessage = new Message({ userId, username, text });
        await newMessage.save();

        console.log("📨 Message enregistré :", newMessage);
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement du message :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;

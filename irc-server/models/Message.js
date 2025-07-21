const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optionnel pour les messages système
        index: true // Optimisation pour les requêtes filtrées par userId
    },
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true // Évite les espaces inutiles
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
        required: false // false pour permettre les messages privés
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // présent uniquement pour les messages privés
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Création d'un index pour améliorer les performances des requêtes par utilisateur
MessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);

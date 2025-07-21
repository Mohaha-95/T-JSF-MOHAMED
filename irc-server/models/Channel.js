const mongoose = require('mongoose');

// Définir le schéma du canal
const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,  // Assurer que le nom du canal soit unique
  },
  creator: {
    type: String,  // Stocke l'ID ou le nom de l'utilisateur qui crée le canal
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Date de création automatique
  },
  users: [
    {
      type: String, // username ou userId selon la logique de ton app
    },
  ],
});

const Channel = mongoose.model('Channel', channelSchema);

module.exports = Channel;

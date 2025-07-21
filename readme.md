# MoChat

MoChat est une application de chat IRC moderne avec Node.js/Express, React, Socket.IO et MongoDB.

## Lancer le projet

1. Ouvrir deux terminaux :
   - **Backend** :
     ```bash
     cd irc-server
     npm install
     npm start
     ```
   - **Frontend** :
     ```bash
     cd irc-client
     npm install
     npm start
     ```
2. S'assurer que MongoDB est lancé (`mongod`).

3. Créer un fichier .env en mettant:

MONGO_URI=mongodb://localhost:27017/irc_database
JWT_SECRET=NaMeTalkProjet123

3. Accèder à [http://localhost:3000](http://localhost:3000)

## Fonctionnalités principales
- Création, suppression, joindre et quitter des canaux
- Liste des cannaux
- Messagerie en temps réel (cannaux et privés)
- Affichage des utilisateurs dans un cannal
- Persistance MongoDB (cannaux, messages, utilisateurs)
- Authentification email/pseudo/mot de passe

## Commandes IRC disponibles
- `/create nom` : créer un cannal
- `/delete nom` : supprimer un cannal (créateur uniquement)
- `/join nom` : rejoindre un cannal
- `/quit nom` : quitter un cannal
- `/list [mot]` : lister les cannaux (filtre optionnel)
- `/users` : voir les utilisateurs du cannal actuel
- `/msg pseudo message` : envoyer un message privé
- message : envoyer un message dans le cannal courant

## Bonus
- Interface moderne(inspiré de Kick.com) et responsive
- Affichage des messages système et privés

# PUBG Custom Discord Bot
## Configuration
### Déclaration de l'application auprès de Discord
1. Rendez-vous dans le [portail des développeurs Discord](https://discordapp.com/developers) ;
2. Dans le menu de gauche, cliquez sur `Applications` ;
3. Sur la page qui vient d'apparaître, cliquez sur le bouton bleu en haut à droite `New Application` ;
4. Donnez un nom à votre application et cliquez sur `Create` ;
5. Sur la page qui décrit l'Application que vous venez de créer, gardez de côté l'information suivante :
   - `CLIENT ID` 
6. Dans le menu de gauche, cliquez sur `Bot` ;
7. Cliquez sur `Add Bot` à droite de l'écran, validez la décision ;
8. Sur la page qui décrit le Bot que vous venez de créer, gardez de côté l'information suivante :
  - `TOKEN` (cliquez sur `Click to Reveal Token` pour l'afficher)
  Vous pouvez aussi modifier le nom sous lequel le bot apparaît connecté à cet endroit.
## Installation
1. Téléchargez le fichier ZIP sur le dépôt [Github du projet](https://github.com/heresie/pubg-custom-bot) ;
2. Décompressez le contenu à la destination de votre choix ;
3. Créez un fichier dans le répertoire `bot/src/config`, nommé `credentials.json` qui doit prendre la forme suivante :
   ```json
   {
     "token": "MYTOKEN"
   }   
   ```
   Remplacez `MYTOKEN` par la valeur conservée à l'étape 8. de la déclaration de l'application auprès de Discord ;
4. Suivez les étapes suivantes `Windows` ou `Docker` selon votre situation ;
### Windows
1. Téléchagez le framework [NodeJS](https://nodejs.org/fr/download/) et installez le sur votre poste de travail.
   **ATTENTION :** Cochez la case `Automatically install the necessary tools. Note that this will also install Chocolatey. The script will pop-up in a new window after the installation completes.` avant de lancer l'installation
2. Téléchargez l'outil [git](https://git-scm.com/download/win) et installez le sur votre poste de travail.
   Laissez les valeurs par défaut, elles suffiront pour notre usage.
3. Ouvez un terminal `Windows Powershell` via le Menu Démarrer, puis rendez-vous dans le dossier où vous avez décompressé le fichier ZIP :
   ```shell
   cd C:\Path\to\my\unzipped\files
   ```
4. Ensuite installez les dépendances du projet, ça va faire défiler pas mal d'informations à l'écran avec parfois des erreurs mineures, ne vous inquiétez pas de cela. 
   ```shell
   cd bot
   npm install
   ```
   Vous devriez vous les lignes s'arrêter sur quelque chose de similaire à :
   ```
   added 91 packages from 92 contributors and audited 122 packages in 27.353s
   found 0 vulnerabilities
   ```
5. Démarrez le bot en saisissant ce qui suit dans le terminal :
   ```shell
   cd src
   node main.js
   ```
   Vous voyez le bot démarrer :
   ```
   INIT  | Loading event {message}
   INIT  | Loading event {ready}
   INIT  | Loading event {voiceStateUpdate}
   INIT  | Loading command {aide}
   INIT  | Loading command {assemble}
   INIT  | Loading command {rematch}
   INIT  | Loading command {sound}
   INIT  | Loading command {status}
   INIT  | Loading command {teams}
   INIT  | Loading command {timer}
   INIT  | Loading command {voice}
   INIT  | Loading command {volume}
   INIT  | Loading command {vote}
   INFO  | Demo App#2400 logged in!
   ```
  
### Docker
1. Sur un poste disposant du runtime Docker, rendez-vous avec votre terminal à l'endroit où vous avez décompressé le projet et tapez 
   ```shell
   docker build . -t pubg-custom-bot:latest
   docker-compose up -d
   ```
## Invitez votre bot
Dans l'URL suivante, remplacez `[MON_CLIENT_ID]` par le `CLIENT ID` que vous a donné Discord lorsque vous avez déclaré votre application.
```
https://discordapp.com/oauth2/authorize?client_id=[MON_CLIENT_ID]&permissions=2147482999&scope=bot
```
Allez sur cette adresse et autorisez le bot à rejoindre votre serveur Discord.
## Configuration
La configuration du bot se fait dans le fichier de configuration `bot/src/config/config.json`.

```json
{
    "prefix": "!",
    "defaultStatus": "STATUT DU BOT (sous le pseudo)",
    "roles": {
        "adminRoleName": "NOM DU ROLE DES ADMINS SUR LE SERVEUR DISCORD"
    },
    "channels": {
        "pollChannelName": "NOM DU CHANNEL OU SONT LANCES LES VOTES",
        "vocalChannelName": "NOM DU CHANNEL VOCAL D ATTENTE POUR TIRER AU SORT LES EQUIPES",
        "vocalTeamChannelWildcard": "Team ",
        "vocalDispatchChannelName": "NOM DU CHANNEL VOCAL DE DISPATCH"
    },
    "voice": {
        "streamOptions": { 
            "seek": 0, 
            "volume": 10 
        },
        "allowedVoices": ["default", "joyeux", "taverne"],
        "currentVoice": "default",
        "defaultVolume": 0.5
    },
    "delays": {
        "maxResponseDelay": 30,
        "betweenQuestionsDelay": 3,
        "startPollDelay": 3,
        "startRandomizerDelay": 10,
        "awaitEmojiTempoPerSec": 0.2,
        "defaultCountdownLimit": 120,
        "countdownStep": 30,
        "defaultTeamLimit": 2
    },
    "customs": {
        "lastParams": {},
        "inProgress": []
    },
    "images": {
        "embed": {
            "vote": "URL VERS LE LOGO",
            "medium": "URL VERS LE LOGO"
        }
    }
}
```
## Bugs connus
 
 - Problèmes pour jouer des fichiers audio sous Windows    
   Installer ffmpeg : `npm i ffmpeg-binaries@^3.2.2-3` n'y changera rien.

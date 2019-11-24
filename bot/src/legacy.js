// requirements
const Discord = require('discord.js')
const auth = require('../credentials/auth.json')

const commands = {}

const fs = require('fs')
const pollQuestions = require('../polls/customGames.json')
const rematchQuestions = require('../polls/rematchGames.json')
const emojiCharacters = require('./emojiCharacters')

var path = require('path')
var appDir = path.dirname(require.main.filename)

// init
const client = new Discord.Client();
let commands = new Discord.Collection()

// specific discord configuration
const adminRoleName = 'Responsable Custom';
const pollChannelName = 'custom-vote';
const vocalChannelName = 'En Attente';
const vocalTeamChannelWildcard = 'Team ';
const vocalDispatchChannelName = '⚪Dispatch';
const allowedVoices = ['joyeux', 'normal', 'taverne']

// poll timers
const maxResponseDelay = 30;
const betweenQuestionsDelay = 3;
const startPollDelay = 3;
const startRandomizerDelay = 10;
const awaitEmojiTempoPerSec = 0.4;

// countdown timers
const defaultCountdownLimit = 120;
const countdownStep = 30;
const defaultTeamLimit = 2;

// the structure of this object is stored in the initQuestionObject method
let question = {}
let voteInProgress = false;
let pubgEmoji = null;
let lastParamsStr = "";
let voteChannel = null;
let vocalChannel = null;
let dispatchChannel = null;
let streamOptions = { seek: 0, volume: 10 }
let defaultVoice = 'normal'

let allowedCommands = [
    {
        name: "Mise à jour de la voix du Bot",
        command: '!voice',
        helper: '!voice <normal|taverne|joyeux>',
        description: 'Mise à jour de la voix du Bot parmis la liste : normal, taverne et joyeux'
    },
    {
        name: "Mise à jour du volume sonore du Bot",
        command: '!volume',
        helper: '!volume <int>',
        description: 'Mise à jour du volume sonore du Bot à la valeur <int> (? ne connaissons pas encore le range) [BETA]'
    },
    {
        name: "Mise à jour du statut de présence de CustomVote",
        command: '!status',
        helper: '!status <statut>',
        description: `Mise à jour de la présence de CustomVote`
    },
    {
        name: "Jouer un son <sound> avec <voice>",
        command: '!mp3',
        helper: '!mp3 <voice> <sound>',
        description: `Jouer un son <sound> avec <voice> [BETA]`
    },
    {
        name: "Liste des commandes disponibles",
        command: '!aide',
        helper: '!aide',
        description: `Envoie cette aide en message privé à la personne l'ayant demandé.`
    },
    {
        name: "Démarrage d'un vote de match Custom",
        command: '!vote',
        helper: '!vote',
        description: `Timers: démarrage ${startPollDelay}s / inter-choix ${maxResponseDelay}s / délai vote en fonction du nombre d'émoji à placer
Propose de parcourir un arbre de choix. La commande s'arrête à la fin de l'arbre de choix.
L'arbre de choix propose les différents modes de jeux PUBG organisés par l'équipe du Discord.
En cas d'égalité : random entre les résultats à égalité.
En cas de partie rapide : le bot fait le même parcours que l'humain en mode random.
/!\ LES REACTIONS FAITES AVANT LE DEBUT DU DECOMPTE NE SONT PAS COMPTABILISEES`
    },
    {
        name: "Démarrage d'un vote de rematch",
        command: '!rematch',
        helper: '!rematch',
        description: `Timers: démarrage ${startPollDelay}s / inter-choix ${maxResponseDelay}s / délai vote en fonction du nombre d'émoji à placer
Comme vote, mais l'arbre parcouru propose de relancer une partie avec les derniers paramètres.
/!\ NE FONCTIONNE PAS LORSQUE LE BOT NE CONNAIT PAS LA PRECEDENTE PARTIE (EN CAS DE REBOOT)`,
    },
    {
        name: "Démarrage d'un timer avant le démarrage d'une partie",
        command: '!timer',
        helper: '!timer <delai>',
        description: `Timers: démarrage 0s / rappel ${countdownStep}s / <delai> par défaut : ${defaultCountdownLimit}s
Annonce les informations pour rejoindre la partie et lance un timer de <delai> secondes.
Lance des rappels réguliers.`,
    },
    {
        name: "Démarrage d'un randomizer de team avec les personnes connectées au channel vocal",
        command: '!teams',
        helper: '!teams <n_teams>',
        description: `Timers: démarrage ${startRandomizerDelay}s  / <n_teams> par défaut : ${defaultTeamLimit}
Créé <n_teams> équipes en réalisant un random selon l'algorithme de Fisher-Yates.
Utilise le nom des utilisateurs connectés sur le channel vocal "En Attente" et qui ne sont pas *sourds*.
/!\ ATTENTION AUX AFK ET PERSONNES QUI VONT QUITTER QUI TRAINENT DANS LE CHANNEL`
    },
    {
        name: "Déplacement de tous les joueurs dans le salon En Attente",
        command: '!assemble',
        helper: '!assemble',
        description: `Déplace les joueurs vers le channel En Attente`
    }
];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
  
function pad2(nb) {
    return (nb < 10 ? '0' : '') + nb
}

// protects a message from unwanted reactions
async function protectReactions(message, allowedEmojis) {

    const collector = message.createReactionCollector(
        (reaction, user) => !user.bot && (!allowedEmojis.includes(reaction.emoji.name)),
        {time: maxResponseDelay * 1000}
    );

    collector.on('collect', (r) => {
        r.remove(r.users.first())

        console.log(`PROT | Blocked unsollicited reaction on bot message`)
    });
    
}

// debug tool
function dumpError(err) {

    if (typeof err === 'object') {

        if (err.message) {
            console.log('\nMessage: ' + err.message)
        }

        if (err.stack) {
            console.log('\nStacktrace:')
            console.log('====================')
            console.log(err.stack);
        }

    } else {
        console.log('dumpError :: argument is not an object');
    }

}

function getVocalChannelStartingWith(message, channelStartString) {

    return message.guild.channels.filter(channel => channel.type === 'voice' && channel.name.startsWith(channelStartString))

}

function moveUsers(v, d, c, reason) {

    console.log(`MOVE | ${c} | Moving users from ${v.name} to ${d.name}`)

    for (let member of v.members.values()) {

        if (reason) member.send(reason)

        member.setVoiceChannel(d)

    }
}

// randomize array
function arrayShuffle(array) {

    var currentIndex = array.length, temporaryValue, randomIndex

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = getRandomInt(0, currentIndex)
        currentIndex -= 1

        // And swap it with the current element.
        temporaryValue = array[currentIndex]
        array[currentIndex] = array[randomIndex]
        array[randomIndex] = temporaryValue
    }

    return array;
}

// prepare Embed object
function newEmbed(type) {

    let richEmbed = new Discord.RichEmbed()
                       .setColor('#0099ff')

    switch (type) {

       case 'simple':
           break;

       case 'vote':
           richEmbed
               .setThumbnail('https://i.ibb.co/vjNwdQW/imgbin-playerunknown-s-battlegrounds-garena-free-fire-fortnite-t-shirt-android-t-shirt-GGKKs-Dyer-FSXX.png')
               .setFooter(`⏰ Vous disposez de ${maxResponseDelay} secondes pour réagir à la question.`, '')
           break;

       case 'medium':
           richEmbed
               .setThumbnail('https://i.ibb.co/vjNwdQW/imgbin-playerunknown-s-battlegrounds-garena-free-fire-fortnite-t-shirt-android-t-shirt-GGKKs-Dyer-FSXX.png')
           break;

       default:
           break;
    }

    return richEmbed;
}

// reset global question object
function initQuestionObject() {
    question = {
        "nb_answers": 0,
        "allowed_emojis": [],
        "objs": {
            "q": {},
            "e": {}
        },
        "results": [],
        "winner": {},
        "messages": {
            "response": "",
            "question": "",
        },
        "randomized": false,
        "success": false
    }    
}

function loadCommands() {

    const commandsDirectory = `${appDir}/../commands`

    fs.readdir(commandsDirectory, function (err, files) {

        if (err) {
            return console.log(`ERR  | Could not open ${commandsDirectory} folder`)
        }

        files.forEach((file) => {
            console.log(`MOD  | Loading command <${file}>`)
            require(file)(commands)
        })

    })

}

// main
function startPoll(voteChannel, questionObj, recapChoices = [], random = false) {

    voteInProgress = true;

    // reset / empty the question object
    initQuestionObject();

    let qStr = ''

    // get the allowed reactions
    for (let i = 0; i < questionObj.answers.length; i++) {
        // A CAUSE DE LA FACON DONT NOUS TRAITONS LES RANDOMIZERS, LES OPTIONS DOIVENT TOUJOURS ETRE LES DERNIERES PROPOSEES DANS LE FICHIER JSON
        // SINON IL FAUDRAIT REVOIR LA FACON DONT ON SELECTIONNE/TRAITE LES QUESTIONS ET ... C'EST CHIANT DE REFACTO NON STOP :'(
        if (questionObj.answers[i].function && random) {
            // do nothing when the question has a function callback and it's random time
        } else {
            // store the text for printing the options only if we are not in random mode
            if (!random) {
                qStr += `${emojiCharacters[i + 1]} \`${questionObj.answers[i].title}\`\n`
            }

            question.allowed_emojis.push(emojiCharacters[i + 1]);
        }
    }

    // define text if random
    if (random) {
        question.messages.question = newEmbed('simple')
            .setDescription(`🎲 Tirage au sort ...`)
    } else {
        question.messages.question = newEmbed('vote')
            .setDescription(qStr)
    }

    question.nb_answers = question.allowed_emojis.length;

    // let's go
    voteChannel
        .send(question.messages.question)
        .then(async (q) => {
            try {
                // store objects for later
                question.objs.q = q;
                let unorderedList = [];
                let randomIndex = 0;

                // if not randomizer
                if (!random) {

                    // record reactions posted to the message and filter them to exclude non-allowed symbols & the bot self-posted reactions
                    question.objs.q.awaitReactions(
                        (reaction, user) => question.allowed_emojis.includes(reaction.emoji.name) && user.id != question.objs.q.author.id,
                        {time: maxResponseDelay * 1000}
                    ).then(collectedEmojis => {
                        question.objs.e = collectedEmojis
                    });

                    protectReactions(question.objs.q, question.allowed_emojis)

                    // post all the reactions
                    for (let i = 0; i < question.nb_answers; i++) {
                        await question.objs.q.react(emojiCharacters[i + 1]);
                    }

                    // wait the time minus the 1sec/answer quota that is the usual tick rate for the API
                    await new Promise(done => setTimeout(done, (maxResponseDelay - (awaitEmojiTempoPerSec * question.nb_answers)) * 1000));

                } else {

                    // god of random
                    randomIndex = getRandomInt(1, question.allowed_emojis.length)

                }

                // crawl recorded reactions
                for (let i = 0; i < question.allowed_emojis.length; i++) {

                    let reactionResults = 0

                    if (!random) {

                        // find the reactions
                        let reaction = question.objs.e.find(reaction => reaction.emoji.name === question.allowed_emojis[i]);
                        reactionResults = reaction === null ? 0 : reaction.count - 1

                    } else {

                        reactionResults = (randomIndex == i) ? 100 : 0

                    }

                    // add the results
                    unorderedList.push({
                        "score": reactionResults,
                        "answer": questionObj.answers[i].title,
                        "emoji": question.allowed_emojis[i],
                        "index": i
                    });
                }

                // sort the results
                question.results = unorderedList.sort(function(a,b){return b.score - a.score;});

                // Winner is only when the first in the list have a different score that the second // if not, there is no winner and it's a tie
                if (question.results.length > 1) {

                    // if the best result is not 0 we can continue
                    if (question.results[0].score != 0) {

                        if (question.results[0].score != question.results[1].score) {

                            // winner found! GG WP!
                            question.winner = question.results[0];
                            question.success = true;

                        } else {

                            // tie! randomize the winner *diceroll*
                            let shortList = [];
                            for (let i = 0; i < question.results.length; i++) {
                                if (question.results[i].score == question.results[0].score) {
                                    shortList.push(question.results[i]);
                                }
                            }

                            // elect the randomized winner
                            question.winner = shortList[getRandomInt(0, shortList.length - 1)];
                            question.success = true;
                            question.randomized = true;

                        }

                    }

                } else {

                    // if there is only one choice : just take the first element and stop
                    question.winner = question.results[0];
                    question.success = true;

                }

                let plural = (question.winner.score > 1) ? 's' : '';
                let randomStr = (question.randomized || random) ? 'a été tiré au sort' : 'a remporté les suffrages';

                question.messages.response = (question.success) ? 
                    `> \`${question.winner.answer}\` ${randomStr} (${question.winner.score} vote${plural})` :
                    `> Aucun vote enregistré. Arrêt du sondage.`;

                await voteChannel.send(question.messages.response);

                // why will a random bot wait for ?
                if (!random) {
                    await new Promise(done => setTimeout(done, betweenQuestionsDelay * 1000));
                }

                // if there is a success
                if (question.success) {

                    // record the answer
                    recapChoices.push(question.winner.answer);

                    // if there is another question beyond
                    if (questionObj.answers[question.winner.index].answers.length > 0) {

                        startPoll(voteChannel, questionObj.answers[question.winner.index], recapChoices, random);

                    } else {

                        if (questionObj.answers[question.winner.index].function &&
                            questionObj.answers[question.winner.index].function == "randomVote") {

                            startPoll(voteChannel, questionObj, recapChoices, true)

                        } else {

                            lastParamsStr = recapChoices.join(', ');
                            
                            voteChannel.send(`>>> :white_check_mark: Prochaine partie : \`${lastParamsStr}\`.\n${pubgEmoji} reste un jeu, ne l'oubliez pas 🐔🍳`);

                            // end of poll
                            voteInProgress = false;

                        }
                    }

                } else {

                    voteInProgress = false;

                }

            } catch (error) {

                dumpError(error);

            }

        });
}

function file_exists(filePath) {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.F_OK, (err) => {
            if (err) {
                console.error(err)
                return reject(err);
            }
            //file exists
            resolve();
        }) 
    });
}

function playFile(message, mp3Sound, mp3Voice) {

    return new Promise((resolve, reject) => {

        let prefix = 'teams_'
        let mp3FilePath = appDir + '/../sounds/' + mp3Voice + '/' + prefix + mp3Sound + '.mp3'

        if (file_exists(mp3FilePath)) {

            if (message.member.voiceChannel) {

                message.member.voiceChannel.join()
                    .then(connection => {
        
                    const dispatcher = connection.playFile(mp3FilePath, streamOptions)
                
                    dispatcher.on('end', async (end) => {
    
                        await new Promise(done => setTimeout(done, 5 * 1000));
    
                        connection.disconnect()

                        resolve();
                    })
        
                })
        
            } else {
        
                let err = 'You need to join a voice channel first!'

                message.reply(err);

                return reject(err);

            }

        } else {

            let err = 'File not found ' + mp3FilePath

            message.reply(err);

            return reject(err);

        }
    
    })

}

// checks if the input message is an allowed command or not
// returns an array of arguments and command
function isAllowedCommand(message) {
    let verdict = {
        'args': 0,
        'command': ''
    }

    // crawl authorized commands
    allowedCommands.forEach(allowedCommand => {
        if (message.content.startsWith(allowedCommand.command)) {
            verdict.args = message.content.slice(allowedCommand.command.length + 1).split(' ') // the +1 is for the space after the command
            verdict.command = allowedCommand.command
        }
    })

    return verdict
}

client.on('ready', () => {

    console.log(`INFO | Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        game: {
            name: `Fox, mais t'es où? Pas là`
        }
    })

    // init some things
    voteChannel = client.channels.find(channel => channel.name === pollChannelName);
    vocalChannel = client.channels.find(channel => channel.name === vocalChannelName);
    dispatchChannel = client.channels.find(channel => channel.name === vocalDispatchChannelName);
});

client.on('message', async message => {

    // default values
    let commandScan = isAllowedCommand(message)

    // don't react to bots nor unknown commands
    if (message.author.bot) return
    if (commandScan.command == '') return

    // react only to admins
    if (!message.member.roles.find(r => r.name === adminRoleName)) {
        console.log(`ACL  | Access denied to ${message.member.name} for "${message.content}"`)
        message.author.send(`Vous ne disposez pas du rôle ${adminRoleName} pour utiliser le bot.\nCette tentative a été enregistrée et signalée à un admin.`);
        return;
    }
  
    console.log(`CMD  | ${message.member.displayName} started command "${message.content}"`)

    // need to find the emoji from the guild that is attached to the message
    pubgEmoji = message.guild.emojis.find(emoji => emoji.name === "pubg")

    // do the action
    switch (commandScan.command) {

        case '!voice':



            newVoice = allowedVoices.includes(commandScan.args[0]) ? commandScan.args[0] : ''

            if (newVoice != '') {

                defaultVoice = newVoice

                message.reply(`voix définie à ${newVoice}`)

            }

            break;

        case '!volume':

            let newVolume = commandScan.args[0] ? parseInt(commandScan.args[0]) : 10

            if (newVolume > 100) newVolume = 100

            streamOptions = { volume: newVolume }

            message.reply(`, j'ai mis à jour le volume à ${newVolume}`)

            break;

        case '!status':

            let newStatus = commandScan.args ? commandScan.args.join(' ') : ''

            if (newStatus != '') {

                client.user.setPresence({
                    game: {
                        name: newStatus
                    }
                })

                console.log(`SYS  | Presence updated by ${message.member.name} : ${newStatus}`)

                message.reply(`le message de présence a été mis à jour : ${newStatus}`)

            }

            break;

        case '!mp3':

            // move or not ?
            let mp3Voice = commandScan.args[0]
            let mp3Sound = commandScan.args[1] && commandScan.args[1] != '' ? commandScan.args[1] : defaultVoice
            
            await playFile(message, mp3Sound, mp3Voice)

            break;

        // !vote
        case '!vote':

            // no concurrent votes
            if (!voteInProgress) {

                // reset recapChoices
                recapChoices = [];

                voteChannel.send(`> Démarrage d'un nouveau sondage dans **${startPollDelay} secondes** ...`)
    
                await new Promise(done => setTimeout(done, startPollDelay * 1000));
    
                startPoll(voteChannel, pollQuestions.poll);

            } else {

                message.author.send(`Un vote est déjà en cours. Attendez sa fin ou tapez !stop`);
                
            }

            break;

        // !rematch
        case '!rematch':

            // no concurrent votes & needs some last parameters to vote for
            if (!voteInProgress && lastParamsStr != '') {

                // reset recapChoices
                recapChoices = [];

                voteChannel.send(`>>> Démarrage d'un nouveau sondage dans **${startPollDelay} secondes** ...\nDerniers paramètres : \`${lastParamsStr}\``)
                
                await new Promise(done => setTimeout(done, startPollDelay * 1000));
    
                startPoll(voteChannel, rematchQuestions.poll);

            } else if (lastParamsStr == '') {

                message.author.send(`Impossible de rematch sans disposer des paramètres de la précédente partie.`);

            } else {

                message.author.send(`Un vote est déjà en cours. Attendez sa fin ou tapez !stop`);

            }

            break;

        // !timer
        case '!timer':

            // no concurrent votes
            if (!voteInProgress) {

                let remainingSeconds = Number(commandScan.args[0]) > 0 ? Number(commandScan.args[0]) : defaultCountdownLimit

                let startMessage = newEmbed('medium')
                    .setTitle(`PARTIE CRÉÉE !`)
                    .setDescription(`${emojiCharacters[1]} Rendez-vous dans le menu \`Parties personnalisées\` de ${pubgEmoji}\n${emojiCharacters[2]} Sélectionnez n'importe quel type de partie\n${emojiCharacters[3]} Cherchez le terme \`perso\`\n${emojiCharacters[4]} Rejoignez la partie avec le mot de passe : \`yo\``)
                    .setFooter(`⏰ Vous disposez de ${remainingSeconds} secondes pour rejoindre la partie avant son démarrage.`)

                voteChannel.send(startMessage)
    
                let iteration = 0
    
                while (remainingSeconds > 0) {
    
                    if (iteration > 0) {
                    
                        voteChannel.send(newEmbed('simple').setDescription(`:arrow_right: Il reste **${remainingSeconds} secondes** avant le démarrage de la partie ...`))
    
                    }
    
                    let waitTime = remainingSeconds < countdownStep ? 
                        remainingSeconds : countdownStep
    
                    await new Promise(done => setTimeout(done, waitTime * 1000));
    
                    remainingSeconds -= countdownStep
    
                    iteration++;
                }
    
                voteChannel.send(`>>> :loudspeaker: Démarrage de la partie ...\n${pubgEmoji} reste un jeu, ne l'oubliez pas 🐔🍳`);
    

            } else {

                message.author.send(`Un vote est déjà en cours. Attendez sa fin ou tapez !stop`);
                
            }

            break;
    
        // !aide
        case '!aide':

            // for each globally configured commands
            allowedCommands.forEach(allowedCommand => {

                // send a private message to the author of the command with the command helper
                message.author.send(`\`\`\`${allowedCommand.helper}\n\n${allowedCommand.description}\n\`\`\``);

            })

            break;

        case '!assemble':

            let sourceVocalChannels = getVocalChannelStartingWith(message, vocalTeamChannelWildcard)

            for (let sourceVocalChannel of sourceVocalChannels.values()) {

                await playFile(message, 'before_switch', defaultVoice)

                moveUsers(sourceVocalChannel, vocalChannel, commandScan.command,
                    `La Custom vient de se finir. Vous avez été déplacé vers \`${vocalChannel.name}\`.`) 

            }
            

            break;

        // !teams
        case '!teams':

            // nonsense during the vote : avoid the spam & confusion
            if (!voteInProgress) {

                // announce the randomizer
                voteChannel.send(`>>> Création des équipes aléatoires dans **${startRandomizerDelay} secondes** ...\nConnectez-vous au channel vocal \`${vocalChannelName}\` sans être :mute: pour participer au tirage des équipes.`)

                // wait some time
                await new Promise(done => setTimeout(done, startRandomizerDelay * 1000));

                // get the members currently in the vocal channel
                let currentMembers = []

                // get the max number of teams
                let nbTeams = Number(commandScan.args[0]) > 0 ? Number(commandScan.args[0]) : defaultTeamLimit
            
                // move or not ?
                let movePlayers = commandScan.args[1] == "mv" ? true : false

                // prepare the array of randomized teams (result variable)
                let electedTeams = []

                for (let member of vocalChannel.members.values()) {
                    // if not DJ and not deafened ...
                    if (member.displayName != "DJ" && member.displayName != "CustomVote" && !member.selfDeaf) {
                        currentMembers.push(member.displayName)
                    }
                }

                // if nobody's in the vocal channel ...
                if (currentMembers.length == 0) {
                    voteChannel.send(`> Aucune personne connectée au channel vocal \`${vocalChannelName}\` ...`)
                    return
                }

                // shuffle more the list of current members for more random
                arrayShuffle(currentMembers)

                console.log('CMD  | !teams | Lottery pool : ', currentMembers)

                // we start at team 1, nobody wants to be in team #0 duh!
                // nope! changed that! now we random the first index
                let currentTeam = getRandomInt(1, nbTeams)

                // while we have someone in the lottery pool ...
                while (currentMembers.length > 0) {

                    // let's do some random
                    let electedMemberIndex = getRandomInt(0, currentMembers.length - 1)

                    // get the member name
                    let displayName = currentMembers[electedMemberIndex]

                    console.log(`CMD  | !teams | Team#${currentTeam} gets a new player : ${displayName}`)

                    // check if the team position exists in the final result variable
                    if (!Array.isArray(electedTeams[currentTeam])) {
                        electedTeams[currentTeam] = new Array
                    }

                    // add the member to the team
                    electedTeams[currentTeam].push(displayName)

                    // delete the index in the lottery pool
                    currentMembers.splice(electedMemberIndex, 1)

                    // stop at team limit and start over at first position
                    currentTeam = (currentTeam == nbTeams) ? 1 : currentTeam + 1

                }

                // sort users by name in each team
                for (let i = 1; i < electedTeams.length; i++) {
                    electedTeams[i] = electedTeams[i].sort(function(a,b){return b.score - a.score;})
                }

                let resultMessage = newEmbed('medium')
                let resultStr = ""

                // crawl the result variable by teams
                // ACHTUNG : i does start at 1 and you have to loop over electedTeams and not nbTeams because of the "0" array element that creates itself when doing the first push
                for (let i = 1; i < electedTeams.length; i++) {

                    // join all the names for the printing
                    resultStr += `${emojiCharacters[i]} ${electedTeams[i].join(' :small_blue_diamond: ')} :small_orange_diamond: ${electedTeams[i].length} joueurs\n`

                    console.log('CMD  | !teams | Team ' + i + ' members : ', electedTeams[i])

                }

                // if there is a move demand
                if (movePlayers) {

                    await playFile(message, 'before_switch', defaultVoice)

                    resultStr += `\nDéplacement des joueurs dans les channels vocaux ...`

                    for (let i = 1; i < electedTeams.length; i++) {

                        let targetVocalChannel = getVocalChannelStartingWith(message, vocalTeamChannelWildcard + pad2(i))

                        if (!targetVocalChannel) {
                            console.log(`ERR  | !teams | movePlayers | targetVocalChannel undefined ... stopping`)
                            return
                        }

                        moveUsers(targetVocalChannel.first(), dispatchChannel, commandScan.command,
                            `Tu as été déplacé vers \`${dispatchChannel.name}\` : les joueurs tirés aux sort sont prioritaires sur ces channels vocaux.`)

                        for (let j = 0; j < electedTeams[i].length; j++) {

                            let m = message.guild.members.find(member => member.displayName === electedTeams[i][j])

                            // if the user has not moved in the meantime (or renamed ¯\_(ツ)_/¯)...
                            if (m) {
                                m.setVoiceChannel(targetVocalChannel.first())
                                console.log(`CMD  | !teams | movePlayers | User ${electedTeams[i][j]} moved into vocal channel ${i}`)
                            } else {
                                console.log(`ERR  | !teams | movePlayers | User ${electedTeams[i][j]} not found`)
                            }

                        }
                        
                    }

                }

        		resultMessage
                    .setTitle(`ÉQUIPES CRÉÉES ! ${movePlayers ? 'DÉPLACEMENT DES JOUEURS ...' : ''}`)
                    .setDescription(resultStr)

                // team announcement
                await voteChannel.send(resultMessage)
                await voteChannel.send(`>>> ${pubgEmoji} reste un jeu, ne l'oubliez pas 🐔🍳`);

            }

            break;            
    }

});

// authing to Discord
client.login(auth.token);

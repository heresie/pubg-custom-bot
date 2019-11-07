// requirements
const Discord = require('discord.js');
const auth = require('../credentials/auth.json');
const pollQuestions = require('../polls/customGames.json');
const rematchQuestions = require('../polls/rematchGames.json');
const emojiCharacters = require('./emojiCharacters');

// init
const client = new Discord.Client();

//// specific discord configuration
//const adminRoleName = 'Fondateurs';
//const pollChannelName = 'votes';
//
//// poll timers
//const maxResponseDelay = 10;
//const betweenQuestionsDelay = 3;
//const startPollDelay = 1;

// specific discord configuration
const adminRoleName = 'Responsable Custom';
const pollChannelName = 'custom-vote';
const vocalChannelName = 'En Attente';

// poll timers
const maxResponseDelay = 35;
const betweenQuestionsDelay = 3;
const startPollDelay = 5;
const startRandomizerDelay = 10;

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
let allowedCommands = [
    {
        name: "Liste des commandes disponibles",
        command: '!aide',
        helper: '!aide'
    },
    {
        name: "Démarrage d'un vote de match Custom",
        command: '!vote',
        helper: '!vote'
    },
    {
        name: "Démarrage d'un vote de rematch",
        command: '!rematch',
        helper: '!rematch',
    },
    {
        name: "Démarrage d'un timer avant le démarrage d'une partie",
        command: '!timer',
        helper: '!timer {optionnel: nombre de secondes du décompte}',
    },
    {
        name: "Démarrage d'un randomizer de team avec les personnes connectées au channel vocal",
        command: '!teams',
        helper: '!teams {optionnel: nombre d\'équipes}'
    }
];

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

// randomize array
function arrayShuffle(array) {

    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
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
               .setThumbnail('http://pngimg.com/uploads/pubg/pubg_PNG5.png')
               .setFooter(`⚠️ Les votes réalisés avant l'apparition de toutes les propositions ne seront pas comptabilisés....... ⏰ Vous disposez de ${maxResponseDelay} secondes pour réagir à la question.`, '')
           break;

       case 'medium':
           richEmbed
               .setThumbnail('http://pngimg.com/uploads/pubg/pubg_PNG5.png')
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

                    // post all the reactions
                    for (let i = 0; i < question.nb_answers; i++) {
                        await question.objs.q.react(emojiCharacters[i + 1]);
                    }

                    // record reactions posted to the message and filter them to exclude non-allowed symbols & the bot self-posted reactions
                    question.objs.e = await question.objs.q.awaitReactions(
                        (reaction, user) => question.allowed_emojis.includes(reaction.emoji.name) && user.id != question.objs.q.author.id,
                        {time: maxResponseDelay * 1000}
                    );

                } else {

                    // god of random
                    randomIndex = Math.floor(Math.random() * question.allowed_emojis.length)

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
                            question.winner = shortList[Math.floor(Math.random() * shortList.length)];
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
            name: 'Fox, mais t\'es où? Pas là'
        }
    })

    // init some things
    voteChannel = client.channels.find(channel => channel.name === pollChannelName);
    vocalChannel = client.channels.find(channel => channel.name === vocalChannelName);
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

            let helpMessage = ''

            // for each globally configured commands
            allowedCommands.forEach(allowedCommand => {

                helpMessage += `${allowedCommand.helper}\t${allowedCommand.name}\n`

            })

            // send a private message to the author of the command with the command helper
            message.author.send(`\`\`\`\n${helpMessage}\`\`\``);

            break;

        // !teams
        case '!teams':

            // nonsense during the vote : avoid the spam & confusion
            if (!voteInProgress) {

                // get the members currently in the vocal channel
                let currentMembers = []

                // get the max number of teams
                let nbTeams = Number(commandScan.args[0]) > 0 ? Number(commandScan.args[0]) : defaultTeamLimit

                // prepare the array of randomized teams (result variable)
                let electedTeams = []

                // we start at team 1, nobody wants to be in team #0 duh!
                let currentTeam = 1

                // if nobody's in the vocal channel ...
                if (vocalChannel.members.size == 0) {
                    voteChannel.send(`> Aucune personne connectée au channel vocal \`${vocalChannelName}\` ...`)
                    return
                }

		for (let member of vocalChannel.members.values()) {
                    currentMembers.push(member.displayName)
                }

                // shuffle more the list of current members for more random
                arrayShuffle(currentMembers)

                console.log('CMD  | !teams | Lottery pool : ', currentMembers)

                // announce the randomizer
                voteChannel.send(`>>> Création des équipes aléatoires dans **${startRandomizerDelay} secondes** ...\nConnectez-vous au channel vocal \`${vocalChannelName}\` pour participer au tirage des équipes.`)

                // wait some time
                await new Promise(done => setTimeout(done, startRandomizerDelay * 1000));

                // while we have someone in the lottery pool ...
                while (currentMembers.length > 0) {

                    // let's do some random
                    let electedMemberIndex = Math.floor(Math.random() * currentMembers.length)

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

		let resultMessage = newEmbed('medium')
		let resultStr = ""

                // crawl the result variable by teams
                // ACHTUNG : i does start at 1 and you have to loop over electedTeams and not nbTeams because of the "0" array element that creates itself when doing the first push
                for (let i = 1; i < electedTeams.length; i++) {

                    // join all the names for the printing
                    resultStr += `${emojiCharacters[i]} ${electedTeams[i].join(' :small_blue_diamond: ')} :small_orange_diamond: ${electedTeams[i].length} joueurs\n`

                    console.log('CMD  | !teams | Team ' + i + ' members : ', electedTeams[i])

                }

		resultMessage
                    .setTitle(`ÉQUIPES CRÉÉES !`)
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

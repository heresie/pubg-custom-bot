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

// poll timers
const maxResponseDelay = 35;
const betweenQuestionsDelay = 3;
const startPollDelay = 5;

// countdown timers
const defaultCountdownLimit = 120;
const countdownStep = 30;

// the structure of this object is stored in the initQuestionObject method
let question = {}
let voteInProgress = false;
let pubgEmoji = null;
let lastParamsStr = "";
let voteChannel = null;

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
function startPoll(voteChannel, questionObj, recapChoices = []) {

    voteInProgress = true;

    // reset / empty the question object
    initQuestionObject();

    // get the allowed reactions
    question.nb_answers = questionObj.answers.length;

    for (let i = 0; i < question.nb_answers; i++) {
        question.messages.question += `${emojiCharacters[i + 1]} \`${questionObj.answers[i].title}\`\n`;
        question.allowed_emojis.push(emojiCharacters[i + 1]);
    }

    // let's go
    voteChannel
        .send(question.messages.question)
        .then(async (q) => {
            try {

                question.objs.q = q;
                let unorderedList = [];

                // post all the reactions
                for (let i = 0; i < question.nb_answers; i++) {
                    await question.objs.q.react(emojiCharacters[i + 1]);
                }

                // record reactions posted to the message and filter them to exclude non-allowed symbols & the bot self-posted reactions
                question.objs.e = await question.objs.q.awaitReactions(
                    (reaction, user) => question.allowed_emojis.includes(reaction.emoji.name) && user.id != question.objs.q.author.id,
                    {time: maxResponseDelay * 1000}
                );

                // crawl recorded reactions
                for (let i = 0; i < question.allowed_emojis.length; i++) {
                    // find the reactions
                    let reaction = question.objs.e.find(reaction => reaction.emoji.name === question.allowed_emojis[i]);

                    // add the results
                    unorderedList.push({
                        "score": reaction === null ? 0 : reaction.count - 1,
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

                    } else {

                        // is everybody afk?
                        console.log('Is everybody afk?');

                    }

                } else {

                    // if there is only one choice : just take the first element and stop
                    question.winner = question.results[0];
                    question.success = true;

                }

                let plural = (question.winner.score > 1) ? 's' : '';
                let random = (question.randomized) ? 'a été tiré au sort' : 'a remporté les suffrages';

                question.messages.response = (question.success) ? 
                    `\`${question.winner.answer}\` ${random} (${question.winner.score} vote${plural})` :
                    `Aucun vote enregistré. Arrêt du sondage.`;

                await voteChannel.send(question.messages.response);

                console.log(question);

                await new Promise(done => setTimeout(done, betweenQuestionsDelay * 1000));

                // if there is a success
                if (question.success) {

                    // record the answer
                    recapChoices.push(question.winner.answer);

                    // if there is another question beyond
                    if (questionObj.answers[question.winner.index].answers.length > 0) {

                        startPoll(voteChannel, questionObj.answers[question.winner.index], recapChoices);

                    } else {

                        // end of poll
                        voteInProgress = false;

                        lastParamsStr = recapChoices.join(', ');
                        
                        voteChannel.send(`:white_check_mark: Prochaine partie : \`${lastParamsStr}\`.`);
                        voteChannel.send(`${pubgEmoji} reste un jeu, ne l'oubliez pas 🐔🍳`);

                    }

                } else {

                    voteInProgress = false;

                }

            } catch (error) {

                dumpError(error);

            }

        });
}

client.on('ready', () => {

    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        game: {
            name: 'Fox, mais t\'es où? Pas là'
        }
    })

    // init some things
    voteChannel = client.channels.find(channel => channel.name === pollChannelName);

});

client.on('message', async message => {

    // default values
    let args = []
    let command = ''

    // need to find the emoji from the guild that is attached to the message
    pubgEmoji = message.guild.emojis.find(emoji => emoji.name === "pubg")

    let allowedCommands = [
        {
            name: "Besoin d'aide",
            command: '!help',
            helper: 'Permet de voir les commandes disponibles'
        },
        {
            name: "Démarrage d'un vote de match Custom",
            command: '!vote',
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
        }
    ]

    // crawl authorized commands
    allowedCommands.forEach(allowedCommand => {

        console.log(`Checking if ${message.content} starts with ${allowedCommand.command}`)

        if (message.content.startsWith(allowedCommand.command) && !message.author.bot) {

            console.log('YES')

            args = message.content.slice(allowedCommand.command.length).split(' ')
            command = args.shift().toLowerCase()
    
        }

    })

    // react only to admins
    if (!message.member.roles.find(r => r.name === adminRoleName)) {
        console.log(`[ACCESS DENIED] ${message.member.name} tried to start command "${message.content}"`)
        message.author.send(`Vous ne disposez pas du rôle ${adminRoleName} pour utiliser le bot.\nCette tentative a été enregistrée et signalée à un admin.`);
    }

    // if command unknown
    if (command == '') {
        console.log(`[COMMAND NOT FOUND] ${message.content}`)
        return
    }

    console.log(`[STARTING COMMAND] ${message.member.name} started command "${message.content}"`)

    // do the action
    switch (command) {
        case '!vote':

            // no concurrent votes
            if (!voteInProgress) {

                // reset recapChoices
                recapChoices = [];

                voteChannel.send(`**Démarrage d'un nouveau sondage dans 3 secondes. Délai de vote : ${maxResponseDelay} secondes.**`)
                voteChannel.send(`${emojiCharacters['!']} **__Attention :__** Les votes réalisés avant l'apparition de toutes les propositions ne seront pas comptabilisés.`)
    
                await new Promise(done => setTimeout(done, startPollDelay * 1000));
    
                startPoll(voteChannel, pollQuestions.poll);

            } else {

                message.author.send(`Un vote est déjà en cours. Attendez sa fin ou tapez !stop`);
                
            }

            break;

        case '!rematch':

            // no concurrent votes & needs some last parameters to vote for
            if (!voteInProgress && lastParamsStr != '') {

                voteChannel.send(`**Démarrage d'un nouveau sondage dans 3 secondes. Délai de vote : ${maxResponseDelay} secondes.**`)
                voteChannel.send(`${emojiCharacters['!']} **__Attention :__** Les votes réalisés avant l'apparition de toutes les propositions ne seront pas comptabilisés.`)
                voteChannel.send(`Derniers paramètres : \`${lastParamsStr}\``)
                
                await new Promise(done => setTimeout(done, startPollDelay * 1000));
    
                startPoll(voteChannel, rematchQuestions.poll);

            } else if (lastParamsStr == '') {

                message.author.send(`Impossible de rematch sans disposer des paramètres de la précédente partie.`);

            } else {

                message.author.send(`Un vote est déjà en cours. Attendez sa fin ou tapez !stop`);

            }

            break;

        case '!timer':

            // no concurrent votes
            if (!voteInProgress) {

                let remainingSeconds = Number(args[0]) > 0 ? Number(args[0]) : defaultCountdownLimit

                voteChannel.send(`:information_source: La partie a été créée : trouvez \`perso\` dans le menu \`Parties personnalisées\` de ${pubgEmoji}\n**:alarm_clock: Vous disposez de ${remainingSeconds} secondes pour rejoindre celle-ci avant le démarrage.**`)
    
                let iteration = 0
    
                while (remainingSeconds > 0) {
    
                    if (iteration > 0) {
                    
                        voteChannel.send(`:arrow_right: Il reste ${remainingSeconds} secondes avant le démarrage de la partie ...`)
    
                    }
    
                    let waitTime = remainingSeconds < countdownStep ? 
                        remainingSeconds : countdownStep
    
                    await new Promise(done => setTimeout(done, waitTime * 1000));
    
                    remainingSeconds -= countdownStep
    
                    iteration++;
                }
    
                voteChannel.send(`:loudspeaker: Démarrage de la partie ...`)
    

            } else {

                message.author.send(`Un vote est déjà en cours. Attendez sa fin ou tapez !stop`);
                
            }

        break;

    }

});

// authing to Discord
client.login(auth.token);

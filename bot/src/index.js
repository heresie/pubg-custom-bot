// requirements
const Discord = require('discord.js');
const auth = require('../credentials/auth.json');
const pollQuestions = require('../polls/customGames.json');
const emojiCharacters = require('./emojiCharacters');

// init
const client = new Discord.Client();

// specific discord configuration
const adminRoleName = 'Fondateurs';

// poll timers
const warningDelay        = 5;
const maxResponseDelay    = 20;

// messages
const timerStartMessage   = `:clock1: Vous avez ${maxResponseDelay} secondes pour voter ...`;
const timerWarningMessage = `:alarm_clock: Il vous reste ${warningDelay} secondes avant la fin des votes`;
const timerEndMessage     = `:octagonal_sign: Fin des votes`;

let voteInProgress = false;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        game: {
            name: '!vote'
        }
    })
});

function postQuestion(voteChannel, questionObject) {
    
    let txtQuestion = '';
    let cntQuestion = questionObject.answers.length;
    let allowedAnswers = [];

    for (ix1 = 0; ix1 < cntQuestion; ix1++) {
        txtQuestion += emojiCharacters[ix1 + 1] + ' ' + questionObject.answers[ix1].title + "\n";
        allowedAnswers.push(emojiCharacters[ix1 + 1]);
    }

    // let's go, post first message
    voteChannel
        .send(txtQuestion)
        .then(async(postedMessage) => {
            // post all the reactions
            try {
                for (let c = 0; c < cntQuestion; c++) {
                    await postedMessage.react(emojiCharacters[c + 1]);
                }
            } catch (error) {
                console.log('One of the message reactions could not be processed.');
            }

            // record reactions posted to the message and filter them to exclude non-allowed symbols & the bot self-posted reactions
            const reactions = await postedMessage.awaitReactions(
                (reaction, user) => allowedAnswers.includes(reaction.emoji.name) && user.id != postedMessage.author.id,
                {time: maxResponseDelay * 1000}
            );

//            let countedAnswers = [];
            for (let i = 0; i < allowedAnswers.count; i++) {
//                counterAnswers[allowedAnswers[i]] = reactions.get(allowedAnswers[i]).count;
                console.log(allowedAnswers[i] + ': ' + reactions.get(allowedAnswers[i]).count + ' votes');
                voteChannel.send(allowedAnswers[i] + ': ' + reactions.get(allowedAnswers[i]).count + ' votes');
            }

            console.log(reactions);

        });
/*
        .then(async() => {
            // post the waiting messages
            voteChannel
                .send(timerStartMessage)
                .then(async() => {
                    try {
                        // wait till the timer warning
                        await new Promise(done => setTimeout(done, (maxResponseDelay - warningDelay) * 1000));
                        voteChannel.send(timerWarningMessage);

                        // wait till the end of the question
                        await new Promise(done => setTimeout(done, warningDelay * 1000));
                        voteChannel
                            .send(timerEndMessage)
                            .then(async() => {
                                const reactions = await postedMessage.awaitReactions(reaction => {
                                    return reaction.emoji.name === "toto";
                                }, {time: 10000})
                            });
                    } catch (error) {}
                });
    });*/
}

client.on('message', async message => {

    let firstVote = ":one: Normale (Zone Rapide/Mortelle)\n:two: Course de voiture/moto\n:three: War mode";
    let voteChannel = client.channels.find(channel => channel.name === 'votes');

    // react only on !vote messages
    if (message == '!vote' && !voteInProgress) {

        // react only to admins
        if (!message.member.roles.find(r => r.name === adminRoleName)) {
            message.author.send(`You are not authorized to start a new custom vote.`);
        } else {
            postQuestion(voteChannel, pollQuestions.poll);
        }
    }
});

client.login(auth.token);

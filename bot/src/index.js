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
const maxResponseDelay    = 60;

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

client.on('message', async message => {

    let firstVote = ":one: Normale (Zone Rapide/Mortelle)\n:two: Course de voiture/moto\n:three: War mode";
    let voteChannel = client.channels.find(channel => channel.name === 'votes');

    // react only on !vote messages
    if (message == '!vote' && !voteInProgress) {

        // react only to admins
        if (!message.member.roles.find(r => r.name === adminRoleName)) {
            message.author.send(`You are not authorized to start a new custom vote.`);
        } else {

            let txtQuestion = '';
            let cntQuestion = pollQuestions.poll.answers.length;
            for (ix1 = 0; ix1 < pollQuestions.poll.answers.length; ix1++) {
                question += emojiCharacters[ix1] + ' ' + pollQuestions.poll.answers[ix1].title + "\n";
            }
        
            // let's go, post first message
            voteChannel
                .send(question)
                .then(async(postedMessage) => {
                    // post all the reactions
                    try {
                        for (cnt = 0; cnt < cntQuestion; cnt++) {
                            await postedMessage.react(emojiCharacters[cnt+1]);
                        }
                    } catch (error) {
                        console.log('One of the message reactions could not be processed.');
                    }
                })
                .then(async() => {
                    // post the waiting messages
                    voteChannel
                        .send(timerStartMessage)
                        .then(async() => {
                            try {
                                await new Promise(done => setTimeout(done, (maxResponseDelay - warningDelay) * 1000));
                                voteChannel.send(timerWarningMessage);
                                await new Promise(done => setTimeout(done, warningDelay * 1000));
                                voteChannel.send(timerEndMessage);
                            } catch (error) {}
                        });
            });
        }
    }
});

client.login(auth.token);

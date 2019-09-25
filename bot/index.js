const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./credentials/auth.json');
const emojiCharacters = require('./emojiCharacters');
const adminRoleName = 'Fondateurs';
const warningDelay = 5;
const maxResponseDelay = 60;
const timerStartMessage = `:clock1: Vous avez ${maxResponseDelay} secondes pour voter ...`;
const timerWarningMessage = `:alarm_clock: Il vous reste ${warningDelay} secondes avant la fin des votes`;
const timerEndMessage = `:octagonal_sign: Fin des votes`;

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
    let firstVote = ":one: Normale (Zone Rapide/Mortelle)\n:two: Course de voiture/moto\n:three: War mode'";
    let voteChannel = client.channels.find(channel => channel.name === 'votes');

    // react only on !vote messages
    if (message == '!vote' && !voteInProgress) {
        // react only to admins
        if (!message.member.roles.find(r => r.name === adminRoleName)) {
            message.reply(`You are not authorized to start a new custom vote.`);
        } else {
            voteChannel
                .send(firstVote)
                .then(async(postedMessage) => {
                    try {
                        await postedMessage.react(emojiCharacters[1]);
                        await postedMessage.react(emojiCharacters[2]);
                        await postedMessage.react(emojiCharacters[3]);
                    } catch (error) {
                        console.log('One of the message reactions could not be processed.');
                    }
                })
                .then(async() => {
                    voteChannel.send(timerStartMessage);
                    await new Promise(done => setTimeout(done, (maxResponseDelay - warningDelay) * 1000));
                    voteChannel.send(timerFinishMessage);
                    await new Promise(done => setTimeout(done, warningDelay * 1000));
                    voteChannel.send(timerEndMessage);
                });
        }
    }
});

client.login(auth.token);

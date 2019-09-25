const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./credentials/auth.json');
const emojiCharacters = require('./emojiCharacters');
const adminRoleName = 'Fondateurs';
const timerMessage = ':clock1: Vous avez 60 secondes pour voter ...';

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
                    voteChannel.send(timerMessage);
                    await new Promise(done => setTimeout(done, 5000));
                    voteChannel.send('Fin des votes');
                });
        }
    }
});

client.login(auth.token);

const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./credentials/auth.json');
const adminRoleName = 'Fondateurs';



let voteInProgress = false;



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        game: {
            name: '!vote'
        }
    })
});

client.on('message', function(message) {
    let firstVote = ":one: Normale (Zone Rapide/Mortelle)\n:two: Course de voiture/moto\n:three: War mode'";

    let emojiOne   = '\:one:';
    let emojiTwo   = '\:two:';
    let emojiThree = '\:three:';

    let voteChannel = client.channels.find(channel => channel.name === 'votes');

    // react only on !vote messages
    if (message == '!vote' && !voteInProgress) {
        // react only to admins
        if (!message.member.roles.find(r => r.name === adminRoleName)) {
            message.reply(`You are not authorized to start a new custom vote.`);
        } else {
            console.log(emojiOne);

            voteChannel
                .send(firstVote)
                .then(postedMessage => {
                    postedMessage
                        .react(emojiOne)
                        .react(emojiTwo)
                        .react(emojiThree);
                });
        }
    }
});

client.login(auth.token);

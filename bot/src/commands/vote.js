const CustomVote = require('../libs/vote.js')

exports.cmd           = `!vote`
exports.helper        = `!vote`
exports.description   = `Démarre un vote de partie Custom`
exports.roles         = ['Responsable Custom']

exports.run = async (client, message, args) => {

    if (!client.tools.isLockedChannel(client, message.channel)) {

        let customVote = new CustomVote(client, message, client.polls.default.poll, [], false)
        customVote.start(true)

    } else {

        message.author.send(`un vote est déjà en cours dans ce channel`)

    }
    
}
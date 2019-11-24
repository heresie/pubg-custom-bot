const CustomVote = require('../libs/vote.js')

exports.cmd           = `!rematch`
exports.helper        = `!rematch`
exports.description   = `Relance la précédente partie`
exports.roles         = ['Responsable Custom']

exports.run = (client, message, args) => {

    console.log(client.config.customs.lastParams)
    console.log(client.config.customs.inProgress)

    // no concurrent votes & needs some last parameters to vote for
    if (client.tools.isLockedChannel(client, message.channel)) {
        message.author.send(`un vote est déjà en cours dans ce channel`)
        return false
    }

    if (client.tools.getMeta(client, 'lastParams', message.channel.id) == '') {

        message.author.send(`impossible de rematch sans disposer des paramètres de la précédente partie.`);
        return false;
    }

    let customVote = new CustomVote(client, message, client.polls.rematch.poll, [], false)
    customVote.start(true, client.tools.getMeta(client, 'lastParams', message.channel.id))

}

exports.cmd           = `!assemble`
exports.helper        = `!assemble`
exports.description   = `Rappatrie les joueurs des équipes Teams`
exports.roles         = ['Responsable Custom']

exports.run = async (client, message, args) => {

    // channels
    const vocalChannel = client.channels.find(channel => channel.name === client.config.channels.vocalChannelName);
    const sourceVocalChannels = client.tools.getVocalChannelStartingWith(message, client.config.channels.vocalTeamChannelWildcard)

    for (let sourceVocalChannel of sourceVocalChannels.values()) {

        client.tools.moveUsers(sourceVocalChannel, vocalChannel, 'assemble')

    }

    message.channel.send(`> La partie est finie. Vous venez d'être déplacé vers ${vocalChannel.name}.`)

}

exports.cmd           = `!assemble`
exports.helper        = `!assemble`
exports.description   = `Rappatrie les joueurs des équipes Teams`
exports.roles         = ['Responsable Custom']

exports.run = async (client, message, args) => {

    // channels
    const vocalChannel = client.channels.find(channel => channel.name === client.config.channels.vocalChannelName);
    const sourceVocalChannels = client.tools.getVocalChannelStartingWith(message, client.config.channels.vocalTeamChannelWildcard)

    for (let sourceVocalChannel of sourceVocalChannels.values()) {

        //await client.tools.playFile(client, message, 'end_game', client.config.voice.currentVoice)

        client.tools.moveUsers(sourceVocalChannel, vocalChannel, 'assemble',
            `La Custom vient de se finir. Vous avez été déplacé vers \`${vocalChannel.name}\`.`) 

    }

    message.channel.send(`> La partie est finie. Vous venez d'être déplacé vers ${vocalChannel.name}.`)

}

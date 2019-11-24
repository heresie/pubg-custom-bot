exports.cmd           = `!volume`
exports.helper        = `!volume <integer>`
exports.description   = `Modifie le volume audio du Bot`
exports.roles         = ['Responsable Custom']

exports.run = (client, message, args) => {

    let newVolume = args[0] ? parseInt(args[0]) : client.config.voice.defaultVolume

    if (newVolume > 50) newVolume = client.config.voice.defaultVolume

    client.config.voice.streamOptions.volume = newVolume

    message.reply(`le volume du Bot est désormais \`${client.config.voice.streamOptions.volume}\``)

    console.log(`CMD  | ${exports.cmd} | {${message.member.displayName}} changed volume to {${client.config.voice.streamOptions.volume}}`)

}

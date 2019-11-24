exports.cmd           = `!voice`
exports.helper        = `!voice <name>`
exports.description   = `Change la voix utilisée par le Bot`
exports.roles        = ['Responsable Custom']

exports.run = (client, message, args) => {

    if (args[0] && client.config.voice.allowedVoices.includes(args[0])) {

        client.config.currentVoice = args[0]
        message.reply(`la voix du Bot est désormais \`${client.config.currentVoice}\``)

        console.log(`CMD  | ${exports.cmd} | {${message.member.displayName}} changed voice to {${client.config.currentVoice}}`)

    } else {

        message.reply(`tu dois choisir une voix parmis la liste suivante : ${client.config.voice.allowedVoices.join(', ')}`)

    }

}

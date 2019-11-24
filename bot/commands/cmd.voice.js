/**
 * Module de commande !voice
 */

module.exports = {

    // Module helpers
    command: `!voice`,
    helper: `!voice <${allowedVoices.join('|')}>`,
    description: `Change la voix utilisée par le Bot. Options possibles : ${allowedVoices.join(', ')}`,

    // Allowed Voices
    allowedVoices: ['default', 'taverne', 'joyeux'],

    // Current voice
    currentVoice: 'default',

    // handler for the command
    handler(message, commandScan) {

        if (commandScan.args[0] && allowedVoices.includes(commandScan.args[0])) {

            currentVoice = commandScan.args[0]
            message.reply(`la voix du Bot est désormais ${currentVoice}`)

        } else {

            message.reply(`tu dois choisir une voix parmis la liste suivante : ${allowedVoices.join(', ')}`)

        }

    }

}
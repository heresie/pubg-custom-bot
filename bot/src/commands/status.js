exports.cmd           = `!status`
exports.helper        = `!status <status>`
exports.description   = `Modifie le message de statut du Bot`
exports.roles        = ['Fondateur', 'Référent Technique']

exports.run = (client, message, args) => {

    let newStatus = args ? args.join(' ') : ''

    client.user.setPresence({
        game: {
            name: newStatus
        }
    })

    console.log(`CMD  | ${exports.cmd} | {${message.member.displayName}} changed status to {${newStatus}}`)

    message.reply(`le message de statut est désormais \`${newStatus}\``)

}

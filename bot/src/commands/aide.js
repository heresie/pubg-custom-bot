exports.cmd           = `!aide`
exports.helper        = `!aide`
exports.description   = `Affiche l'aide des commandes du Bot`
exports.roles        = ['Responsable Custom']

exports.run = (client, message, args) => {

    client.commands.forEach((value, key, map) => {

        // send a private message to the author of the command with the command helper
        message.author.send(`\`\`\`${value.helper}\n\n${value.description}\n\`\`\``);

    })

}

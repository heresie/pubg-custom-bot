exports.cmd           = `!timer`
exports.helper        = `!timer <seconds>`
exports.description   = `Créé un timer de <seconds>`
exports.roles        = ['Responsable Custom']

exports.run = async (client, message, args) => {

    if (!client.config.customs.inProgress.includes(message.channel.id)) {

        let remainingSeconds = Number(args[0]) > 0 ? Number(args[0]) : client.config.delays.defaultCountdownLimit

        // need to find the emoji from the guild that is attached to the message
        pubgEmoji = message.guild.emojis.find(emoji => emoji.name === "pubg") ? message.guild.emojis.find(emoji => emoji.name === "pubg") : 'PUBG'

        let startMessage = client.tools.newEmbed(client, 'medium')
            .setTitle(`PARTIE CRÉÉE !`)
            .setDescription(`${client.customEmojis[1]} Rendez-vous dans le menu \`Parties personnalisées\` de ${pubgEmoji}\n${client.customEmojis[2]} Sélectionnez n'importe quel type de partie\n${client.customEmojis[3]} Cherchez le terme \`perso\`\n${client.customEmojis[4]} Rejoignez la partie avec le mot de passe : \`yo\``)
            .setFooter(`⏰ Vous disposez de ${remainingSeconds} secondes pour rejoindre la partie avant son démarrage.`)

        message.channel.send(startMessage)

        let iteration = 0

        while (remainingSeconds > 0) {

            if (iteration > 0) {
            
                message.channel.send(client.tools.newEmbed(client, 'simple').setDescription(`:arrow_right: Il reste **${remainingSeconds} secondes** avant le démarrage de la partie ...`))

            }

            let waitTime = remainingSeconds < client.config.delays.countdownStep ? 
                remainingSeconds : client.config.delays.countdownStep

            await new Promise(done => setTimeout(done, waitTime * 1000));

            remainingSeconds -= client.config.delays.countdownStep

            iteration++;
        }

        message.channel.send(`>>> :loudspeaker: Démarrage de la partie ...`);

    }

}
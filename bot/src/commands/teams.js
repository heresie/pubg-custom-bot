exports.cmd           = `!teams`
exports.helper        = `!teams <status> <?move>`
exports.description   = `Créé des équipes aléatoires et déplace les joueurs si l'option move est activée`
exports.roles        = ['Responsable Custom']

exports.run = async (client, message, args) => {

    // need to find the emoji from the guild that is attached to the message
    const pubgEmoji = message.guild.emojis.find(emoji => emoji.name === "pubg") ? message.guild.emojis.find(emoji => emoji.name === "pubg") : 'PUBG'

    // channels
    const vocalChannel = client.channels.find(channel => channel.name === client.config.channels.vocalChannelName);
    const dispatchChannel = client.channels.find(channel => channel.name === client.config.channels.vocalDispatchChannelName);

    if (!vocalChannel || !dispatchChannel) {
        message.reply(`Channel {${client.config.channels.vocalChannelName}} ou {${client.config.channels.vocalDispatchChannelName}}`)
        return
    }

    // announce the randomizer
    message.channel.send(`>>> Création des équipes aléatoires dans **${client.config.delays.startRandomizerDelay} secondes** ...\nConnectez-vous au channel vocal \`${client.config.channels.vocalChannelName}\` sans être :mute: pour participer au tirage des équipes.`)

    // wait some time
    await new Promise(done => setTimeout(done, client.config.delays.startRandomizerDelay * 1000));

    // get the members currently in the vocal channel
    let currentMembers = []

    // get the max number of teams
    let nbTeams = Number(args[0]) > 0 ? Number(args[0]) : client.config.delays.defaultTeamLimit

    // move or not ?
    let movePlayers = args[1] == "mv" ? true : false

    // prepare the array of randomized teams (result variable)
    let electedTeams = []

    for (let member of vocalChannel.members.values()) {
        // if not DJ and not deafened ...
        if (member.displayName != "DJ" && member.displayName != "CustomVote" && !member.selfDeaf) {
            currentMembers.push(member.displayName)
        }
    }

    // if nobody's in the vocal channel ...
    if (currentMembers.length == 0) {
        message.channel.send(`> Aucune personne connectée au channel vocal \`${client.config.channels.vocalChannelName}\` ...`)
        return
    }

    // shuffle more the list of current members for more random
    client.tools.arrayShuffle(currentMembers)

    console.log('CMD  | !teams | Lottery pool : ', currentMembers)

    // we start at team 1, nobody wants to be in team #0 duh!
    // nope! changed that! now we random the first index
    let currentTeam = client.tools.getRandomInt(1, nbTeams)

    // while we have someone in the lottery pool ...
    while (currentMembers.length > 0) {

        // let's do some random
        let electedMemberIndex = client.tools.getRandomInt(0, currentMembers.length - 1)

        // get the member name
        let displayName = currentMembers[electedMemberIndex]

        console.log(`CMD  | !teams | Team#${currentTeam} gets a new player : ${displayName}`)

        // check if the team position exists in the final result variable
        if (!Array.isArray(electedTeams[currentTeam])) {
            electedTeams[currentTeam] = new Array
        }

        // add the member to the team
        electedTeams[currentTeam].push(displayName)

        // delete the index in the lottery pool
        currentMembers.splice(electedMemberIndex, 1)

        // stop at team limit and start over at first position
        currentTeam = (currentTeam == nbTeams) ? 1 : currentTeam + 1

    }

    // sort users by name in each team
    for (let i = 1; i < electedTeams.length; i++) {
        electedTeams[i] = electedTeams[i].sort(function(a,b){return b.score - a.score;})
    }

    let resultMessage = client.tools.newEmbed(client, 'medium')
    let resultStr = ""

    // crawl the result variable by teams
    // ACHTUNG : i does start at 1 and you have to loop over electedTeams and not nbTeams because of the "0" array element that creates itself when doing the first push
    for (let i = 1; i < electedTeams.length; i++) {

        // join all the names for the printing
        resultStr += `${client.customEmojis[i]} ${electedTeams[i].join(' :small_blue_diamond: ')} :small_orange_diamond: ${electedTeams[i].length} joueurs\n`

        console.log('CMD  | !teams | Team ' + i + ' members : ', electedTeams[i])

    }

    // if there is a move demand
    if (movePlayers) {

        await client.tools.playFile(client, message, 'teams_before_switch', client.config.voice.currentVoice, 10).catch((error) => { console.log(`DEBG | File not found ${error}`)  })

        resultStr += `\nDéplacement des joueurs dans les channels vocaux ...`

        for (let i = 1; i < electedTeams.length; i++) {

            let targetVocalChannel = client.tools.getVocalChannelStartingWith(message, client.config.channels.vocalTeamChannelWildcard + client.tools.pad2(i))

            if (!targetVocalChannel) {
                console.log(`ERR  | !teams | movePlayers | targetVocalChannel undefined ... stopping`)
                return
            }

            client.tools.moveUsers(targetVocalChannel.first(), dispatchChannel, '!teams',
                `Tu as été déplacé vers \`${dispatchChannel.name}\` : les joueurs tirés aux sort sont prioritaires sur ces channels vocaux.`)

            for (let j = 0; j < electedTeams[i].length; j++) {

                let m = message.guild.members.find(member => member.displayName === electedTeams[i][j])

                // if the user has not moved in the meantime (or renamed ¯\_(ツ)_/¯)...
                if (m) {
                    m.setVoiceChannel(targetVocalChannel.first())
                    console.log(`CMD  | !teams | movePlayers | User ${electedTeams[i][j]} moved into vocal channel ${i}`)
                } else {
                    console.log(`ERR  | !teams | movePlayers | User ${electedTeams[i][j]} not found`)
                }

            }
            
        }

    }

    resultMessage
        .setTitle(`ÉQUIPES CRÉÉES ! ${movePlayers ? 'DÉPLACEMENT DES JOUEURS ...' : ''}`)
        .setDescription(resultStr)

    // team announcement
    await message.channel.send(resultMessage)
    await message.channel.send(`>>> ${pubgEmoji} reste un jeu, ne l'oubliez pas 🐔🍳`);

}

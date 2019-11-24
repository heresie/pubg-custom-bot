const Discord = require('discord.js')
const fs = require('fs')

module.exports = {
 
    getRandomInt(min, max) {

        return Math.floor(Math.random() * (max - min + 1) + min)
        
    },

    newEmbed(client, type) {

        let richEmbed = new Discord.RichEmbed()
                           .setColor('#0099ff')
    
        switch (type) {
    
           case 'simple':
               break;
    
           case 'vote':
               richEmbed
                   .setThumbnail(client.config.images.embed.vote)
                   .setFooter(`⏰ Vous disposez de ${client.config.delays.maxResponseDelay} secondes pour réagir à la question.`, '')
               break;
    
           case 'medium':
               richEmbed
                   .setThumbnail(client.config.images.embed.medium)
               break;
    
           default:
               break;
        }
    
        return richEmbed;

    },

    arrayShuffle(array) {

        var currentIndex = array.length, temporaryValue, randomIndex
    
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
    
            // Pick a remaining element...
            randomIndex = this.getRandomInt(0, currentIndex)
            currentIndex -= 1
    
            // And swap it with the current element.
            temporaryValue = array[currentIndex]
            array[currentIndex] = array[randomIndex]
            array[randomIndex] = temporaryValue
        }
    
        return array;
    },

    file_exists(filePath) {
        return new Promise((resolve, reject) => {
            fs.access(filePath, fs.F_OK, (err) => {
                if (err) {
                    return reject(err)
                }
                //file exists
                resolve()
            }) 
        })
    },

    playFile(client, message, mp3Sound, mp3Folder, volume = null) {

        return new Promise((resolve, reject) => {
    
            let mp3FilePath = client.appDir + '/../sounds/' + mp3Folder + '/' + mp3Sound + '.mp3'
    
            this.file_exists(mp3FilePath).then(() => {
    
                if (message.member.voiceChannel) {
    
                    message.member.voiceChannel.join()
                        .then(connection => {
            
                        let streamOptions = client.config.voice.streamOptions

                        if (volume) {
                            streamOptions.volume = volume
                            console.log(`EMIT | Temporily setting volume to {${volume}}`)
                        }

                        const dispatcher = connection.playFile(mp3FilePath, streamOptions)
                    
                        console.log(`EMIT | Playing {${mp3FilePath.replace(/^.*[\\\/]/, '')}} to {${message.member.voiceChannel.name}}`)

                        dispatcher.on('end', async (end) => {
        
                            await new Promise(done => setTimeout(done, 0.5 * 1000))
        
                            connection.disconnect()
    
                            resolve()
                        })
            
                    })
            
                } else {
            
                    let err = 'You need to join a voice channel first!'
    
                    message.reply(err)
    
                    return reject(err)
    
                }
            
            }).catch((error) => {

                let err = 'File not found ' + mp3FilePath

                console.log(`EMIT | File not found {${mp3FilePath}}`)

                return reject(err);

            })
             
        })
    
    },

    moveUsers(v, d, c, reason) {

        console.log(`MOVE | ${c} | Moving users from ${v.name} to ${d.name}`)
    
        for (let member of v.members.values()) {
    
            if (reason) member.send(reason)
    
            member.setVoiceChannel(d)
    
        }
    },
    
    getVocalChannelStartingWith(message, channelStartString) {

        return message.guild.channels.filter(channel => channel.type === 'voice' && channel.name.startsWith(channelStartString))
    
    },

    pad2(nb) {

        return (nb < 10 ? '0' : '') + nb

    },

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    },

    setMeta(client, name, key, value) {
        console.log(`DEBG | Meta->set(${name}.${key}, ${value})`)
        client.config[name] = {[key]: value}
        console.log(client.config[name])
    },

    getMeta(client, name, key) {
        console.log(`DEBG | Meta->get(${name}.${key})`)
        console.log(client.config[name][key])
        return (client.config[name][key]) ? client.config[name][key] : ''
    },

    lockChannel(client, channel) {
        console.log(`DEBG | Locking Channel ${channel.id}`)
        client.config.customs.inProgress.push(channel.id)
    },

    isLockedChannel(client, channel) {
        console.log(`DEBG | Checking Lock Channel ${channel.id}`)
        return client.config.customs.inProgress.includes(channel.id)
    },

    unlockChannel(client, channel) {
        console.log(`DEBG | Unlocking Channel ${channel.id}`)
        client.config.customs.inProgress.splice(client.config.customs.inProgress.indexOf(channel.id), 1)
    }
    
}

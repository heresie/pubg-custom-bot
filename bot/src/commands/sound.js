const path = require('path');
const fs = require('fs');

exports.cmd           = `!sound`
exports.helper        = `!sound <fichier|list> <?categorie>`
exports.description   = `Lance un son sur votre channel vocal`
exports.roles         = ['Fondateur', 'Référent Technique']

exports.run = async (client, message, args) => {

    if (args[0] == "list") {

        fs.readdir(client.appDir + '/../sounds', function (err, folders) {

            let listTxt = `voici les sons disponibles : \n`

            //handling error
            if (err) {
                return console.log('ERR  | Unable to scan directory: ' + err)
            } 

            folders.forEach(function(folder) {

                fs.readdir(client.appDir + '/../sounds/' + folder, function (err, files) {

                    //handling error
                    if (err) {
                        return console.log('ERR  | Unable to scan directory: ' + err)
                    } 

                    let listTxt = `catégorie \`${folder}\` : `

                    //listing all files using forEach
                    files.forEach(function (file) {
                        // Do whatever you want to do with the file

                        listTxt += `\`${file.split('.')[0]}\` `
                    })
    
                    message.reply(listTxt)

                })

            })

        })

    } else {

        // move or not ?
        let mp3Sound = args[0]
        let mp3Folder = args[1] && args[1] != '' ? args[1] : 'soundboard'
        let mp3Volume = client.config.voice.defaultVolume
        
        await client.tools.playFile(client, message, mp3Sound, mp3Folder, mp3Volume).catch((error) => {
            message.reply(`Le fichier n'a pas été trouvé`)
        })

    }

}

exports.cmd           = `!sound`
exports.helper        = `!sound`
exports.description   = `Lance un son sur votre channel vocal`
exports.roles         = ['Fondateur', 'Référent Technique']

exports.run = async (client, message, args) => {

    // move or not ?
    let mp3Sound = args[0]
    let mp3Voice = args[1] && args[1] != '' ? args[1] : 'soundboard'

    await client.tools.playFile(client, message, mp3Sound, mp3Voice)

}

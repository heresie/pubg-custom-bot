// External libraries
const Discord = require('discord.js')
const Enmap = require('enmap')
const fs = require('fs')
const path = require('path')
var appDir = path.dirname(require.main.filename)

// init Discord client and create empty command map
const client = new Discord.Client()
const debug = require('./libs/debug.js')

// save objets in client for later usage
client.commands = new Enmap()
client.auth = require('./config/credentials.json')
client.config = require('./config/config.json')
client.appDir = path.dirname(require.main.filename)
client.customEmojis = require('./config/emojiCharacters')
client.tools = require('./libs/tools.js')
client.polls = {
    default: require('../polls/customGames.json'),
    rematch: require('../polls/rematchGames.json')
}

// Load all events
fs.readdir(`${appDir}/events/`, (err, files) => {

    if (err) return console.error(err)

    files.forEach(file => {

        if (!file.endsWith(".js")) return

        const event = require(`./events/${file}`)

        let eventName = file.split(".")[0]

        console.log(`INIT  | Loading event {${eventName}}`)

        // super-secret recipe to call events with all their proper arguments *after* the `client` var.
        // without going into too many details, this means each event will be called with the client argument,
        // followed by its "normal" arguments, like message, member, etc etc.
        // This line is awesome by the way. Just sayin'.
        client.on(eventName, event.bind(null, client))

        delete require.cache[require.resolve(`./events/${file}`)]

    });

});

// Load all commands
fs.readdir(`${appDir}/commands/`, (err, files) => {

    if (err) return console.error(err)

    files.forEach(file => {

        if (!file.endsWith(".js")) return

        let props = require(`./commands/${file}`)

        let commandName = file.split(".")[0]

        console.log(`INIT  | Loading command {${commandName}}`)

        // Here we simply store the whole thing in the command Enmap. We're not running it right now.
        client.commands.set(commandName, props)

    });

});

// Starting the Discord Bot with authentication token
client.login(client.auth.token)

module.exports = (client, message) => {
    
    // Ignore all bots
    if (message.author.bot) return
  
    // Ignore messages not starting with the prefix (in config.json)
    if (message.content.indexOf(client.config.prefix) !== 0) return
  
    // Our standard argument/command name definition.
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g)
    const command = args.shift().toLowerCase()
  
    // Grab the command data from the client.commands Enmap
    const cmd = client.commands.get(command)
  
    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return
  
    // if there is a role definition in the command
    if (cmd.roles.length == 0) {

        allowedCommand = true

    } else {

        allowedCommand = false

        cmd.roles.forEach(role => {

            if (message.member.roles.find(r => r.name === role)) {

                allowedCommand = true

            }

        })

    }

    if (!allowedCommand) {

        console.log(`ACL  | Access denied to {${message.member.displayName}} for {${command}}`)

        return message.author.send(`Vous ne disposez pas de droits suffisants pour utiliser cette command.`)

    }
  
    console.log(`CMD  | {${message.member.displayName}} started command {${command}}`)

    // Run the command
    cmd.run(client, message, args)
};
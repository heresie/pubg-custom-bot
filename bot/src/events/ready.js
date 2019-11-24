module.exports = (client, message) => {

    console.log(`INFO | ${client.user.tag} logged in!`);

    client.user.setPresence({
        game: {
            name: client.config.defaultStatus
        }
    })

};
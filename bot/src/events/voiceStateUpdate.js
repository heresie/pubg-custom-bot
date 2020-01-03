module.exports = async (client, oldMember, newMember) => {

    // configuration ... TODO : externalize
    let dispatchChannelName = 'Dispatch'
    let userChannelWildcard = 'Equipe - '
    let categoryName = 'Auto-Teams [BETA]'

    // let's do some ifs with simpler variable names
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel

    // if a user leaves a customChannel 
    if (oldUserChannel && oldUserChannel.name.startsWith(userChannelWildcard)) {

        // get proper variables
        let member = oldMember
        let channel = oldUserChannel

        // if nobody left inside the customChannel
        if (channel && (!channel.members || (channel.members && channel.members.size === 0))) {

            console.log(`EVENT | voiceStateUpdate | ${member.displayName} left ${channel.name} and the channel is empty, deleting channel.`)

            // delete the channel
            return channel.delete(`Temporary channel empty`)

        }

        return
    }

    // creation
    if (newUserChannel && (newUserChannel.name === dispatchChannelName)) {

        // get proper variables
        let member = newMember
        let channel = newUserChannel

        //works? let existingChannel = null
        let customChannelName = `${userChannelWildcard} ${member.displayName}`
        
        // await the potential previous channel deletion ...
        await new Promise(done => setTimeout(done, 1 * 1000))

        console.log(`EVENT | voiceStateUpdate | ${member.displayName} entered Dispatch channel.`)

        // check if a channel with that name already exists
        if ((existingChannel = client.channels.find(channel => channel.type === "voice" && channel.name === customChannelName))) {

            console.log(`EVENT | voiceStateUpdate | ${customChannelName} exists, moving user inside.`)

            return member.setVoiceChannel(existingChannel)

        } 

        // need the categoryChannel for the good position of the customChannel
        let categoryChannel = client.channels.find(channel => channel.type === "category" && channel.name === categoryName)
    
        // need the dispatchChannel
        let dispatchChannel = client.channels.find(channel => channel.type === "voice" && channel.name === dispatchChannelName)

        // get all the customChannel
        let customChannels = client.channels.find(channel => channel.type === "voice" && channel.name && channel.name.startsWith(userChannelWildcard))

        // determine the future position of the channel
        let channelPosition = (dispatchChannel ? dispatchChannel.position : 0) + (customChannels ? customChannels.length : 0) + 1

        // create the channel
        member.guild.createChannel(
            customChannelName,
            {
                "type": "voice",
                "position": channelPosition,
                "parent": categoryChannel.id,
                "bitrate": 64000,
                "userLimit": 10
            },
            [
                {	//make creator of channel owner (aka gib perms)
                    type: "member",
                    id: newMember.id,
                    allow: 17825808
                },
                {	//hide for everyone temporarily so the channel list doesn't fucking earthquake like a diabetic after downing 3 monsters - this is a permament temporary workaround until D.JS v12 gets released
                    type: "role",
                    id: newMember.guild.defaultRole,
                    deny: 1024
                }
            ],
            (`Created by ${newMember.displayName} via Dispatch channel`)
        ).then(customChannel => {

            console.log(`EVENT | voiceStateUpdate | ${customChannel.name} created, moving user indide.`)

            // move the user
            member.setVoiceChannel(customChannel)

        })

    }

}

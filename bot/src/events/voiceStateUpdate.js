module.exports = async (client, oldMember, newMember) => {

    let dispatchChannelName = 'Dispatch'
    let userChannelWildcard = 'Equipe - '
    let categoryName = 'Auto-Teams [BETA]'

    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel

    // deletion
    if (oldUserChannel && oldUserChannel.name.startsWith(userChannelWildcard)) {

        let member = oldMember
        let channel = oldUserChannel

        if (channel && (!channel.members || (channel.members && channel.members.size === 0))) {

            console.log(`${member.displayName} left ${channel.name} and the channel is empty : deleting`)
            channel.delete(`Temporary channel empty`)

        }

    }

    // creation
    if (newUserChannel && (newUserChannel.name === dispatchChannelName)) {

        let member = newMember
        let channel = newUserChannel

        let channelName = `${userChannelWildcard} ${member.displayName}`
        let customChannels = client.channels.find(channel => channel.name.startsWith(userChannelWildcard))
        let nbCustomChannels = customChannels ? customChannels.length : 0
        let channelPosition = client.channels.find(channel => channel.name === dispatchChannelName).position + (nbCustomChannels + 1);
        let categoryChannel = client.channels.find(channel => channel.type === "category" && channel.name === categoryName)

        await new Promise(done => setTimeout(done, 1 * 1000))

        let existingChannel = client.channels.find(channel => channel.type === "voice" && channel.name === channelName)

        if (existingChannel) {

            member.setVoiceChannel(existingChannel)

        } else {

            member.guild.createChannel(
                channelName,
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
                (`Created by ${newMember.displayName} via /create command`)
            ).then(moveChannel => {

                member.setVoiceChannel(moveChannel)

            })

        }
    }

}

module.exports = class CustomVote {

    // init the question object
    newQuestion() {
        return {
            "nb_answers": 0,
            "allowed_emojis": [],
            "objs": {
                "q": {},
                "e": {}
            },
            "results": [],
            "winner": {},
            "messages": {
                "response": "",
                "question": "",
            },
            "randomized": false,
            "success": false
        }
    }

    // init the vote object
    constructor(client, message, qObj, recapChoices = [], random = false) {

        // init root objects & global scope variables
        this.client = client
        this.message = message
        this.qObj = qObj
        this.recapChoices = recapChoices
        this.random = random
        
        this.question = this.newQuestion()
        this.voteChannel = message.channel
        this.saveStatus = true

        // function variables
        let qStr = ''

        // get the allowed reactions
        for (let i = 0; i < this.qObj.answers.length; i++) {
            // A CAUSE DE LA FACON DONT NOUS TRAITONS LES RANDOMIZERS, LES OPTIONS DOIVENT TOUJOURS ETRE LES DERNIERES PROPOSEES DANS LE FICHIER JSON
            // SINON IL FAUDRAIT REVOIR LA FACON DONT ON SELECTIONNE/TRAITE LES QUESTIONS ET ... C'EST CHIANT DE REFACTO NON STOP :'(
            if (this.qObj.answers[i].function && this.random) {
                // do nothing when the question has a function callback and it's random time
            } else {
                // store the text for printing the options only if we are not in random mode
                if (!this.random) {
                    qStr += `${this.client.customEmojis[i + 1]} \`${this.qObj.answers[i].title}\`\n`
                }
    
                this.question.allowed_emojis.push(client.customEmojis[i + 1])
            }
        }

        // define text if random
        if (this.random) {
            this.question.messages.question = client.tools.newEmbed(this.client, 'simple')
                .setDescription(`🎲 Tirage au sort ...`)
        } else {
            this.question.messages.question = client.tools.newEmbed(this.client, 'vote')
                .setDescription(qStr)
        }
    
        this.question.nb_answers = this.question.allowed_emojis.length

        // need to find the emoji from the guild that is attached to the message
        this.pubgEmoji = message.guild.emojis.find(emoji => emoji.name === "pubg") ? message.guild.emojis.find(emoji => emoji.name === "pubg") : 'PUBG'

    }

    async protectReactions(message, allowedEmojis) {

        const collector = message.createReactionCollector(
            (reaction, user) => !user.bot && (!allowedEmojis.includes(reaction.emoji.name)),
            {time: this.client.config.delays.maxResponseDelay * 10 * 1000}
        );
    
        collector.on('collect', (r) => {
            r.remove(r.users.first())
    
            console.log(`PROT | Blocked unsollicited reaction on bot message`)
        });
        
    }

    // run a vote
    async start(first = false, lastParams = '') {

        let startMessage = `>>> Démarrage d'un nouveau sondage dans **${this.client.config.delays.startPollDelay} secondes** ...`

        if (lastParams != '') {
            startMessage += `\nDerniers paramètres : \`${lastParams}\``
            this.saveStatus = false
        }

        if (first) {

            this.client.tools.lockChannel(this.client, this.message.channel)

            this.voteChannel.send(startMessage)
       
            await new Promise(done => setTimeout(done, this.client.config.delays.startPollDelay * 1000))
    
        }

        // let's go
        this.question.objs.q = await this.voteChannel.send(this.question.messages.question)

        let unorderedList = []
        let randomIndex = 0
    
        // if not randomizer
        if (!this.random) {
    
            // record reactions posted to the message and filter them to exclude non-allowed symbols & the bot self-posted reactions
            this.question.objs.q.awaitReactions(
                (reaction, user) => this.question.allowed_emojis.includes(reaction.emoji.name) && user.id != this.question.objs.q.author.id,
                {time: this.client.config.delays.maxResponseDelay * 1000}
            ).then(collectedEmojis => {
                this.question.objs.e = collectedEmojis
            })
    
            this.protectReactions(this.question.objs.q, this.question.allowed_emojis)
    
            // post all the reactions
            for (let i = 0; i < this.question.nb_answers; i++) {
                await this.question.objs.q.react(this.client.customEmojis[i+1])
            }
    
            let remainingSeconds = this.client.config.delays.maxResponseDelay - (this.client.config.delays.awaitEmojiTempoPerSec * this.question.nb_answers)

            // wait the time minus the 1sec/answer quota that is the usual tick rate for the API
            await new Promise(done => setTimeout(done, remainingSeconds * 1000))
    
        } else {
    
            // god of random
            randomIndex = this.client.tools.getRandomInt(0, this.question.allowed_emojis.length - 1)
    
        }
    
        // crawl recorded reactions
        for (let i = 0; i < this.question.allowed_emojis.length; i++) {
    
            let reactionResults = 0
    
            if (!this.random) {
                // find the reactions
                let reaction = this.question.objs.e.find(reaction => reaction.emoji.name === this.question.allowed_emojis[i]);
                reactionResults = reaction === null ? 0 : reaction.count - 1
    
            } else {
    
                // simulate vote for the random phase
                reactionResults = (randomIndex == i) ? 100 : 0

            }
    
            // add the results
            unorderedList.push({
                "score": reactionResults,
                "answer": this.qObj.answers[i].title,
                "emoji": this.question.allowed_emojis[i],
                "index": i
            });

        }
    
        // sort the results
        this.question.results = unorderedList.sort(function(a,b){return b.score - a.score;})

        // Winner is only when the first in the list have a different score that the second // if not, there is no winner and it's a tie
        if (this.question.results.length > 1) {
            
            if (this.question.results[0].score != 0) {
    
                if (this.question.results[0].score != this.question.results[1].score) {
        
                    // winner found! GG WP!
                    this.question.winner = this.question.results[0]
                    this.question.success = true

                } else {

                    // tie! randomize the winner *diceroll*
                    let shortList = []
                    for (let i = 0; i < this.question.results.length; i++) {
                        if (this.question.results[i].score == this.question.results[0].score) {
                            shortList.push(this.question.results[i]);
                        }
                    }

                    // elect the randomized winner
                    this.question.winner = shortList[this.client.tools.getRandomInt(0, shortList.length - 1)];
                    this.question.success = true;
                    this.question.randomized = true;

                }

            }

        } else {
    
            // if there is only one choice : just take the first element and stop
            this.question.winner = this.question.results[0];
            this.question.success = true;
    
        }
    
        let plural = (this.question.winner.score > 1) ? 's' : '';
        let randomStr = (this.question.randomized || this.random) ? 'a été tiré au sort' : 'a remporté les suffrages';
    
        this.question.messages.response = (this.question.success) ? 
            `> \`${this.question.winner.answer}\` ${randomStr} (${this.question.winner.score} vote${plural})` :
            `> Aucun vote enregistré. Arrêt du sondage.`;
    
        await this.voteChannel.send(this.question.messages.response)
    
        // why will a random bot wait for ?
        if (!this.random) {
            await new Promise(done => setTimeout(done, this.client.config.delays.betweenQuestionsDelay * 1000));
        }
    
        // if there is a success
        if (this.question.success) {
    
            // record the answer
            this.recapChoices.push(this.question.winner.answer);
    
            // if there is another question beyond
            if (this.qObj.answers[this.question.winner.index].answers.length > 0) {
    
                new CustomVote(this.client, this.message, this.qObj.answers[this.question.winner.index], this.recapChoices, this.random).start()
    
            } else {
    
                if (this.qObj.answers[this.question.winner.index].function &&
                    this.qObj.answers[this.question.winner.index].function == "randomVote") {
    
                    new CustomVote(this.client, this.message, this.qObj, this.recapChoices, true).start()
    
                } else {
    
                    let lastParamsStr = this.recapChoices.join(', ');

                    this.voteChannel.send(`>>> :white_check_mark: Prochaine partie : \`${lastParamsStr}\`.\n${this.pubgEmoji} reste un jeu, ne l'oubliez pas 🐔🍳`);

                    // save only when not rematch
                    if (this.saveStatus) {
                        this.client.tools.setMeta(this.client, 'lastParams', this.message.channel.id, lastParamsStr)
                    }

                    this.client.tools.unlockChannel(this.client, this.message.channel)

                }

            }

        } else {

            this.client.tools.unlockChannel(this.client, this.message.channel)

            return false

        }
  
    }
    
}

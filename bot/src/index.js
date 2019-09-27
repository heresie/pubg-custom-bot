// requirements
const Discord = require('discord.js');
const auth = require('../credentials/auth.json');
const pollQuestions = require('../polls/customGames.json');
const emojiCharacters = require('./emojiCharacters');

// init
const client = new Discord.Client();

// specific discord configuration
const adminRoleName = 'Fondateurs';

// poll timers
const warningDelay        = 5;
const maxResponseDelay    = 5;

// messages
const timerStartMessage   = `:clock1: Vous avez ${maxResponseDelay} secondes pour voter ...`;
const timerWarningMessage = `:alarm_clock: Il vous reste ${warningDelay} secondes avant la fin des votes`;
const timerEndMessage     = `:octagonal_sign: Fin des votes`;

let question = {
    "nb_answers": 0,
    "allowed_emojis": [],
    "objs": {
        "q": {},
        "e": {}
    },
    "results": [],
    "winner": {},
    "messages": {
        "response": null,
        "question": null,
    },
    "success": false
}

let voteInProgress = false;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
        game: {
            name: '!vote'
        }
    })
});

function postQuestion(voteChannel, questionObj) {

    question.nb_answers = questionObj.answers.length;
    for (let i = 0; i < question.nb_answers; i++) {
        question.messages.question += `${emojiCharacters[i + 1]} ${questionObj.answers[i].title}\n`;
        question.allowed_emojis.push(emojiCharacters[i + 1]);
    }

    // let's go, post first message
    voteChannel
        .send(question.messages.question)
        .then(async (q) => {
            try {
                question.objs.q = q;

                // post all the reactions
                for (let i = 0; i < question.nb_answers; i++) {
                    await question.objs.q.react(emojiCharacters[i + 1]);
                }

                // record reactions posted to the message and filter them to exclude non-allowed symbols & the bot self-posted reactions
                question.objs.e = await question.objs.q.awaitReactions(
                    (reaction, user) => question.allowed_emojis.includes(reaction.emoji.name) && user.id != question.objs.q.author.id,
                    {time: maxResponseDelay * 1000}
                );

                // crawl recorded reactions
                for (let i = 0; i < question.allowed_emojis.length; i++) {
                    // find the reactions
                    let reaction = question.objs.e.find(reaction => reaction.emoji.name === question.allowed_emojis[i]);

                    // add the results
                    question.results.push({
                        "score": reaction === null ? 0 : reaction.count - 1,
                        "answer": questionObj.answers[i].title,
                        "emoji": question.allowed_emojis[i]
                    });
                }

                // order the objects
                //let orderedList = Object.keys(question.results).sort(function(a,b){return question.results[a]-question.results[b]});

                let orderedList = question.results.sort(function(a,b){return a.score - b.score;});
//                var byDate = arrayOfObjects.slice(0);
//                byDate.sort(function(a,b) {
//                    return a.born - b.born;
//                });
//                console.log('by date:');
//                console.log(byDate);
                console.log(orderedList);

                // first find if there is a 
//                for (let i = 0; i < question.results.length; i++) {
//                    if (question.results[i].score )
//                }
//                    if (question.result.score != 0 && question.result.score == resultObj.score) {
//                    } else if (question.result.score < votes) {
//                        // check if there is a better score
//                        question.result.score = votes;
//                        question.result.answer = questionObj.answers[i].title;
//                        question.result.emoji = question.allowed_emojis[i];
//                    } 
//                }
//
//                if (question.result.score == 0) {
//                    
//                } else if (question.result.scor)
//
//                question.response = `La réponse __${question.result.answer}__ a remporté les suffrages avec ${question.result.score} vote${question.result.score > 1 ? 's' : ''}`;
//                await voteChannel.send(question.response);
                console.log(question);
            } catch (error) {
                console.log(`An await error occured : ${error}`);
            }
        });
}
/*
        .then(async() => {
            // post the waiting messages
            voteChannel
                .send(timerStartMessage)
                .then(async() => {
                    try {
                        // wait till the timer warning
                        await new Promise(done => setTimeout(done, (maxResponseDelay - warningDelay) * 1000));
                        voteChannel.send(timerWarningMessage);

                        // wait till the end of the question
                        await new Promise(done => setTimeout(done, warningDelay * 1000));
                        voteChannel
                            .send(timerEndMessage)
                            .then(async() => {
                                const reactions = await postedMessage.awaitReactions(reaction => {
                                    return reaction.emoji.name === "toto";
                                }, {time: 10000})
                            });
                    } catch (error) {}
                });
    });*/

client.on('message', async message => {

    let voteChannel = client.channels.find(channel => channel.name === 'votes');

    // react only on !vote messages
    if (message == '!vote' && !voteInProgress) {

        // react only to admins
        if (!message.member.roles.find(r => r.name === adminRoleName)) {
            message.author.send(`You are not authorized to start a new custom vote.`);
        } else {
            postQuestion(voteChannel, pollQuestions.poll);
        }
    }
});

client.login(auth.token);


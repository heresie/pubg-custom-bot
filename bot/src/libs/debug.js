module.exports = {
    
    dumpError(err) { 

        if (typeof err === 'object') {

            if (err.message) {
                console.log(`\nMessage: ${err.message}`)
            }

            if (err.stack) {
                console.log(`\nStacktrace:${err.stack}`)
            }

        } else {

            console.log('dumpError :: argument is not an object');

        }

    }

}
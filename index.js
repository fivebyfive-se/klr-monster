const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const i18n = require('i18n');

const languageCookie = require('./lib/middleware/language-cookie');

i18n.configure({
    locales: ['en-US', 'sv-SE'],
    directory: path.join(__dirname, 'locales'),
    objectNotation: true
});


const routes = require('./routes');

const port = process.env.PORT || 3000;

const app = express();

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy
}

app
    .use(bodyParser.json({ type: '*/json' }))
    .use(express.static(path.join(__dirname, 'public')))

    .use(cookieParser())
    .use(i18n.init)
    .use(languageCookie)


    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'pug')

    .use('/', routes)

    .listen(port, () => {
        console.log(`Listening on ${port}`);
    })
;
const i18n = require('i18n');

module.exports = (req, res, next) => {
    const languageCookie = req.cookies.language || 'en-US';
    i18n.setLocale(req, languageCookie);
    req.language = res.locals.language = languageCookie;
    next();
};

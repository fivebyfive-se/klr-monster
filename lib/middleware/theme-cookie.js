module.exports = (req, res, next) => {
    let themeCookie = req.cookies.theme;
    if (themeCookie === undefined) {
        themeCookie = 'light';
        res.cookie('theme', themeCookie, { maxAge: 900000, httpOnly: true });
    }
    res.locals.theme = themeCookie;

    next();
};

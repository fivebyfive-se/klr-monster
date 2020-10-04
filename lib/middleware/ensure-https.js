module.exports = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect('https://' + req.get('Host') + req.url);
    }
    next();
};

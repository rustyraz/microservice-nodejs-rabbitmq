const jwt = require('jsonwebtoken');

module.exports = async function isAuthenticated (req, res, next) {
    if(!req.headers.authorization){
        return res.status(401).send('Missing Authorizaion header details');
    }
    const token = req.headers['authorization'].split(" ")[1];
    jwt.verify(token, 'secretKey', (err, user) => {
        if(err){
            return res.status(500).json(err);
        }else{
            req.user = user;
            next()
        }
    });
}
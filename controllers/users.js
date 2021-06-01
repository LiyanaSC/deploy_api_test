const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const User = require('../models/user');
const passwordValidator = require('password-validator');
const validator = require("email-validator");
const CryptoJS = require("crypto-js");

const schema = new passwordValidator();

schema
    .is().min(8)
    .has().uppercase()
    .has().lowercase()
    .has().digits(1)
    .has().not().spaces();


exports.createUser = (req, res, next) => {
    if (Object.keys(req.body).length != 2) {
        return res.status(400).json({ error: 'bad request' });
    } else if (schema.validate(req.body.password) == false) {
        return res.status(400).json({ error: 'password insecure try again' });
    } else if (validator.validate(req.body.email) == false) {
        return res.status(400).json({ error: 'not an email' });
    } else if (!req.body.email ||
        !req.body.password) {
        return res.status(400).json({ error: 'permission denied' });
    }

    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            const hashedMail = CryptoJS.SHA256(req.body.email)
            const user = new User({
                email: hashedMail,
                password: hash
            })

            user.save()
                .then(() => res.status(201).json({ message: 'nouvel(le) utilisateur/trice enregistré(e) !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }))
}

exports.logUser = (req, res, next) => {
    if (Object.keys(req.body).length != 2) {
        return res.status(400).json({ error: 'bad request' });
    } else if (schema.validate(req.body.password) == false) {
        return res.status(406).send(new Error('password insecure try again'));
    } else if (validator.validate(req.body.email) == false) {
        return res.status(406).send(new Error('not a email'));
    }
    const hashedMail = CryptoJS.SHA256(req.body.email).toString();
    User.findOne({ email: hashedMail })
        .then(user => {
            if (user == undefined) {
                res.status(401).send(new Error('permission denied'));

            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            return res.status(401).json({ error: 'mot de passe incorrect' });
                        }
                        res.status(200).json({
                            userId: user._id,
                            token: jwt.sign({ userId: user._id },
                                'RANDOM_TOKEN_SECRET', { expiresIn: '3h' }
                            )
                        });
                    })
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};
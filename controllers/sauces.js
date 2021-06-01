const Sauce = require('../models/sauce');
const fs = require('fs');
const { read } = require('fs/promises');
const { stringify } = require('postcss');
const jwt = require('jsonwebtoken')



exports.getAllSauces = (req, res, next) => {
    Sauce.find().then(

        sauces => {
            const mappedSauces = sauces.map((sauce) => {
                if (!sauce) {
                    return res.status(404).send(new Error('Bad request!'));
                }
                return sauce;
            });
            res.status(200).json(mappedSauces);
        }
    ).catch(error => res.status(500).json({ error }));


    /*  Sauce.find()
         .then(sauces => res.status(200).json(sauces))
         .catch(error => res.status(400).json({ error }));
        
         */
};

exports.getOneSauce = (req, res, next) => {
    if (!req.params.id) {
        return res.status(400).send(new Error('Bad request!'));
    }
    Sauce.findById(req.params.id)
        .then(sauce => {

            if (!sauce) {
                return res.status(404).send(new Error('Bad request!'));
            }
            res.status(200).json(sauce);
        })
        .catch(error => res.status(404).json({ error }));
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce); //ne passe pas sur postman
    console.log(sauceObject)
    if (!req.body.sauce ||
        !sauceObject.name ||
        typeof sauceObject.name != "string" ||
        !sauceObject.manufacturer ||
        typeof sauceObject.manufacturer != "string" ||
        !sauceObject.description ||
        typeof sauceObject.description != "string" ||
        !sauceObject.mainPepper ||
        typeof sauceObject.mainPepper != "string" ||
        !sauceObject.heat ||
        typeof sauceObject.heat != "number"

    ) {
        return res.status(400).json({ error: 'Bad request' });
    }

    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`

    });

    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce Créée  !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.modifSauce = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
    const userId = decodedToken.userId;
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body };
    if (req.file != null) {

        if (!req.body.sauce ||
            !req.file
        ) {
            return res.status(400).json({ error: 'Bad request' });
        }
        Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                console.log(sauce)
                if (sauce.userId != userId) {
                    return res.status(400).json({ error: 'permission denied' });
                }
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.updateOne({ _id: req.params.id }, {...sauceObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                        .catch(error => res.status(400).json({ error }));
                });
            });
    } else {

        if (!req.body.name ||
            typeof req.body.name != "string" ||
            !req.body.manufacturer ||
            typeof req.body.manufacturer != "string" ||
            !req.body.description ||
            typeof req.body.description != "string" ||
            !req.body.mainPepper ||
            typeof req.body.mainPepper != "string" ||
            !req.body.heat ||
            typeof req.body.heat != "number" ||
            !req.params.id

        ) {
            return res.status(400).json({ error: 'Bad request modif' });
        }

        Sauce.findOne({ _id: req.params.id })
            .then(sauce => {
                console.log(sauce.userId, "&", userId)
                if (sauce.userId != userId) {
                    return res.status(400).json({ error: 'permission denied' });
                }


                Sauce.updateOne({ _id: req.params.id }, {...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                    .catch(error => res.status(400).json({ error }));
            });



    }

};

exports.deleteSauce = (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
    const userId = decodedToken.userId;

    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.userId != userId) {
                return res.status(400).json({ error: 'permission denied' });
            }
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet deleted !' }))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));

};
exports.likedSauce = (req, res, next) => {
    const parsedBody = Object.keys(req.body).length
    console.log(req.body)
    if (parsedBody != 2 ||
        req.body.userId == undefined ||
        req.body.like == undefined ||
        //typeof req.body.like != 'number' || //à retirer pour test postman
        req.body.like > 1 ||
        req.body.like < -1 ||
        typeof req.body.userId != "string"

    ) {
        return res.status(400).json({ error: 'Bad request likes' });
    }
    Sauce.findById({ _id: req.params.id, })

    .then(sauce => {
            const addLike = req.body.like;
            const userId = req.body.userId;

            const arrayOfLikes = sauce.usersLiked;
            const userIndexInLikes = arrayOfLikes.indexOf(userId)
            const like = sauce.likes + addLike;
            const foundUserLike = arrayOfLikes.find(element => element == req.body.userId);


            const arrayOfDislikes = sauce.usersDisliked
            const userIndexInDislikes = arrayOfDislikes.indexOf(userId)
            const dislike = sauce.dislikes - addLike;
            const foundUserDislike = arrayOfDislikes.find(element => element == req.body.userId);


            if (addLike == 1) {


                if ((foundUserLike == req.body.userId) == true) {
                    return res.status(400).json({ error: 'Like already posted' });
                } else if ((foundUserDislike == req.body.userId) == true) {
                    return res.status(400).json({ error: 'Dislike already posted' });
                }


                arrayOfLikes.push(userId);
                Sauce.updateOne({ _id: req.params.id }, {
                        usersLiked: arrayOfLikes,
                        likes: like,
                        _id: req.params.id
                    })
                    .then(() => res.status(200).json({ message: 'Like àjouté !' }))
                    .catch(error => res.status(400).json({ error }));

            } else if (addLike == -1) {


                if ((foundUserDislike == req.body.userId) == true) {
                    return res.status(400).json({ error: 'Dislike already posted' });
                } else if ((foundUserLike == req.body.userId) == true) {
                    return res.status(400).json({ error: 'Like already posted' });
                }
                arrayOfDislikes.push(userId);
                Sauce.updateOne({ _id: req.params.id }, {
                        usersDisliked: arrayOfDislikes,
                        dislikes: dislike,
                        _id: req.params.id
                    })
                    .then(() => res.status(200).json({ message: 'dislike !' }))
                    .catch(error => res.status(400).json({ error }));
            } else if (addLike == 0) {
                if (
                    (foundUserDislike == req.body.userId) == false &&
                    (foundUserLike == req.body.userId) == false) {
                    return res.status(400).json({ error: 'opinion already modified' });
                }

                const FinalLikesArray = arrayOfLikes.splice(userIndexInLikes, 1)
                const likeAfterModif = JSON.parse(arrayOfLikes.length) - JSON.parse(FinalLikesArray.length);
                const resultLike = like + likeAfterModif;

                const FinalDislikesArray = arrayOfDislikes.splice(userIndexInDislikes, 1)
                const dislikeAfterModif = JSON.parse(arrayOfDislikes.length) - JSON.parse(FinalDislikesArray.length);
                const resultDislike = dislike + dislikeAfterModif;


                Sauce.updateOne({ _id: req.params.id }, {
                        usersLiked: arrayOfLikes,
                        usersDisliked: arrayOfDislikes,
                        likes: resultLike,
                        dislikes: resultDislike,
                        _id: req.params.id
                    })
                    .then(() => res.status(200).json({ message: 'Avis modifié !' }))
                    .catch(error => res.status(400).json({ error }));

            }
        })
        .catch(error => res.status(400).json({ error }))

}
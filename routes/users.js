const express = require('express');
const router = express.Router();




const UsersControl = require('../controllers/users');



router.post("/signup", UsersControl.createUser);
router.post("/login", UsersControl.logUser);

module.exports = router;
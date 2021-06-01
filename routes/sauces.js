const express = require('express');
const router = express.Router();

const sauceControl = require('../controllers/sauces');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');



router.get("/", auth, sauceControl.getAllSauces);
router.get("/:id", auth, sauceControl.getOneSauce);
router.post("/", auth, multer, sauceControl.createSauce);
router.put("/:id", auth, multer, sauceControl.modifSauce);
router.delete("/:id", auth, multer, sauceControl.deleteSauce);
router.post("/:id/like", auth, sauceControl.likedSauce);


module.exports = router;
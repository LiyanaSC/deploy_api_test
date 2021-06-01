const mongoose = require('mongoose');
const oneMailOnly = require('mongoose-unique-validator');
const encrypt = require('mongoose-encryption');

const UserSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

UserSchema.plugin(oneMailOnly, encrypt, { excludeFromEncryption: ['password'] });
module.exports = mongoose.model('User', UserSchema);
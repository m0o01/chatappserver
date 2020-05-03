const mongoose = require('mongoose')

const users = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
})

const messages = mongoose.Schema({
    message: { 
        type: String,
        required: true,
    },
    user_id: {
        type: String,
        required: true,
    },
    chat_id: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now()
    }
})


const Users = mongoose.model('Users', users)
const Messages = mongoose.model('Messages', messages)

module.exports = {
    Users,
    Messages,
}
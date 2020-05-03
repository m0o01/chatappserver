const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const ejwt = require('express-jwt')

const {Users} = require('./models')
const {DATABASE_URI, JWT_SECRETKEY} = require('./config')

const app = express()

app.use(bodyParser.json())
app.use((req, res, next) => {
    console.log(`${req.method}:  ${req.url}`)
    next()
})
app.use(ejwt({secret: JWT_SECRETKEY}).unless({path: ['/login', '/register']}))

mongoose.connect(DATABASE_URI, {useNewUrlParser:true});

const db = mongoose.connection

const server = app.listen(3000, () => {
    console.log(`Starting the server at http://localhost:${server.address().port}`)
    db.on('error', (err) => console.log(err))
    db.once('open', () => {
        console.log('Successfully connected to the Database!')
    })
})

require('./socket')(server)

app.get('/', (req,res) => {
    res.json({"Status": "Authorized", ...req.user})
})

app.post('/register', (req, res) => {
    const {username, password} = req.body
    if(!username || !password)
        return res.status(400).json({message:"Missing Required Data"})
    Users.findOne({username}, function(err, data){
        if(err){
            return res.status(500).json({message:"Something wrong happened inside the server..."})
        } else {
            if(data){
                return res.status(400).json({message:"USERNAME_TAKEN"})
            } else {
                bcrypt.hash(password, 10, (err, hash) => {
                    const user = new Users({username, password:hash})
                    user.save((err) => {
                        if(err)
                            return res.status(500).json({message:"Something wrong happened inside the server..."})
                        else
                            return res.send()
                    })
                })
            }
        }
    })
})

app.post('/login', (req, res) => {
    const {username, password} = req.body
    if(!username || !password)
        return res.status(400).json({message:"Missing Required Data"})
    Users.findOne({username}, function(err, data){
        if(err){
            return res.status(500).json({message:"Something wrong happened inside the server..."})
        } else {
            if(data){
                bcrypt.compare(password, data.password, (err, match) => {
                    if(match){
                        const token = jwt.sign({username, password}, JWT_SECRETKEY)
                        return res.json({token, username, id:data._id})
                    } else {
                        return res.status(400).json({message:"Username or password might be wrong"})
                    }
                })
            } else { 
                return res.status(400).json({message:"Username or password might be wrong"})
            }
        }
    })
})

app.get('/search', (req, res) => {
    if(!req.query.username){
        return res.status(400).json({message: "No username was specified"})
    } else {
        Users.find({username: {$regex: `^${req.query.username}`}}, function(err, data){
            if(err){
                return res.status(500).json({message:"Something wrong happened inside the server..."})
            } else {
                const filterd = data.filter(user => (user.username !== req.user.username))
                                    .map(user => ({username: user.username, id:user._id}))
                if(filterd.length > 0)
                    return res.json(filterd)
                else
                    return res.status(404).json({message: "No user found"})
            }
        })
    }
})

app.use((req, res, next) => {
    const err = new Error('Route Not Found')
    err.code = 404
    next(err)
})

app.use((err, req, res, next) => {
    res.json({status: err.code || 500, message: err.message || "Something wrong happened inside the server..."})
})
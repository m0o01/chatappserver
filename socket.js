const socket_io = require('socket.io')
const clients = {}
const pendingMessages = {}

findUserSocketID = username => {
    Object.entries(clients).forEach(([socketId, loggedUsername]) => {
        if(loggedUsername === username)
            return socketId
    })
    return false
}

module.exports = (server) => {

    const io = socket_io(server)

    io.on('connection', (client) => {
        client.on('register', (data) => {
            const {username} = data
            clients[client.id] = username
            console.log(clients)
            if(pendingMessages.hasOwnProperty(username)){
                io.to(client.id).emit("messages", pendingMessages[username])
                delete pendingMessages[username]
            }
        })

        client.on('message', (data) => {
            console.log(data)
            const username = data.chatId.split('-')[1]
            const userId = findUserSocketID(username)
            const message = {
                chatId: data.chatId.split('-').reverse().join('-'),
                userId: data.userId,
                message: data.message,
                createdAt: data.createdAt,
            }
            if(userId){
                io.to(userId).emit('message', message)
            } else {
                if(!pendingMessages.hasOwnProperty(username))
                    pendingMessages[username] = []
                pendingMessages[username].push(message)
                console.log(pendingMessages)
            }
        })
        
        client.on('disconnect', () => {
            delete clients[client.id]
            console.log('The client with id ' + client.id + ' just left.')
        })
    })

}
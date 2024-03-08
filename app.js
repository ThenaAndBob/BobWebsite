// imports
var express = require('express')
var app = express()
app.use(express.json())
const { createHash } = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const io = require("socket.io")(3000, {
    cors: {
        origin: ["http://localhost:8080"],
    }
})
app.set('view engine', 'ejs');

// required variables
const PORT = 8080;
var bodyParser = require('body-parser');
const db = new sqlite3.Database('test.db'); // This constant opening and closing might be bad FIX. IF this is slow figure out a better way ig.

// middleware
app.use(bodyParser.urlencoded({
   extended: false
}));
app.use(bodyParser.json());


// functions
function hash(string) {
    return createHash('sha256').update(string).digest('hex');
}

var authenticate = function(username, password, type, callback, extraparams=[]){
    if (username == "" || password == ""){
        return "Username or password is empty" // FIX ui
    } 
    password = hash(password)

    db.serialize(() => {
        if (type == "signup"){
            db.all("SELECT username FROM users WHERE username = '" + username + "'", (err, data) =>{
                if (data.length == 1){
                    // Username already exists
                    callback("Username already exists", extraparams)
                } else {
                    db.run("INSERT INTO users VALUES ('" + username + "', '" + password + "');", () =>{
                        console.log("Added entry to 'users' table")
                        callback("in", extraparams)
                    })
                }
            })
        }
        else if (type == "login"){
            db.all("SELECT password FROM users WHERE username = '" + username + "'", (err, data) =>{
                if (data.length == 0){
                    callback("Username does not exist", extraparams) // FIX UI
                } else {
                    if (password == data[0]["password"]){
                        callback("in", extraparams)
                    } else {
                        // FIX UI
                        callback("Wrong password", extraparams)
                    }
                }
            })
        }
    });    
}


function signedIn(result, extraparams){
    console.log(`result =  ${result}`)
    username = extraparams[0].body.username
    var chat = ""
    var details = ""
    db.serialize(() =>{
        db.all(`SELECT chatID, boostername FROM chatconnection WHERE username = '${username}';`, (err, all) =>{
            console.log("all = " + all)   
            if (all.length == 0){
                setupchatconnection(username, extraparams)
                return
            }
            row = all[0]
            details += row.boostername 
            db.all(`SELECT content, sender FROM messages WHERE chatID = '${row.chatID}' ORDER BY messageID ASC;`, (err, data) =>{ // FIX currently would not work for more than one chat per username (/account)
                data.forEach((crow) =>{
                    chat += `${crow.content}|${crow.sender}¬` // IMPORTANT FIX THIS MEANS YOU ARE NOT ALLOWED TO HAVE "|" or "¬" IN ANY TEXT THAT APPEARS IN THE DATABASE, SO LIVE CHAT OR USERNAME
                })
                console.log(chat)
                livechat(chat, details, extraparams)
            })
        })
    })
}

function livechat(chat, enemyname, extraparams){
    req = extraparams[0]
    res = extraparams[1]
    res.render("livechat.ejs", {
        username: req.body.username,
        password: req.body.password,
        chat: chat,
        enemyname: enemyname
    })
}

// server shit
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname });
})

app.get('/signup', (req, res) =>{
    res.sendFile('signup.html', { root: __dirname });
})

app.get('/livechat', (req, res) =>{
    res.render("livechat.ejs", {
    }) // DEVELOPMENT ONLY FIX by removing i think
})

app.post('/login', function(req,res){
    // Check if the username exists -> IF no return error, ELSE check if password hashes match, if no return error ELSE send to "livechats" page.

    // Needs a captcha of some sort FIX
    authenticate(req.body.username, req.body.password, "login", signedIn, [req, res]) // FIX
});

app.post('/signup', function(req, res){
    // Check if username exists -> IF yes return error, ELSE create new user in database and send to "livechats" page
    if (authenticate(req.body.username, req.body.password, "signup", signedIn, [req, res]) == "in"){
    }
})


app.listen(PORT, () =>{
    console.log("listening on port " + PORT)
})

function socketauth(code, extraparams){
    if (code == "in"){
        extraparams[1].username = extraparams[0]
    }
}

function socketjoinchat(socket, username){
    db.all(`SELECT chatID FROM chatconnection WHERE username = '${username}'`, (err, chatID) =>{
        socket.chatID = chatID[0].chatID
        socket.join(chatID)
    })
}

function updatemessages(content, sender, chatID){
    console.log(content, sender, chatID)
    db.run(`INSERT INTO messages (content, sender, chatID) VALUES ('${content}', '${sender}', '${chatID}')`)
}

function getRandomInt(max) { // fix for development
    return Math.floor(Math.random() * max);
  }
  

function setupchatconnection(username, extraparams, booster=""){
    booster = "deamerd" + getRandomInt(10000000).toString()
    db.run(`INSERT INTO chatconnection (username, boostername) VALUES ('${username}', '${booster}')`)
    livechat("", booster, extraparams)
}


// Live chat shit
io.on("connection", socket => {
    console.log(socket.id)
    socket.on("authenticate", (username, password) =>{
        authenticate(username, password, "login", socketauth, [username, socket])
        socketjoinchat(socket, username)
    })
    socket.on("sendMessage", (content) =>{
        if (socket.username != undefined){
            // Store message in database
            socket.to(socket.chatID).emit("receiveMessage", content, socket.username)
            updatemessages(content, socket.username, socket.chatID)
        } else {
            console.log("haxor?") // Only way to get here should be by being a haxor or if they are on the livechat html page before the server is open :) FIX make the user refresh/re log in
        }
    })
})


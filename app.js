// imports
var express = require('express')
var app = express()
app.use(express.json())
const { createHash } = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const io = require("socet.io")(3000, {
    cors: {
        origin: ["http://localhost:8080"],
    }
})

// required variables
const PORT = 3000;
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

function authenticate(req, res, type){
    const username = req.body.username
    var password = req.body.password

    if (username == "" || password == ""){
        res.send("Username or password is empty") // FIX ui
    }
    console.log("Username and password were not empty.")
    
    password = hash(password)

    db.serialize(() => {
        if (type == "signup"){
            db.all("SELECT username FROM users WHERE username = '" + username + "'", (err, data) =>{
                if (data.length == 1){
                    // Username already exists
                    res.send("Username already exists") // FIX UI
                } else {
                    db.run("INSERT INTO users VALUES ('" + username + "', '" + password + "');", () =>{
                        console.log("Added entry to 'users' table")
                        signedIn(req, res, username)
                    })
                }
            })
        }
        else if (type == "login"){
            db.all("SELECT password FROM users WHERE username = '" + username + "'", (err, data) =>{
                if (data.length == 0){
                    res.send("Username does not exist") // FIX UI
                } else {
                    if (password == data[0]["password"]){
                        signedIn(req, res, username)
                    } else {
                        res.send("Wrong password") // FIX UI
                    }
                }
            })
        }
    });

}

function signedIn(req, res, username){
    var chat = ""
    db.serialize(() =>{
        db.each("SELECT chatID, boostername FROM chatconnection WHERE username = '" + username + "';", (err, row) =>{
            db.all(`SELECT messageID, content, sender FROM messages WHERE chatID = '${row.chatID}' ORDER BY messageID ASC;`, (err, data) =>{
                res.send(data)
            })
        })
    })
}


// server shit
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname });
})

app.get('/signup', (req, res) =>{
    res.sendFile('signup.html', { root: __dirname });
})


app.post('/login', function(req,res){
    // Check if the username exists -> IF no return error, ELSE check if password hashes match, if no return error ELSE send to "livechats" page.

    // Needs a captcha of some sort FIX
    authenticate(req, res, "login")
});

app.post('/signup', function(req, res){
    // Check if username exists -> IF yes return error, ELSE create new user in database and send to "livechats" page
    authenticate(req, res, "signup")
})


app.listen(PORT, () =>{
    console.log("listening on port " + PORT)
})


// Live chat shit
io.on("connection", socket => {
    console.log(socket.id)
    socket.on("sendMessage", (content) =>{
        console.log(content)
    })
})



// imports
const fetch = require('node-fetch')
require('dotenv').config();
const path = require("path")
var express = require('express')
var app = express()
app.use(express.json())
const { createHash } = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const io = require("socket.io")(app.listen(8080), {
    cors: {
      origin: ["http://localhost:8080", "https://bobsboosting.com"],
    }
})
app.set('view engine', 'ejs');
var cors = require('cors')

// required variables
var bodyParser = require('body-parser');
const db = new sqlite3.Database('test.db'); // This constant opening and closing might be bad FIX. IF this is slow figure out a better way ig.
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PORT = 8080 } = process.env;
const base = "https://api-m.sandbox.paypal.com";
var corsOptions = {
  origin: 'https://bobsboosting.com',
  optionSuccessStatus: 200
}
app.use(cors(corsOptions))

// middleware
app.use(bodyParser.urlencoded({
   extended: false
}));
app.use(bodyParser.json());
// host static files
app.use(express.static("client"));
  
// parse post params sent in body in json format
app.use(express.json());

// functions
function hash(string) {
    return createHash('sha256').update(string).digest('hex');
}

var authenticate = function(username, password, type, callback, extraparams=[]){
    console.log("Started authenticate")
    if (username == "" || password == ""){
        callback("Username or password is empty", extraparams, type) // FIX ui
        return
    } 
    password = hash(password)

    db.serialize(() => {
        if (type == "Sign up"){
            db.all("SELECT username FROM users WHERE username = '" + username + "'", (err, data) =>{
                if (data.length == 1){
                    // Username already exists
                    callback("Username already exists", extraparams, type)
                } else {
                    db.run("INSERT INTO users VALUES ('" + username + "', '" + password + "');", () =>{
                        callback("in", extraparams)
                    })
                }
            })
        }
        else if (type == "Log in"){
            db.all("SELECT password FROM users WHERE username = '" + username + "'", (err, data) =>{
                if (data.length == 0){
                    callback("Username does not exist", extraparams, type) // FIX UI
                } else {
                    if (password == data[0]["password"]){
                        callback("in", extraparams)
                    } else {
                        // FIX UI
                        callback("Wrong password", extraparams, type)
                    }
                }
            })
        }
    });    
}

function signedIn(result, extraparams, type){
    console.log(`result =  ${result}`)
    if (result != "in"){
        console.log(type)
        res = extraparams[1]
        res.render("login.ejs", {
            problem: result,
            formtype: type
        })
        res.end()
    } else {
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


 
/**
* Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
* @see https://developer.paypal.com/api/rest/authentication/
*/
const generateAccessToken = async () => {
    try {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error("MISSING_API_CREDENTIALS");
      }
      const auth = Buffer.from(
        PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
      ).toString("base64");
      const response = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Failed to generate Access Token:", error);
    }
  };
    
  /**
  * Create an order to start the transaction.
  * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
  */
  const createOrder = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
      "shopping cart information passed from the frontend createOrder() callback:",
      cart,
    );
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: cart[0].price,
          },
        },
      ],
    };
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
    
    return handleResponse(response);
  };
    
  /**
  * Capture payment for the created order to complete the transaction.
  * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
  */
  const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderID}/capture`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
    });
    
    return handleResponse(response);
  };
    
  async function handleResponse(response) {
    try {
      const jsonResponse = await response.json();
      return {
        jsonResponse,
        httpStatusCode: response.status,
      };
    } catch (err) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }
  }
    
  
  
  
  
  
  
  
  
  app.post("/api/orders", async (req, res) => {
    try {
      // use the cart information passed from the front-end to calculate the order amount detals
      const { cart } = req.body;
      const { jsonResponse, httpStatusCode } = await createOrder(cart);
      res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to create order." });
    }
  });
    
  app.post("/api/orders/:orderID/capture", async (req, res) => {
    try {
      const { orderID } = req.params;
      const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
      res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
      console.error("Failed to create order:", error);
      res.status(500).json({ error: "Failed to capture order." });
    }
  });
    
  // serve index.html
  app.get("/paypal", (req, res) => {
    res.sendFile(path.resolve("./client/checkout.html"));
  });



// server shit
app.get('/', (req, res) =>{
    res.sendFile('index.html', {root: __dirname})
})

app.get('/leagueoflegends', (req, res) =>{
    res.sendFile('leagueoflegends.html', {root: __dirname})
})

app.get('/overwatch', (req, res) =>{
    res.sendFile('overwatch.html', {root: __dirname})
})

app.get('/valorant', (req, res) =>{
    res.sendFile('valorant.html', {root: __dirname})
})

app.get('/login', (req, res) => {
    res.render("login.ejs", {
        formtype: "Log in",
        problem: ""
    })
})

app.get('/signup', (req, res) =>{
    res.render("login.ejs", {
        formtype: "Sign up",
        problem: ""
    })
})

app.get('/livechat', (req, res) =>{
    res.render("livechat.ejs", {
    }) // DEVELOPMENT ONLY FIX by removing i think
})

app.post('/login', function(req,res){
    // Check if the username exists -> IF no return error, ELSE check if password hashes match, if no return error ELSE send to "livechats" page.

    // Needs a captcha of some sort FIX
    authenticate(req.body.username, req.body.password, "Log in", signedIn, [req, res]) // FIX
});

app.post('/signup', function(req, res){
    // Check if username exists -> IF yes return error, ELSE create new user in database and send to "livechats" page
    authenticate(req.body.username, req.body.password, "Sign up", signedIn, [req, res])
})


app.listen(PORT, () =>{
    console.log("listening on port " + PORT)
})


// Live chat shit
io.on("connection", socket => {
    console.log(socket.id)
    socket.on("authenticate", (username, password) =>{
        authenticate(username, password, "Log in", socketauth, [username, socket])
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

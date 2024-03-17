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

function authenticate(username, password, type, callback, usertype, extraparams=[]){
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
                    callback("Username already exists", extraparams)
                } else {
                    db.run("INSERT INTO users VALUES ('" + username + "', '" + password + "');", () =>{
                        callback("in", extraparams)
                    })
                }
            })
        }
        else if (type == "Log in"){
			if (usertype == "username"){
				table = "users"
			} else {
				table = "boosters"
			}
            db.all(`SELECT password FROM ${table} WHERE ${usertype} = '` + username + "'", (err, data) =>{
				console.log(`SELECT password FROM ${table} WHERE ${usertype} = '` + username + "'")
				console.log(err)
				console.log(data)
                if (data.length == 0){
                    callback("Username does not exist", extraparams, type) // FIX UI
                } else {
                    if (password == data[0]["password"]){
                        callback("in", extraparams, type, usertype)
                    } else {
                        // FIX UI
                        callback("Wrong password", extraparams, type)
                    }
                }
            })
        }
    });    
}

function getchatlogs(result, extraparams, formtype, usertype="username"){
    console.log(`result =  ${result}`)
    if (result != "in"){ // check if login was a succes
        console.log(formtype)
        res = extraparams[1]
        res.render("login.ejs", {
            problem: result,
            formtype: formtype,
            orderID: "",
        })
        res.end()
    } else { // Getting chat logs
        username = extraparams[0].body.username
        var chat = ""
        var details = ""
        db.serialize(() =>{
            db.all(`SELECT chatID, boostername FROM chatconnection WHERE ${usertype} = '${username}';`, (err, all) =>{
                console.log(all)   
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
                    livechat(chat, details, extraparams, usertype)
                })
            })
        })
    }
}

function livechat(chat, enemyname, extraparams, usertype){
    req = extraparams[0]
    res = extraparams[1]
    res.render("livechat.ejs", {
        username: req.body.username,
        password: req.body.password,
        chat: chat,
        enemyname: enemyname,
		usertype: usertype,
    })
}

function socketauth(code, extraparams){
    if (code == "in"){
        extraparams[1].username = extraparams[0]
    }
}

function socketjoinchat(socket, username, usertype="username", callback){
	console.log("Starter socketjoinchat")
	console.log(`SELECT chatID FROM chatconnection WHERE ${usertype} = '${username}'`)
    db.all(`SELECT chatID FROM chatconnection WHERE ${usertype} = '${username}'`, (err, chatID) =>{
        socket.chatID = chatID[0].chatID
		console.log(`joining chat ${socket.chatID}`)
        socket.join(socket.chatID)
    })
    callback(socket, username)
}

function updatemessages(content, sender, chatID){
    console.log(content, sender, chatID)
    db.run(`INSERT INTO messages (content, sender, chatID) VALUES ('${content}', '${sender}', '${chatID}')`)
}
  
function setupchatconnection(username, extraparams, usertype="username"){
    db.run(`INSERT INTO chatconnection (username) VALUES ('${username}')`)
    livechat("", "", extraparams, usertype)
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
const createOrder = async (cart, price) => {
	// use the cart information passed from the front-end to calculate the purchase unit details
	console.log(
		"shopping cart information passed from the frontend createOrder() callback:",
		cart,
	);
	const accessToken = await generateAccessToken();
	const url = `${base}/v2/checkout/orders`;
    console.log("price = " + price)
	const payload = {
		intent: "CAPTURE",
		purchase_units: [
		{
			amount: {
			currency_code: "EUR",
			value: price,
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
    
function calculatePrice(body){
    var price = 0
    var ranks = []
    var prices = []
    var divperrank = 0
    var numranks = 0
    var winsperdiv = 0
    if (body.game == "league"){
        divperrank = 4
        numranks = 8
        winsperdiv = 4
        ranks = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "IV", "III", "II", "I", " "]
        prices = [3.2, 3.4, 3.6, 3.8, 
            4, 4.3, 4.6, 4.9, 
            5, 5.3, 5.6, 5.9, 
            8, 8.4, 8.8, 9.2, 
            11, 12, 13, 14, 
            18, 19, 20, 21, 
            30, 40, 50, 60, 
            70]
    } else if (body.game == "overwatch"){
        divperrank = 5
        numranks = 7 // change this to 10 FIX NEW OVERWATCH RANK
        winsperdiv = 4
        ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "5", "4", "3", "2", "1"]
        prices = [2.2, 2.4, 2.6, 2.8,  
                3, 3.25, 3.5, 3.75, 4,  
                4.33, 4.66, 5, 5.33, 5.66,  
                6,6.4,6.8,7.2,7.6,
                8, 8.5, 9, 9.5, 10,
                11, 12, 13, 14, 15,
                18, 21, 23, 25, 27, 32]
    } else if (body.game == "valorant"){
        divperrank = 3
        numranks = 8
        winsperdiv = 4
        ranks = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "1", "2", "3", " "]
        prices =   [3.2, 3.4, 3.6, 
                    4.3, 4.6, 4.9, 
                    5.3, 5.6, 5.9, 
                    8.4, 8.8, 9.2, 
                    12, 13, 14, 
                    19, 20, 21, 
                    40, 50, 60, 
                    70]
    }
    start = body.start.split("+")
    end = body.end.split("+")

    console.log(start, end)
    console.log(body)

    if (start[0] == "Master" || start[0] == "Immortal"){
        console.log("LP type boost", price, body.addwins*(15 + body.currprogress/40), body.addwins, body.currprogress)
        price = body.addwins*(15 + body.currprogress/40)
        console.log("lp price " + price)
    } else {
        startIndex = ranks.indexOf(start[0])*divperrank + ranks.indexOf(start[1])-numranks;
        endIndex = ranks.indexOf(end[0])*divperrank + ranks.indexOf(end[1])-numranks;
        if (end[1] == " "){
            endIndex -= divperrank;
        }
        console.log(startIndex,endIndex, prices, price)
        prices.slice(startIndex, endIndex).forEach(x => price+=x);
        price += body.addwins*prices[endIndex]/winsperdiv
    }

    if (body.duo == "D"){
        price *= 1.5
    }
    console.log(price)   
    price = Math.round((price + Number.EPSILON) * 100) / 100

    return price  
}
  
function insertusername(result, extraparams){
    console.log("started insertusername")
    req = extraparams[0]
    res = extraparams[1]
    if (result != "in"){ // check if login was a succes
        res.render("login.ejs", {
            problem: result,
            formtype: "Sign up",
            orderID: req.params.oid,
        })
        res.end()
    } else {
        console.log(`UPDATE orders SET username = '${req.body.username}' WHERE orderID = '${req.params.oid}'`)
        db.serialize(() =>{
            sql = `SELECT username FROM orders WHERE orderID = '${req.params.oid}'`
            console.log(sql)
            db.all(sql, (err, data) =>{
                console.log(data)
                if (!data[0].username){
                    db.run(`UPDATE orders SET username = '${req.body.username}' WHERE orderID = '${req.params.oid}'`, ()=>{
                        setupchatconnection(req.body.username, extraparams)
                    })
                } else {
                    console.log("haxor? in insertusername")
                }
            })
        })
    }
}

function insertboost(d, orderID){
    sql = `INSERT INTO orders (orderID, paid, game, start, end, duo, addwins, currprogress) VALUES ('${orderID}', 1, '${d.game}', '${d.start}', '${d.end}', '${d.duo}', '${d.addwins}', '${d.currprogress}')`
    console.log(sql)
    db.run(sql) // Maybe add role and character
}

function getboost(socket, username){
    sql = `SELECT orderID, game, start, end, addwins, duo FROM orders WHERE username = '${username}'`
    console.log(sql)
    db.all(sql, (err, data)=>{
        if (err){return}
        console.log(data)
        console.log(socket.chatID)
        io.to(socket.id).emit("boostdetails", data[0])  
    })
}
  
app.post("/api/orders", async (req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount detals
        console.log("in /api/orders")
        const { cart } = req.body;
        price = calculatePrice(cart[0])
        const { jsonResponse, httpStatusCode } = await createOrder(cart, price);
        insertboost(cart[0], jsonResponse.id)
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
  });
    
app.post("/api/orders/:orderID/capture", async (req, res) => {
    console.log("api capture")
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        console.log(req.body)
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});
    
  // serve paypal
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

app.get('/client/paypal.js', (req, res) =>{
    res.sendFile('/client/paypal.js', {root: __dirname})
})

app.get('/login', (req, res) => {
    res.render("login.ejs", {
        formtype: "Log in",
        problem: "",
        orderID: "",
    })
})

app.get('/signup/:oid', (req, res) =>{
    console.log(req.params)
    res.render("login.ejs", {
        formtype: "Sign up",
        problem: "",
        orderID: req.params.oid,
    })
})

app.get('/overwatch.js', (req, res) =>{
    res.sendFile("overwatch.js", {root: __dirname})
})

app.get('/league.js', (req, res) =>{
    res.sendFile("league.js", {root: __dirname})
})

app.get('/valorant.js', (req, res) =>{
    res.sendFile("valorant.js", {root: __dirname})
})

app.get('/banner.css', (req, res)=>{
    res.sendFile("banner.css", {root: __dirname})
})

app.get('/reformat.js', (req, res)=>{
    res.sendFile("reformat.js", {root: __dirname})
})

app.get('/FAQ', (req, res)=>{
    res.sendFile("FAQ.html", {root: __dirname})
})

app.post('/login', function(req,res){
    // Check if the username exists -> IF no return error, ELSE check if password hashes match, if no return error ELSE send to "livechats" page.
    // Needs a captcha of some sort FIX
    authenticate(req.body.username, req.body.password, "Log in", getchatlogs, "username", [req, res]) // FIX
});


app.post('/signup/:oid', function(req, res){
    // Check if username exists -> IF yes return error, ELSE create new user in database and send to "livechats" page
    console.log(req.params)
    authenticate(req.body.username, req.body.password, "Sign up", insertusername, "username", [req, res])
})

app.post('/getprice', (req, res)=>{
    sql = `SELECT * FROM orders WHERE orderID = '${req.body.oid}'`
    console.log(sql)
    db.all(sql, (err, data)=>{
      price = calculatePrice(data[0])
      res.status(200).json(price);
    })
})

// Booster Logins
app.post("/boosterlogin", (req, res) =>{
	authenticate(req.body.username, req.body.password, "Log in", getchatlogs, "boostername", [req, res])
})

app.get("/boosterportal", (req, res) =>{
	res.sendFile('/boosterlogin.html', {root: __dirname})
})


// Live chat shit
io.on("connection", socket => {
    console.log(socket.id)
    socket.on("authenticate", (username, password, usertype) =>{
        authenticate(username, password, "Log in", socketauth, "username", [username, socket])
        socketjoinchat(socket, username, usertype, getboost)
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

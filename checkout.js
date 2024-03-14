async function realCheckout(game){
    console.log("real checkout")
    if (so == 0){
        return
    }
    var v = ""
    var lpbox = document.getElementById("LP") // Is null if there is no lp value
    var winsbox = document.getElementById("quantity")
    var lp = 0
    var wins = 0
    if (lpbox){
        lp = lp.value
    }
    if (winsbox){
        wins = winsbox.value
    }

    console.log(lp)
    if (document.getElementById("duobutton").checked == true){
        v = "D"
    }
    else{
        v = "S"
    }
    
    const response = await fetch("/checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            game: game,
            start: `${rankStore[0]}+${divisionStore[0]}`,
            end: `${rankStore[1]}+${divisionStore[1]}`,
            duo: v,
            addwins: wins,
            currprogress: lp,
            role: "",
            character: "",
        }),
    })
    console.log(response)
    test = await response.json()
    window.location.href = `http://localhost:8080/signup/${test}`;
}
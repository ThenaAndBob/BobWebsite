console.log("real checkout")
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
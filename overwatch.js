// Globals cause fuck it XD
const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Champion", "5", "4", "3", "2", "1"];
// ffoawgopak my life but these are the variables that will be used to calculate payment
var rankStore= ["Gold", "Gold"]
var divisionStore = ["5", "5"]
var s = 0;

function toggle(){
    x = document.getElementById("duobutton");
    if (x.checked == false){
        x.checked = true;
    } 
    else {
        x.checked = false;
    }
    checkout();
}

function updateButtonSize() {
    const idarray = ["d1", "d2"]
    for (let i = 0; i < 2; i++) {
        document.getElementById(idarray[i]).style.width = 400 + window.innerWidth/20 + "px";
        document.getElementById(idarray[i]).style.height = 462 + window.innerWidth/12 + "px";
    } 
    if (window.innerWidth < 1635){
        document.getElementById("d3").style.top = "0px";
    }
    else{
        document.getElementById("d3").style.top = "120px";
    }
}

function chooseRankScript(x, oneOrTwo) {
    newRank = ranks[x];

    if (x <= 7) {
        rankImage = document.getElementById("rank" + oneOrTwo);
        rankImage.classList = ["selected"];
        rankImage.classList.add(newRank.toLowerCase());
        rankStore[oneOrTwo-1] = newRank;
    }
    else {
        rankNumber = document.getElementById("rankNumber" + oneOrTwo);
        rankNumber.innerHTML = "<h1>" + newRank + "</h1>";
        divisionStore[oneOrTwo-1] = newRank;
    }
    document.getElementById("conclusion").innerHTML = "<b>" + rankStore[0] + " " + divisionStore[0] + " " + "->" +  " " + rankStore[1] + " " + divisionStore[1] + "</b>"
}

// Prices 
const prices = [2, 2.5, 3, 3.2,
                3.4, 3.6, 3.8, 4, 4.25,
                4.5, 4.75, 5, 5.33, 5.66,
                6, 6.5, 7, 7.5, 8,
                8.5, 9, 9.5, 10, 10.5,
                11, 12, 14, 15, 17,
                25, 35, 50, 65, 85,
                105, 125, 150, 175, 200,
                220
            ]
function checkout(a){
    startIndex = ranks.indexOf(rankStore[0])*5 + ranks.indexOf(divisionStore[0])-8;
    endIndex = ranks.indexOf(rankStore[1])*5 + ranks.indexOf(divisionStore[1])-8;
    if (endIndex < startIndex){
        if (a == 1){
            chooseRankScript(ranks.indexOf(rankStore[0]),2)
            chooseRankScript(ranks.indexOf(divisionStore[0]), 2)
        }
        else {
            chooseRankScript(ranks.indexOf(rankStore[1]),1)
            chooseRankScript(ranks.indexOf(divisionStore[1]), 1)
        }
        checkout()
        return
    }
    s = 0
    prices.slice(startIndex, endIndex).forEach(x => s+=x);
    s += document.getElementById("quantity").value*prices[endIndex]/4;
    so = s;
    if (document.getElementById("duobutton").checked == true){
        so = so*1.5;
    }
    so = Math.round((so + Number.EPSILON) * 100) / 100
    document.getElementById("price").innerHTML = "<b>€" + so + "</b>"
}


document.getElementById("quantity").value = 0;
document.getElementById("duobutton").checked = false;
updateButtonSize();
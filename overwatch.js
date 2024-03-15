// Globals cause fuck it XD
const ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "5", "4", "3", "2", "1"];
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

    if (x <= 6) {
        rankImage = document.getElementById("rank" + oneOrTwo);
        rankImage.classList = ["selected"];
        rankImage.classList.add(newRank.toLowerCase());
        rankStore[oneOrTwo-1] = newRank;
    }
    else {
        rankNumber = document.getElementById("rankNumber" + oneOrTwo);
        rankNumber.innerHTML = newRank;
        divisionStore[oneOrTwo-1] = newRank;
    }
    document.getElementById("conclusion").innerHTML = "<b>" + rankStore[0] + " " + divisionStore[0] + " " + "->" +  " " + rankStore[1] + " " + divisionStore[1] + "</b>"
}

// Prices 
const prices = [2.2, 2.4, 2.6, 2.8,  
                3, 3.25, 3.5, 3.75, 4,  
                4.33, 4.66, 5, 5.33, 5.66,  
                6,6.4,6.8,7.2,7.6,
                8, 8.5, 9, 9.5, 10,
                11, 12, 13, 14, 15,
                18, 21, 23, 25, 27, 32]
function checkout(){
    startIndex = ranks.indexOf(rankStore[0])*5 + ranks.indexOf(divisionStore[0])-7;
    endIndex = ranks.indexOf(rankStore[1])*5 + ranks.indexOf(divisionStore[1])-7;
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
window.onresize = updateButtonSize;
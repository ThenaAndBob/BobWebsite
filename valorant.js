// Globals cause fuck it XD

const ranks = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "1", "2", "3", " "];

// ffoawgopak my life but these are the variables that will be used to calculate payment
var rankStore= ["Iron", "Iron"]
var divisionStore = ["1", "1"]
var s = 0;
var so = 0;


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
        if (window.innerWidth < 1635){
        document.getElementById("d3").style.top = "0px";
        }
        else{
            document.getElementById("d3").style.top = "120px";
        }
    } 
}

function chooseRankScript(x, oneOrTwo) {
    newRank = ranks[x];

    if (x <= 7) {
        if (newRank=="Immortal"){
            if (oneOrTwo==1){
                document.getElementById("rankNumber" + "1").innerHTML = "<input type='number' oninput='checkout()' id='LP' name='LPname' min='0' max='1500'><br>LP";
                document.getElementById("div1").innerHTML = "";
                divisionStore[0] = " ";
            }
            document.getElementById("div2").innerHTML = "Use the 'Additional Wins' to decide how many wins you want in immortal elo."
            temp = document.getElementById("rank" + "2");
            temp.classList = ["selected"];
            temp.classList.add("immortal");
            document.getElementById("rankNumber" + "2").innerHTML = "";
            rankStore[1] = "Immortal";
            divisionStore[1] = " ";
        }
        else if (rankStore[oneOrTwo-1]=="Immortal"){
            romanButtons(oneOrTwo);
        }
        rankImage = document.getElementById("rank" + oneOrTwo);
        rankImage.classList = ["selected"]
        rankImage.classList.add(newRank.toLowerCase());
        rankStore[oneOrTwo-1] = newRank;
    }
    else {
        rankNumber = document.getElementById("rankNumber" + oneOrTwo);
        rankNumber.innerHTML = "<h1>" + newRank + "</h1>";
        divisionStore[oneOrTwo-1] = newRank;
    }
    conclusion = document.getElementById("conclusion");
    conclusion.innerHTML = "<b>" + rankStore[0] + " " + divisionStore[0] + " " + "→" +  " " + rankStore[1] + " " + divisionStore[1] + "</b>"
    }

// Prices 
const prices = [3.2, 3.4, 3.6, 
                4.3, 4.6, 4.9, 
                5.3, 5.6, 5.9, 
                8.4, 8.8, 9.2, 
                12, 13, 14, 
                19, 20, 21, 
                40, 50, 60, 
                70]
function checkout(a){
    if (rankStore[0]=="Immortal"){
        s = document.getElementById("quantity").value*(15 + document.getElementById("LP").value/40)
    }
    else{
        startIndex = ranks.indexOf(rankStore[0])*3 + ranks.indexOf(divisionStore[0])-8;
        endIndex = ranks.indexOf(rankStore[1])*3 + ranks.indexOf(divisionStore[1])-8;
        if (divisionStore[1] == " "){
            endIndex -= 3;
        }
        s = 0
        prices.slice(startIndex, endIndex).forEach(x => s+=x);
        s += document.getElementById("quantity").value*prices[endIndex]/4

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
    }
    so = s
    if (document.getElementById("duobutton").checked == true){
        so = so*1.5;
    }
    so = Math.round((so + Number.EPSILON) * 100) / 100
    document.getElementById("price").innerHTML = "<b>€" + so + "</b>";
}

function romanButtons(oort){
    if (oort == 2){
        document.getElementById("div2").innerHTML = "<button onclick='chooseRankScript(8, 2)' class='romanNumeralButton'>1</button><button onclick='chooseRankScript(9, 2)' class='romanNumeralButton'>2</button><button onclick='chooseRankScript(10, 2)' class='romanNumeralButton'>3</button>";
        document.getElementById("rankNumber" + "2").innerHTML = "<h1>1</h1>";
        divisionStore[1] = "1"
    }
    document.getElementById("div1").innerHTML = "<button onclick='chooseRankScript(8, 1)' class='romanNumeralButton'>1</button><button onclick='chooseRankScript(9, 1)' class='romanNumeralButton'>2</button><button onclick='chooseRankScript(10, 1)' class='romanNumeralButton'>3</button>";
    document.getElementById("rankNumber" + "1").innerHTML = "<h1>1</h1>";
    divisionStore[0] = "1"
    rankStore[0] = "Ascendant";
    chooseRankScript(6, 1);
}

document.getElementById("quantity").value = 0;
document.getElementById("duobutton").checked = false;
updateButtonSize();



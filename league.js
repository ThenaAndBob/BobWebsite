// Globals cause fuck it XD
const ranks = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "IV", "III", "II", "I", " "];

// ffoawgopak my life but these are the variables that will be used to calculate payment
var rankStore= ["Iron", "Iron"]
var divisionStore = ["IV", "IV"]
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
        if (newRank=="Master"){
            if (oneOrTwo==1){
                document.getElementById("rankNumber" + "1").innerHTML = "<input type='number' oninput='checkout()' id='LP' name='LPname' min='0' max='1500'><br>LP";
                document.getElementById("div1").innerHTML = "";
                divisionStore[0] = " ";
            }
            document.getElementById("div2").innerHTML = "Use the 'Additional Wins' to decide how many wins you want in master elo."
            temp = document.getElementById("rank" + "2");
            temp.classList = ["selected"];
            temp.classList.add("master");
            document.getElementById("rankNumber" + "2").innerHTML = "";
            rankStore[1] = "Master";
            divisionStore[1] = " ";
        }
        else if (rankStore[oneOrTwo-1]=="Master"){
            romanButtons(oneOrTwo);
        }
        rankImage = document.getElementById("rank" + oneOrTwo);
        rankImage.classList = ["selected"]
        rankImage.classList.add(newRank.toLowerCase());
        rankStore[oneOrTwo-1] = newRank;
    }
    else {
        rankNumber = document.getElementById("rankNumber" + oneOrTwo);
        rankNumber.innerHTML = newRank;
        divisionStore[oneOrTwo-1] = newRank;
    }
    conclusion = document.getElementById("conclusion");
    conclusion.innerHTML = "<b>" + rankStore[0] + " " + divisionStore[0] + " " + "→" +  " " + rankStore[1] + " " + divisionStore[1] + "</b>"
}

// Prices 
const prices = [3.2, 3.4, 3.6, 3.8, 
                4, 4.3, 4.6, 4.9, 
                5, 5.3, 5.6, 5.9, 
                8, 8.4, 8.8, 9.2, 
                11, 12, 13, 14, 
                18, 19, 20, 21, 
                30, 40, 50, 60, 
                70]
function checkout(a){
    if (rankStore[0]=="Master"){
        s = document.getElementById("quantity").value*(15 + document.getElementById("LP").value/40)
    }
    else{
        startIndex = ranks.indexOf(rankStore[0])*4 + ranks.indexOf(divisionStore[0])-8;
        endIndex = ranks.indexOf(rankStore[1])*4 + ranks.indexOf(divisionStore[1])-8;
        if (divisionStore[1] == " "){
            endIndex -= 4;
        }
        s = 0
        prices.slice(startIndex, endIndex).forEach(x => s+=x);
        console.log(startIndex,endIndex,prices, s, divisionStore)
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
    document.getElementById("price").innerHTML = "<b>€" + so + "</b>"
    checkinvalidranks()
}

function romanButtons(oort){
    if (oort == 2){
        document.getElementById("div2").innerHTML = "<button onclick='chooseRankScript(8, 2)' class='romanNumeralButton'>IV</button><button onclick='chooseRankScript(9, 2)' class='romanNumeralButton'>III</button><button onclick='chooseRankScript(10, 2)' class='romanNumeralButton'>II</button><button onclick='chooseRankScript(11, 2)' class='romanNumeralButton'>I</button>";
        document.getElementById("rankNumber" + "2").innerHTML = "IV";
        divisionStore[1] = "IV"
    }
    document.getElementById("div1").innerHTML = "<button onclick='chooseRankScript(8, 1)' class='romanNumeralButton'>IV</button><button onclick='chooseRankScript(9, 1)' class='romanNumeralButton'>III</button><button onclick='chooseRankScript(10, 1)' class='romanNumeralButton'>II</button><button onclick='chooseRankScript(11, 1)' class='romanNumeralButton'>I</button>";
    document.getElementById("rankNumber" + "1").innerHTML = "IV";
    divisionStore[0] = "IV"
    rankStore[0] = "Diamond";
    chooseRankScript(6, 1);
}

document.getElementById("quantity").value = 0;
document.getElementById("duobutton").checked = false;
updateButtonSize();



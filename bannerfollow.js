window.onscroll = scrollFunction

function scrollFunction(){
    console.log(document.body.scrollTop)
    document.body.scrollTop = 200
    banner = document.getElementById("banner")
    if (document.documentElement.scrollTop < 50) {
        banner.style.border = "none"   
        banner.style.backdropFilter = "none"  
    } else {
        banner.style.border = "2px solid lightblue"
        banner.style.backdropFilter = "blur(10px)"  
    }
}
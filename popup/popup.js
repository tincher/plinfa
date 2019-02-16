var input = document.getElementById("blackinput");
input.addEventListener("keydown", (item) => {
    if (e.keyCode === 13) {
        addToBlacklist(item);
    }
});

function addToBlacklist(item) {
    console.log("test");
    console.log(item);
}

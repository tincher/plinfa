var input = document.getElementById("blacklistInput");
input.addEventListener("keydown", (item) => {
    if (item.keyCode === 13) {
        addToBlacklist(input.value);
        // TODO seite neuladen
    }
});

function addToBlacklist(blackWord) {
    browser.storage.local.get().then((blacklistObject) => {
        blacklistObject.value = (blacklistObject.value != undefined) ?
            blacklistObject.value.concat(blackWord.toLowerCase()) : [blackWord.toLowerCase()];
        browser.storage.local.set(blacklistObject)
            .then(() => console.log("Successfully saved new blacklist item"));
    }).catch((e) => console.log("Error while trying to get blacklist from storage"));
}
var input = document.getElementById("blacklistInput");
input.addEventListener("keydown", (item) => {
    if (item.keyCode === 13) {
        browser.storage.local.get().then((blacklistObject) => {
            blacklistObject.value = (blacklistObject.value != undefined) ?
                blacklistObject.value.concat(input.value.toLowerCase()) : [input.value.toLowerCase()];
            browser.storage.local.set(blacklistObject);

            sendPageReloadMessage();
        });
    }
});

function sendPageReloadMessage() {
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then((tabs) => {
        for (let tab of tabs) {
            browser.tabs.sendMessage(
                tab.id, {
                    reload: true
                }
            ).then(response => {
                console.log(response.response);
            }).catch((error) => {
                console.error(`Error: ${error}`);
            });
        }
    }).catch((error) => {
        console.error(`Error: ${error}`);
    });
}
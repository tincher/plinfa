wordInput = document.getElementById('wordInput');
channelInput = document.getElementById('channelInput');

wordInput.addEventListener('keydown', (item) => {
    handleKeyEvent(item);
});
channelInput.addEventListener('keydown', (item) => {
    handleKeyEvent(item);
})

function handleKeyEvent(item) {
    // TODO feedback on success
    if (item.keyCode === 13) {
        saveToDB(wordInput.value, channelInput.value);
        sendPageReloadMessage();
    }
}

function saveToDB(word, channel) {
    let dbObject = createDbObjekt(word, channel);
    browser.storage.local.get().then((storageBlacklist) => {
        storageBlacklist.value = (storageBlacklist.value != undefined) ?
            storageBlacklist.value.concat(dbObject) : [dbObject];
        browser.storage.local.set(storageBlacklist);
    });
}

function createDbObjekt(word, channel) {
    return {
        'channel': channel.toLowerCase(),
        'whitelist': false,
        'word': word.toLowerCase(),
    };
}

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



var dashboardButton = document.getElementById('dashboard-button');
dashboardButton.addEventListener('click', (e) => {
    console.log('success');
    var createdTab = browser.tabs.create({
        url: '/dashboard/dashboard.html'
    });
    createdTab.catch((error) => {
        console.log('error')
    });
});
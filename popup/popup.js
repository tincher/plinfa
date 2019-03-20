channelInput = document.getElementById('channelInput');
wordInput = document.getElementById('wordInput');
whitelistRadioButton = document.getElementById('whitelist');
blacklistRadioButton = document.getElementById('blacklist');
dropdownContent = document.getElementById('dropdown');
dashboardButton = document.getElementById('dashboard-button');
saveButton = document.getElementById('save-button');

dropdown.addEventListener('click', (event) => {
    browser.storage.local.get().then(storage => {
        let channelName = event.target.textContent;
        let confObject = storage.value.find(x => x.channel === channelName);
        channelInput.value = channelName;
        wordInput.value = confObject.words;
        whitelistRadioButton.checked = confObject.whitelist;
        blacklistRadioButton.checked = !confObject.whitelist;
        showDropdown(false);
    });
});

channelInput.addEventListener('input', (event) => {
    if (channelInput.value !== '') {
        unlockInputs();
        searchAndShow(channelInput.value);
        showDropdown(true);
    } else if (channelInput.value === '') {
        lockInputs();
        showDropdown(false);
    }
});

channelInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13) {
        save();
    }
});
wordInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13 && wordInput.value !== '') {
        save();
    }
});

data = [];
clusterize = new Clusterize({
    rows: data,
    scrollId: 'dropdown',
    contentId: 'contentArea'
});

function showDropdown(show) {
    dropdownContent.style.display = show ? '' : 'none';
}

function searchAndShow(input) {
    browser.storage.local.get().then((config) => {
        if (input === '') {
            clusterize.update([]);
        } else if (config.value !== undefined) {
            let filteredChannels = config.value.filter(x => x.channel.includes(input));
            if (filteredChannels.length === 0) {
                showDropdown(false);
            } else {
                let data = buildList(filteredChannels);
                clusterize.update(data);
            }
        }
    });
}

function buildList(list) {
    let result = [];
    list.forEach((element, i) => result.push(`<li id="${i}" class="pure-menu-item pure-menu-link">${element.channel}</li>`));
    return result;
}

function lockInputs() {
    wordInput.disabled = true;
    whitelistRadioButton.disabled = true;
    blacklistRadioButton.disabled = true;
}

function unlockInputs() {
    wordInput.disabled = false;
    whitelistRadioButton.disabled = false;
    blacklistRadioButton.disabled = false;
}

function save() {
    browser.storage.local.get().then((storageBlacklist) => {
        // TODO refactoring / optimisation
        let dbObject = createDbObjekt(wordInput.value, channelInput.value, whitelistRadioButton.checked);
        if (storageBlacklist.value !== undefined) {
            let index = storageBlacklist.value.findIndex(x => x.channel == channelInput.value)
            if (index >= 0) {
                storageBlacklist.value[index].words = dbObject.words;
                storageBlacklist.value[index].whitelist = dbObject.whitelist;
            } else {
                storageBlacklist.value.push(dbObject);
            }
        } else {
            storageBlacklist.value = [dbObject];
        }
        browser.storage.local.set(storageBlacklist).then(() => {
            sendPageReloadMessage();
        });
    });
}

function createDbObjekt(words, channel, whitelist) {
    return {
        channel: channel.toLowerCase(),
        whitelist: whitelist,
        words: words.split(',').map(x => x.trim().toLowerCase())
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
                window.close(); // maybe something more green
            }).catch((error) => {
                console.error(`Error: ${error}`);
            });
        }
    }).catch((error) => {
        console.error(`Error: ${error}`);
    });
}


dashboardButton.addEventListener('click', (e) => {
    var createdTab = browser.tabs.create({
        url: '/dashboard/dashboard.html'
    });
    createdTab.catch((error) => {
        console.log('error')
    });
});

saveButton.addEventListener('click', (event) => {
  save();
})

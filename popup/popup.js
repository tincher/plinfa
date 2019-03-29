import saveService from '../services/saveService.js';
saveService.init();

// -----------------------------------------------------------------------------
// variables
// -----------------------------------------------------------------------------

let channelInput = document.getElementById('channelInput');
let wordInput = document.getElementById('wordInput');
let whitelistRadioButton = document.getElementById('whitelist');
let blacklistRadioButton = document.getElementById('blacklist');
let dropdownContent = document.getElementById('dropdown');
let dashboardButton = document.getElementById('dashboard-button');
let saveButton = document.getElementById('save-button');


// -----------------------------------------------------------------------------
// install eventlisteners
// -----------------------------------------------------------------------------

// click listener for the whole dropdown, loads clicked config in popup
dropdown.addEventListener('click', (event) => {
    saveService.get().then(storage => {
        let channelName = event.target.textContent;
        let confObject = storage.value.find(x => x.channel === channelName);
        channelInput.value = channelName;
        wordInput.value = confObject.words;
        whitelistRadioButton.checked = confObject.whitelist;
        blacklistRadioButton.checked = !confObject.whitelist;
        showDropdown(false);
    });
});

// when something is typed in the channel input, it searches for matches,
// if nothing is in it, the other confis are locked
channelInput.addEventListener('input', (event) => {
    if (channelInput.value !== '') {
        lockInputs(false);
        searchAndShow(channelInput.value);
        showDropdown(true);
    } else if (channelInput.value === '') {
        lockInputs(true);
        showDropdown(false);
    }
});

// save button
saveButton.addEventListener('click', (event) => {
    save();
});

// if enter is pushed in one of the input boxes, it saves the config
channelInput.addEventListener('keydown', saveOnEnter);
wordInput.addEventListener('keydown', saveOnEnter);

// checks if enter is pushed, if so it saves
function saveOnEnter(event) {
    if (event.keyCode === 13) {
        save();
    }
}

// click listener for dashboard button
dashboardButton.addEventListener('click', (e) => {
    var createdTab = browser.tabs.create({
        url: '/dashboard/dashboard.html'
    });
    createdTab.catch((error) => {
        console.log('error')
    });
});


// -----------------------------------------------------------------------------
// page interaction
// -----------------------------------------------------------------------------

// init clusterize with empty datasave
let data = [];
let clusterize = new Clusterize({
    rows: data,
    scrollId: 'dropdown',
    contentId: 'contentArea'
});

// shows/hides the dropdown
function showDropdown(show) {
    dropdownContent.style.display = show ? '' : 'none';
}

// searches for the input in the channel list in config and fills the dropdown with it
function searchAndShow(input) {
    saveService.get().then((config) => {
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

// en- / disables inputs
function lockInputs(locked) {
    wordInput.disabled = locked;
    whitelistRadioButton.disabled = locked;
    blacklistRadioButton.disabled = locked;
}


// -----------------------------------------------------------------------------
// storage related
// -----------------------------------------------------------------------------

// gets the new config object and saves it, on success it sends a reload message to the tab
function save() {
    saveService.get().then((storageBlacklist) => {
        let isNew = true;
        let dbObject = createDbObjekt(wordInput.value, channelInput.value, whitelistRadioButton.checked);
        if (storageBlacklist.value !== undefined) {
            let index = storageBlacklist.value.findIndex(y => y.channel == channelInput.value)
            if (index >= 0) {
                storageBlacklist.value[index].words = dbObject.words;
                storageBlacklist.value[index].whitelist = dbObject.whitelist;
                isNew = false;
            } else {
                storageBlacklist.value.push(dbObject);
            }
        } else {
            storageBlacklist.value = [dbObject];
        }
        saveService.save(storageBlacklist).then(() => {
            sendPageReloadMessage(isNew);
        });
    });
}

// create consistent db object
function createDbObjekt(words, channel, whitelist) {
    return {
        channel: channel.toLowerCase(),
        whitelist: whitelist,
        words: words.split(',').map(x => x.trim().toLowerCase())
    };
}


// -----------------------------------------------------------------------------
// builder
// -----------------------------------------------------------------------------

// builds html list items from given list
function buildList(list) {
    let result = [];
    list.forEach((element, i) => result.push(`<li id="${i}" class="pure-menu-item pure-menu-link">${element.channel}</li>`));
    return result;
}


// -----------------------------------------------------------------------------
// communication with other extension parts
// -----------------------------------------------------------------------------

// send simple message to all active, current tabs, extension tab should reload
function sendPageReloadMessage(newItem) {
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then((tabs) => {
        for (let tab of tabs) {
            browser.tabs.sendMessage(
                tab.id, {
                    reload: true,
                    isFromBackground: false,
                    isFromPopup: true,
                    isNewItem: newItem
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

// save when save button is clicked
saveButton.addEventListener('click', (e) => {
    save();
})
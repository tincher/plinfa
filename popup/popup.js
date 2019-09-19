// -----------------------------------------------------------------------------
// SAVESERVICE
// -----------------------------------------------------------------------------

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
// EVENTLISTENERS
// -----------------------------------------------------------------------------

// if enter is pushed in one of the input boxes, it saves the config
channelInput.addEventListener('keydown', saveOnEnter);
wordInput.addEventListener('keydown', saveOnEnter);

// save button
saveButton.addEventListener('click', (_) => {
    save();
});

// click listener for dashboard button
dashboardButton.addEventListener('click', (_) => {
    let createdTab = browser.tabs.create({
        url: '/dashboard/dashboard.html'
    });
    createdTab.catch((err) => {
        console.log(`Error: ${err}`)
    });
});

// click listener for the whole dropdown, loads clicked config in popup
dropdownContent.addEventListener('click', (event) => {
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
channelInput.addEventListener('input', (_) => {
    if (channelInput.value !== '') {
        lockInputs(false);
        searchAndShow(channelInput.value).then((rows) => {
            showDropdown(rows > 0);
        });
    } else if (channelInput.value === '') {
        lockInputs(true);
        showDropdown(false);
    }
});


// -----------------------------------------------------------------------------
// page interaction
// -----------------------------------------------------------------------------

// shows/hides the dropdown
function showDropdown(show) {
    dropdownContent.style.display = show ? '' : 'none';
}

// searches for the input in the channel list in config and fills the dropdown with it
function searchAndShow(input) {
    return new Promise((resolve, _) => {
        saveService.get().then((config) => {
            if (config.value !== undefined) {
                let filteredChannels = config.value.filter(x => x.channel.includes(input));
                resolve(updateSearch(filteredChannels));
            } else {
                resolve(updateSearch([]));
            }
            resolve(0);
        });
    });
}

// en- / disables inputs
function lockInputs(locked) {
    wordInput.disabled = locked;
    whitelistRadioButton.disabled = locked;
    blacklistRadioButton.disabled = locked;
    saveButton.disabled = locked;
}

function updateSearch(data) {
    while (dropdownContent.children[0].hasChildNodes()) {
        dropdownContent.children[0].removeChild(dropdownContent.children[0].firstChild);
    }
    let template = document.getElementById('search-result');
    for (let i = 0; i < data.length; i++) {
        let clone = document.importNode(template.content, true);
        let li = clone.querySelector('li');
        li.setAttribute('id', i.toString());
        li.textContent = data[i].channel;
        dropdownContent.children[0].appendChild(clone)
    }
    return data.length;
}


// -----------------------------------------------------------------------------
// storage related
// -----------------------------------------------------------------------------

// checks if enter is pushed, if so it saves
function saveOnEnter(event) {
    if (event.which === 13) {
        save();
    }
}

// gets the new config object and saves it, on success it sends a reload message to the tab
function save() {
    saveService.get().then((storageBlacklist) => {
        let isNew = true;
        let dbObject = createDbObjekt(wordInput.value, channelInput.value, whitelistRadioButton.checked);
        if (storageBlacklist.value !== undefined) {
            let index = storageBlacklist.value.findIndex(y => y.channel === channelInput.value);
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
            ).then(_ => {
                successfullFeedback();
            }).catch((error) => {
                console.error(`Error: ${error}`);
            });
        }
    }).catch((error) => {
        console.error(`Error: ${error}`);
    });
}

function successfullFeedback() {
    channelInput.className += 'successInput';
    wordInput.className += 'successInput';

    // setTimeout(() => channelInput.classList.remove('successInput'), 1000);
    // setTimeout(() => wordInput.classList.remove('successInput'), 1000);
    setTimeout(() => window.close(), 1000);
}
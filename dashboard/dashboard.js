// -----------------------------------------------------------------------------
// imports
// -----------------------------------------------------------------------------

import saveService from '../services/saveService.js';

// -----------------------------------------------------------------------------
// variables
// -----------------------------------------------------------------------------

let delBtns;
let localStorageRadio = document.getElementById('localStorage');
// let syncStorageRadio = document.getElementById('syncStorage');
let activeCheckbox = document.getElementById('active');
let progressbar = document.getElementById('progressbar');
let searchBar = document.getElementById('searchBar');
let downloadButton = document.getElementById('downloadButton');
let configUploadButton = document.getElementById('configurationFile');

let intervalId = undefined;
let clearingIntervalId = undefined;

configUploadButton.addEventListener('change', updateConfig);
downloadButton.addEventListener('click', downloadConfigAsJSONFile);
progressbar.style.width = '0%';


function clearProgress() {
    progressbar.className = '';
    progressbar.style.width = '0%';
    clearInterval(clearingIntervalId);
}

function setProgressTo(percentage) {
    clearInterval(intervalId);
    intervalId = setInterval(updateProgress, 7, percentage);
    showPositiveFeedback();
}

function updateProgress(percentage) {
    let width = progressbar.style.width.slice(0, -1);
    if (width >= percentage) {
        if (width >= 100) {
            clearingIntervalId = setInterval(clearProgress, 500);
        }
        clearInterval(intervalId);
    } else {
        width++;
        progressbar.style.width = width + '%';
    }
}

function showNegativeFeedback() {
    progressbar.classList.add('unsuccessful-bar');
    progressbar.style.width = '100%';
    clearingIntervalId = setInterval(clearProgress, 500);
}

function showPositiveFeedback() {
    progressbar.classList.add('greenbar');
}

function getConfigurationObjectFromEvent(event) {
    return JSON.parse(event.target.result);

}

function updateConfig() {
    let uploadedFiles = configUploadButton.files;
    if (uploadedFiles.length > 0) {
        let fr = getFileReader();
        fr.readAsText(uploadedFiles.item(0));
    } else {
        showNegativeFeedback();

    }
}

function getFileReader() {
    let fileReader = new FileReader();
    fileReader.onload = function (event) {
        let configurationObject = getConfigurationObjectFromEvent(event);
        showPositiveFeedback();
        setProgressTo(30);
        saveService.save(configurationObject);
        setProgressTo(60);
        updateSite();
        setProgressTo(100);
    };
    return fileReader;
}


// -----------------------------------------------------------------------------
// event listeners
// -----------------------------------------------------------------------------

// button click saves config to local storage
document.getElementById('saveButton').addEventListener('click', (_) => {
    setProgressTo(10);
    let tbody = document.getElementById('contentArea');
    let config = {
        value: parseTbodyToConfig(tbody),
        localStorage: localStorageRadio.checked,
        active: activeCheckbox.checked
    };
    setProgressTo(40);
    saveService.save(config).then((_) => {
        setProgressTo(100);
        updateSite();
    }).catch((error) => {
        console.log(error);
        showNegativeFeedback();
    });
});

// search bar listener
searchBar.addEventListener('input', e => {
    let inp = searchBar.value;
    if (inp !== '') {
        searchWord(inp).then((res) => {
            buildTableRows(res);
        });
    } else {
        updateSite();
    }
});


// -----------------------------------------------------------------------------
// update site
// -----------------------------------------------------------------------------

// get config from storage, build rows, push them to clusterize
function updateSite() {
    saveService.get().then((config) => {
        if (!config.localStorage) {
            syncStorage.checked = true;
        } else {
            localStorage.checked = true;
        }
        activeCheckbox.checked = (config.active === undefined) ? true : config.active;
        if (config.value !== undefined) {
            buildTableRows(config.value);
        }
        delBtns = Array.from(document.getElementsByClassName('deleteButton'));
        delBtns.map(delBtn => delBtn.addEventListener('click', deleteRow));
    }).catch((error) => {
        console.log(error);
    });
}

// run updateSite
saveService.init().then(() => updateSite());


// -----------------------------------------------------------------------------
// builder
// -----------------------------------------------------------------------------

// build a single table row from config entry
function buildTableRows(config) {
    // Object extractable
    let template = document.querySelector('#configRows');
    let tbody = document.querySelector('tbody');
    while (tbody.hasChildNodes()) {
        tbody.removeChild(tbody.firstChild);
    }
    for (let i = 0; i < config.length; i++) {
        let clone = document.importNode(template.content, true);
        let td = clone.querySelectorAll("td");
        td[0].textContent = config[i].channel;
        td[1].children[0].children[config[i].whitelist ? 0 : 1].setAttribute("checked", true);
        td[2].children[0].setAttribute("value", config[i].words);
        td[3].children[0].setAttribute("id", config[i].channel.split(' ').join(''));
        td[3].children[0].children[0].setAttribute("id", config[i].channel);
        tbody.appendChild(clone);
    }
}

// // dummy row for testing
// function buildDummyRow(counter) {
//     let configEntry = {
//         channel: 'Channel 1',
//         whitelist: true,
//         words: ['Entry 1', 'entry 2']
//     };
//     return buildTableRow(configEntry, counter)
// }


// -----------------------------------------------------------------------------
// parser (from table to config)
// -----------------------------------------------------------------------------

// builds config entry from table row
function parseTrowToConfigEntry(entry) {
    let children = entry.children;
    return {
        channel: children.item(0).textContent,
        words: children.item(2).children.item(0).value.split(','),
        whitelist: children.item(1).children.item(0).children.item(0).checked
    };
}

// builds config object from table body
function parseTbodyToConfig(tbody) {
    let result = [];
    for (let i = 0; i < tbody.children.length; i++) {
        result.push(parseTrowToConfigEntry(tbody.children.item(i)));
    }
    return result;
}

// deletes a config entry and updates site
function deleteRow(event) {
    let channelName = event.target.id;
    saveService.get().then((config) => {
        let configValue = config.value.filter(function (obj) {
            return (obj.channel.split(' ').join('') !== channelName.split(' ').join(''));
        });
        config.value = configValue;
        saveService.save(config).then(e => {
            updateSite();
        });
    });
}

// -----------------------------------------------------------------------------
// search bar function and listener
// -----------------------------------------------------------------------------

// filters the config by given substring
function searchWord(chars) {
    return new Promise((resolve, reject) => {
        saveService.get().then((cfg) => {
            let searchResults = cfg.value.filter(function (obj) {
                let foundInd = obj.words.findIndex(function (word) {
                    return word.includes(chars);
                });
                return (obj.channel.includes(chars) || foundInd > -1);
            });
            resolve(searchResults);
        }).catch((err) => {
            // console.error(`Error: ${err}`);
            reject(err);
        });
    });
}

function downloadConfigAsJSONFile() {
    saveService.get().then((configuration) => {
        let downloadElement = document.createElement('a');
        downloadElement.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(configuration)));
        downloadElement.setAttribute('download', 'config.json');
        downloadElement.style.display = 'none';
        document.body.appendChild(downloadElement);
        downloadElement.click();
        document.body.removeChild(downloadElement);
    });
}

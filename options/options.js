// save the options to sync storage
function saveOptions() {
    let checkbox = document.getElementById('active').checked;
    browser.storage.sync.set({
        active: checkbox
    });
}

// restores options from sync storage
function restoreOptions() {
    function setCurrentChoice(result) {
        let value = (result.active != undefined) ? result.active : false;
        document.getElementById('active').checked = value;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get('active');
    getting.then(setCurrentChoice, onError);
}

// restores options on DOMContentLoaded
document.addEventListener('DOMContentLoaded', restoreOptions);

// saves options on click
document.getElementById('active').addEventListener('click', saveOptions);
function saveOptions() {
    let checkbox = document.getElementById('active').checked;
    browser.storage.sync.set({
        active: checkbox
    });
}

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

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('active').addEventListener('click', saveOptions);
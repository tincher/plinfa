// -----------------------------------------------------------------------------
// event listeners
// -----------------------------------------------------------------------------

// restores options on DOMContentLoaded
document.addEventListener('DOMContentLoaded', restoreOptions);

// saves options on click
document.getElementById('active').addEventListener('click', saveOptions);


// -----------------------------------------------------------------------------
// option functions
// -----------------------------------------------------------------------------

// save the options to local storage
function saveOptions() {
    let checkbox = document.getElementById('active').checked;
    browser.storage.local.set({
        active: checkbox
    });
}

// restores options from local storage
function restoreOptions() {
    function setCurrentChoice(result) {
        let value = (result.active != undefined) ? result.active : false;
        document.getElementById('active').checked = value;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.local.get('active');
    getting.then(setCurrentChoice, onError);
}
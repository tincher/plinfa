import saveService from '../services/saveService.js';

saveService.init().then(() => {
    browser.runtime.onMessage.addListener(request => {
        if (request.operation === 'save') {
            return saveService.save(request.value);
        } else if (request.operation === 'get') {
            return saveService.get();
        }
        return Promise.resolve('no fitting operation');
    });
});






// TODO docs
// browser.contextMenus.create({
//     id: "log-selection",
//     title: browser.i18n.getMessage("contextMenuItemSelectionLogger"),
//     contexts: ["selection"]
// }, onCreated);
//
// remove from context menu


// -----------------------------------------------------------------------------
// UPBOARDING PAGE
// -----------------------------------------------------------------------------

browser.runtime.onInstalled.addListener(async ({
    reason,
    temporary,
}) => {
    if (temporary) return; // skip during development
    switch (reason) {
        case "install":
            await browser.tabs.create({
                url: browser.runtime.getURL("onboarding/installed.html"),
            });
            break;
        case "update":
            await browser.tabs.create({
                url: browser.runtime.getURL("onboarding/updated.html"),
            });
            break;
    }
});


browser.webRequest.onCompleted.addListener((details) => {
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then((tabs) => {
        for (let tab of tabs) {
            browser.tabs.sendMessage(
                tab.id, {
                    reload: true,
                    isFromBackground: true
                }
            ).then(response => {
                // console.log(response);
            }).catch((error) => {
                console.error(`Error: ${error}`);
            });
        }
    }).catch((error) => {
        console.error(`Error: ${error}`);
    });
}, {
    urls: ['*://*.youtube.com/*']
});
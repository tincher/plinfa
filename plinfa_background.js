// browser.contextMenus.create({
//     id: "log-selection",
//     title: browser.i18n.getMessage("contextMenuItemSelectionLogger"),
//     contexts: ["selection"]
// }, onCreated);
//
// remove from context menu


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
                console.log(response);
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
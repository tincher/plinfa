// -----------------------------------------------------------------------------
// VARIABLES
// -----------------------------------------------------------------------------

let childNodeChangeCount = 0;


// -----------------------------------------------------------------------------
// LOGIC
// -----------------------------------------------------------------------------

// main function to control the filter
function main() {
    getStorage().then((blacklistObject) => {
        const all_videos = getVideos();
        const all_titles = getTitles();
        const all_channels = getChannelNames();
        // addItemToStorage("auto alphabet", "jp performance", blacklistObject);
        addItemToStorage("top 10", "Onefootball Deutschland", blacklistObject);
        filterSubsByBlacklist(all_videos, all_titles, all_channels, blacklistObject);
    });
}


// if active setting is set, the initialization is started
browser.storage.sync.get('active').then((result) => {
    if (result.active || result.active == undefined) {
        initObserver();
        const checkForSiteChange = function() {
            if (childNodeChangeCount > 200) {
                main();
            }
            childNodeChangeCount = 0;
        }
        window.setInterval(checkForSiteChange, 200);
    }
});


// -----------------------------------------------------------------------------
// MUTATIONOBSERVER
// -----------------------------------------------------------------------------

// initialize the observer to count the changes of child nodes
function initObserver() {
    const callback = function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type == 'childList') {
                childNodeChangeCount += 1;
            }
        }
    };
    const observer = new MutationObserver(callback);
    const targetNode = document.getElementById("page-manager");
    const config = {
        childList: true,
        subtree: true
    };
    observer.observe(targetNode, config);
}


// -----------------------------------------------------------------------------
// COMMUNICATION WITH OTHER WEB-EXT PARTS
// -----------------------------------------------------------------------------

// listens for message from popup and runs the main method following the message
browser.runtime.onMessage.addListener(request => {
    main();
    return Promise.resolve({
        response: "Message received"
    });

});


// -----------------------------------------------------------------------------
// STORAGE INTERACTION
// -----------------------------------------------------------------------------

// create a consistent db item
function createBlacklistItem(blackWord, blackChannel, blacklistObject) {
    let dbObject = createDbObjekt(blackWord, blackChannel);
    blacklistObject.value = (blacklistObject.value != undefined) ?
        blacklistObject.value.concat(dbObject) : [dbObject];
    return blacklistObject;
}

// create db object
function createDbObjekt(word, channel) {
    return {
        'word': word.toLowerCase(),
        'channel': channel.toLowerCase()
    };
}

// store the given word to the db
function addItemToStorage(blackWord, blackChannel, blacklistObject) {
    browser.storage.local.set(createBlacklistItem(blackWord, blackChannel, blacklistObject))
        .then(() => console.log("success"));
}

// get the current storage
function getStorage() {
    return browser.storage.local.get().then((result) => {
        return result;
    }).catch((e) => console.log("Error while trying to get blacklist from storage"));
}


// -----------------------------------------------------------------------------
// SITE INTERACTION
// -----------------------------------------------------------------------------

// get the video html elements
function getVideos() {
    let grid_videos = document.getElementsByTagName("ytd-grid-video-renderer");
    let list_videos = document.getElementsByTagName("ytd-item-section-renderer");
    return (grid_videos.length > list_videos.length) ? grid_videos : list_videos;
}

// remove the subscription video from the site
function removeSubFromSite(videoTitle, videos, titles) {
    let videoIndex = titles.indexOf(videoTitle);
    videos[videoIndex].parentNode.removeChild(videos[videoIndex]);
}

// get channel names
function getChannelNames() {
    return document.getElementsByClassName('yt-simple-endpoint style-scope yt-formatted-string');
}

// get all the titles as string array
function getTitles() {
    let grid_titles = document.getElementsByClassName("yt-simple-endpoint style-scope ytd-grid-video-renderer");
    // document.querySelectorAll('a#video-title');
    let list_titles = document.getElementsByClassName("title-and-badge");
    result = [];
    if (grid_titles.length > list_titles.length) {
        for (let i = 0; i < grid_titles.length; i++) {
            result.push(grid_titles.item(i).text);
        }
    } else {
        for (let i = 0; i < list_titles.length; i++) {
            title = list_titles.item(i).children.namedItem("video-title").text;
            result.push(title.toLowerCase().split(/\s|\\n/g).filter((x) => x != "").join(" "));
        }
    }
    return result;
}


// -----------------------------------------------------------------------------
// ADDITIONAL
// -----------------------------------------------------------------------------

// filter the sub elements for the
function filterSubsByBlacklist(videos, titles, channels, blacklist) {
    titles.forEach((title, i) => {
        if (isSeriesBlacklisted(blacklist, title, channels[i])) {
            removeSubFromSite(title, videos, titles);
        }
    });
}

function isSeriesBlacklisted(blacklist, title, channel) {
    let result = false;
    blacklist.value.forEach((blacklistElement) => {
        if (title.toLowerCase().includes(blacklistElement.word) && channel.text.toLowerCase() == blacklistElement.channel) {
            result = true;
            // break
        }
    });
    return result;
}


// // checks if any of the keywords is in the provided title
// function isAnyFromArrayInString(words, title) {
//     let result = false;
//     words.value.forEach((word) => {
//         if (title.toLowerCase().includes(word)) {
//             result = true;
//         }
//     });
//     return result;
// }


// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
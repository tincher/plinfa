// -----------------------------------------------------------------------------
// VARIABLES
// -----------------------------------------------------------------------------

var childNodeChangeCount = 0;


// -----------------------------------------------------------------------------
// LOGIC
// -----------------------------------------------------------------------------

// main function to control the filter
function main() {
    getStorage().then((blacklistObject) => {
        var all_videos = getVideos();
        var all_titles = getTitles();
        addItemToStorage("auto alphabet", blacklistObject);
        // addItemToStorage("nhl", blacklistObject);
        filterSubsByBlacklist(all_videos, all_titles, blacklistObject);
    });
}


// if active setting is set, the initialization is started
browser.storage.sync.get('active').then((result) => {
    if (result.active) {
        initObserver();
        var checkForSiteChange = function() {
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
    var callback = function(mutationsList, observer) {
        for (var mutation of mutationsList) {
            if (mutation.type == 'childList') {
                childNodeChangeCount += 1;
            }
        }
    };
    var observer = new MutationObserver(callback);
    var targetNode = document.getElementById("page-manager");
    var config = {
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
function createBlacklistItem(blackWord, blacklistObject) {
    blacklistObject.value = (blacklistObject.value != undefined) ?
        blacklistObject.value.concat(blackWord) : [blackWord];
    return blacklistObject;
}

// store the given word to the db
function addItemToStorage(blackWord, blacklistObject) {
    browser.storage.local.set(createBlacklistItem(blackWord, blacklistObject))
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
    videoIndex = titles.indexOf(videoTitle);
    videos[videoIndex].parentNode.removeChild(videos[videoIndex]);
}

// get all the titles as string array
function getTitles() {
    let grid_titles = document.getElementsByClassName("yt-simple-endpoint style-scope ytd-grid-video-renderer");
    let list_titles = document.getElementsByClassName("title-and-badge");
    result = [];
    if (grid_titles.length > list_titles.length) {
        for (var i = 0; i < grid_titles.length; i++) {
            result.push(grid_titles.item(i).text);
        }
    } else {
        for (var i = 0; i < list_titles.length; i++) {
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
function filterSubsByBlacklist(videos, titles, blacklist) {
    titles.forEach((element) => {
        if (isAnyFromArrayInString(blacklist, element)) {
            removeSubFromSite(element, videos, titles);
        }
    });
}

// checks if any of the keywords is in the provided title
function isAnyFromArrayInString(words, title) {
    let result = false;
    words.value.forEach((word) => {
        if (title.toLowerCase().includes(word)) {
            result = true;
        }
    });
    return result;
}
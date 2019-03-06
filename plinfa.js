// create a consistent db item
function createBlacklistItem(blackWord, blacklistObject) {
    blacklistObject.value = (blacklistObject.value != undefined)?
        blacklistObject.value.concat(blackWord): [blackWord];
    // blacklistObject.value = [blackWord].concat(blacklistObject.value)
    return blacklistObject;
}

// store the given word to the db
function addItemToStorage(blackWord, blacklistObject) {
    browser.storage.local.set(createBlacklistItem(blackWord, blacklistObject))
        .then(() => console.log("success"));
}

// collect the titles and return them in the right format
function fetchTitles(videos, titles) {
    var result = [];
    for (var i = 0; i < videos.length; i++){
            video = videos.item(i);
            title = titles.item(i).children.namedItem("video-title").text;
            result.push(title.toLowerCase().split(/\s|\\n/g).filter((x)=>x!="").join(" "));
    }
    return result;
}

// get the current storage
function getStorage() {
    return browser.storage.local.get().then((result) => {
        return result;
    }).catch((e) => console.log("Error while trying to get blacklist from storage"));
}

// filter the sub elements for the
function filterSubsByBlacklist(videos, titles, blacklist){
    titles.forEach((element) => {
        if (isAnyFromArrayInString(blacklist, element)){
            removeSubFromSite(element, videos, titles);
        }
    });
}

// remove the subscription video from the site
function removeSubFromSite(videoTitle, videos, titles) {
    videoIndex = titles.indexOf(videoTitle);
    videos[videoIndex].parentNode.removeChild(videos[videoIndex]);
    console.log("Index: " + videoIndex);
}

// checks if any of the keywords is in the provided title
function isAnyFromArrayInString(words, title) {
    let result = false;
    words.value.forEach((word) => {
        if (title.includes(word)) {
            result = true;
        }
    });
    return result;
}

// main function
function main() {
    getStorage().then((blacklistObject) => {
        var all_videos = document.getElementsByTagName("ytd-item-section-renderer");
        var all_titles = document.getElementsByClassName("title-and-badge");
        var titles = fetchTitles(all_videos, all_titles);
        // addItemToStorage("wired", blacklistObject);
        // addItemToStorage("nhl", blacklistObject);
        filterSubsByBlacklist(all_videos, titles, blacklistObject);
    })
}

main();

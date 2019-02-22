// get the current blacklits
const blackList = getStorage();
var all_videos = document.getElementsByTagName("ytd-item-section-renderer");
var all_titles = document.getElementsByClassName("title-and-badge");

// create a consistent db item
function createBlacklistItem(blackWord) {
    return {"value": blackWord.toLowerCase()};
}

// store the given word to the db
function addItemToStorage(blackWord) {
    browser.storage.local.set(createBlacklistItem(blackWord))
        .then(() => console.log("success"));
}

// collect the titles and return them in the right format
function fetchTitles() {
    var result = [];
    for (var i = 0; i < all_videos.length; i++){
            video = all_videos.item(i);
            title = all_titles.item(i).children.namedItem("video-title").text;
            result.push(title.toLowerCase().split(/\s|\\n/g).filter((x)=>x!="").join(" "));
    }
    return result;
}

// get the current storage
function getStorage() {
    let result = {};
    browser.storage.local.get().then((blackList) => {
        result = blackList;
    }).catch((e) => console.log("Error while trying to get blacklist from storage"));
    return result;
}

// filter the sub elements for the
function filterSubsByBlacklist(elements){
    elements.forEach((element) =>{
        if (isAnyFromArrayInString(blackList, element)){
            removeSubFromSite(element);
        }
    });
}

// remove the subscription video from the site
function removeSubFromSite(videoTitle) {
    videoIndex = fetchTitles().indexOf(videoTitle);
    all_videos[videoIndex].parentNode.removeChild(all_videos[videoIndex]);
    console.log("Index: " + videoIndex);
}

// checks if any of the keywords is in the provided title
function isAnyFromArrayInString(words, title) {
    let result = false;
    words.forEach((word) => {
        if (title.includes(word)) {
            result = true;
        }
    });
    return result;
}

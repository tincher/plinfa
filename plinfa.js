// -----------------------------------------------------------------------------
// VARIABLES
// -----------------------------------------------------------------------------

let childNodeChangeCount = 0;
let unfilteredVideos = [];
let liveVideos;
let l = 0;
let filteredNumber = 0;



// -----------------------------------------------------------------------------
// LOGIC
// -----------------------------------------------------------------------------

// main function to control the filter
function main(liveVideos, titles) {
    getStorage().then((blacklistObject) => {
        if (blacklistObject.value !== undefined) {
            const allChannels = getChannelNames();
            filterSubsByBlacklist(liveVideos, titles, allChannels, blacklistObject);
            console.log('filter done');
        }
    }).catch((err) => {
        console.error(`Error: ${err}`)
    });
}

function restoreSubs(liveVideos) {
    let temp = true;
    try {
        for (i = 0; filteredNumber > 0; i++) {
            if (liveVideos.item(i) != unfilteredVideos[i]) {
                if (i < liveVideos.length) {
                    liveVideos.item(i).parentNode.insertBefore(unfilteredVideos[i], liveVideos.item(i));
                    filteredNumber--;
                } else {
                    liveVideos.item(i).parentNode.insertBefore(unfilteredVideos[i], null);
                    filteredNumber--;
                }
            }
            if (temp) {
                temp = false;
                console.log('subs restored');
            }
        }
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}


// -----------------------------------------------------------------------------
// COMMUNICATION WITH OTHER WEB-EXT PARTS
// -----------------------------------------------------------------------------

// listens for message from popup and runs the main method following the message

browser.runtime.onMessage.addListener(request => {
    // only if active is set in sync storage
    let allTitles = getTitles();
    let liveVideos = getVideos();
    if (liveVideos != undefined) {
        if (request.isFromBackground) {
            if (liveVideos.length > l) {
                let newStaticVideos = getStaticVideos().slice(l + filteredNumber);
                unfilteredVideos.push(...newStaticVideos);
                let newVideos = Array.from(liveVideos).slice(l);
                l = getVideosLength();
                main(newVideos, allTitles);
            }
        } else if (request.isFromPopup) {
            if (!request.isNewItem) {
                restoreSubs(liveVideos);
                unfilteredVideos = getStaticVideos();
                filteredNumber = 0;
                l = 0;
            }
            main(liveVideos, allTitles);
        }
        return Promise.resolve({
            response: "Message received"
        });
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
// STORAGE INTERACTION
// -----------------------------------------------------------------------------

// get the current storage
function getStorage() {
    return browser.storage.local.get().then((result) => {
        return result;
    }).catch((err) => console.error(`Error: ${err}`));
}


// -----------------------------------------------------------------------------
// SITE INTERACTION
// -----------------------------------------------------------------------------

// remove the subscription video from the site
function removeSubFromSite(videoTitle, videos, titles) {
    let videoIndex = titles.indexOf(videoTitle);
    delete titles[titles.indexOf(videoTitle)];
    videos[videoIndex].parentNode.removeChild(videos[videoIndex]);
    filteredNumber++;
}

function getStaticVideos() {
    let gridVideos = document.querySelectorAll('ytd-grid-video-renderer');
    let listVideos = document.querySelectorAll('ytd-item-section-renderer');
    return Array.from((gridVideos.length > listVideos.length) ? gridVideos : listVideos);
}

// get the video html elements
function getVideos() {
    let gridVideos = document.getElementsByTagName("ytd-grid-video-renderer");
    let listVideos = document.getElementsByTagName("ytd-item-section-renderer");
    return (gridVideos.length > listVideos.length) ? gridVideos : listVideos;
}

function getVideosLength() {
    return document.querySelectorAll("ytd-grid-video-renderer").length;
}

// get channel names
function getChannelNames() {
    return Array.from(document.getElementsByClassName('yt-simple-endpoint style-scope yt-formatted-string'));
}

// get all the titles as string array
function getTitles() {
    let gridTitles = document.getElementsByClassName("yt-simple-endpoint style-scope ytd-grid-video-renderer");
    // document.querySelectorAll('a#video-title');
    let listTitles = document.getElementsByClassName("title-and-badge");
    result = [];
    if (gridTitles.length > listTitles.length) {
        for (let i = 0; i < gridTitles.length; i++) {
            result.push(gridTitles.item(i).text);
        }
    } else {
        for (let i = 0; i < listTitles.length; i++) {
            title = listTitles.item(i).children.namedItem("video-title").text;
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
    filteredVideos = Array.from(videos).filter((video) =>
        hasToBeRemoved(blacklist, video.querySelector('h3').textContent, video.querySelector('yt-formatted-string').textContent));
    l -= filteredVideos.length;
    filteredVideos.map(video => {
        video.parentNode.removeChild(video);
        filteredNumber++;
    });
    // console.log(`First: ${videos[0].querySelector('h3').textContent}`);
    // console.log(`Last: ${videos[videos.length - 1].querySelector('h3').textContent}`);
}

// filters if the series of this channel is in your blacklist or not on your whitelist
function hasToBeRemoved(list, title, channel) {
    // TODO refactor to filter
    for (i = 0; i < list.value.length; i++) {
        let elem = list.value[i];
        if (elem.channel == channel.toLowerCase()) {
            if (elem.words.some(x => title.toLowerCase().includes(x))) {
                if (!elem.whitelist) {
                    return true;
                }
            } else if (elem.whitelist) {
                return true;
            }
        }
    }
    return false;
}
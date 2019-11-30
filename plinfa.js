// -----------------------------------------------------------------------------
// VARIABLES
// -----------------------------------------------------------------------------

let childNodeChangeCount = 0;
let unfilteredVideos = [];
let liveVideos;
let l = 0;
let filteredNumber = 0;
let lastSite = "";

// -----------------------------------------------------------------------------
// LOGIC
// -----------------------------------------------------------------------------

// main function to control the filter
function main(liveVideos, titles) {
    get()
        .then(blacklistObject => {
            if (blacklistObject.value !== undefined) {
                const allChannels = getChannelNames();
                filterSubsByBlacklist(
                    liveVideos,
                    titles,
                    allChannels,
                    blacklistObject
                );
                console.log("filter done");
            }
        })
        .catch(err => {
            console.error(`Error: ${err}`);
        });
}

function restoreSubs(liveVideos) {
    let temp = true;
    try {
        for (i = 0; filteredNumber > 0; i++) {
            if (liveVideos.item(i) != unfilteredVideos[i]) {
                if (i < liveVideos.length) {
                    liveVideos
                        .item(i)
                        .parentNode.insertBefore(
                            unfilteredVideos[i],
                            liveVideos.item(i)
                        );
                    filteredNumber--;
                } else {
                    liveVideos
                        .item(i)
                        .parentNode.insertBefore(unfilteredVideos[i], null);
                    filteredNumber--;
                }
            }
            if (temp) {
                temp = false;
                console.log("subs restored");
            }
        }
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}
// -----------------------------------------------------------------------------
// storage
// -----------------------------------------------------------------------------

function save(value) {
    browser.runtime.sendMessage({
            operation: "save",
            value: value
        }).then(() => console.log("success"))
        .catch(err => {
            console.error(`Error: ${err}`);
        });
}

function get() {
    return browser.runtime.sendMessage({
        operation: "get"
    });
}

// -----------------------------------------------------------------------------
// COMMUNICATION WITH OTHER WEB-EXT PARTS
// -----------------------------------------------------------------------------

// listens for message from popup and runs the main method following the message
browser.runtime.onMessage.addListener(request => {
    isActive()
        .then(() => {
            if (lastSite !== window.location.href) {
                l = 0;
            }
            lastSite = window.location.href;
            let allTitles = getTitles();
            let liveVideos = getVideos();
            if (request.isFromBackground) {
                if (liveVideos.length > l) {
                    let newStaticVideos = getStaticVideos().slice(
                        l + filteredNumber
                    );
                    unfilteredVideos.push(...newStaticVideos);
                    let newVideos = Array.from(liveVideos).slice(l);
                    l = getVideosLength();
                    main(newVideos, allTitles);
                    return Promise.resolve({
                        response: "Message received"
                    });
                }
            } else if (request.isFromPopup) {
                if (!request.isNewItem) {
                    restoreSubs(liveVideos);
                    unfilteredVideos = getStaticVideos();
                    filteredNumber = 0;
                    l = 0;
                }
                main(liveVideos, allTitles);
                return Promise.resolve({
                    response: "Message received"
                });
            }
        })
        .catch(err => console.error(err));
});

// -----------------------------------------------------------------------------
// SITE INTERACTION
// -----------------------------------------------------------------------------

function getStaticVideos() {
    let gridVideos = document.querySelectorAll("ytd-grid-video-renderer");
    let listVideos = document.querySelectorAll("ytd-item-section-renderer");
    return Array.from(
        gridVideos.length > listVideos.length ? gridVideos : listVideos
    );
}

// get the video html elements
function getVideos() {
    let gridVideos = document.getElementsByTagName("ytd-grid-video-renderer");
    let listVideos = document.getElementsByTagName("ytd-item-section-renderer");
    return gridVideos.length > listVideos.length ? gridVideos : listVideos;
}

// get length of video list
function getVideosLength() {
    return document.querySelectorAll("ytd-grid-video-renderer").length;
}

// get channel names
function getChannelNames() {
    return Array.from(
        document.getElementsByClassName(
            "yt-simple-endpoint style-scope yt-formatted-string"
        )
    );
}

// get all the titles as string array
function getTitles() {
    let gridTitles = document.getElementsByClassName(
        "yt-simple-endpoint style-scope ytd-grid-video-renderer"
    );
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
            result.push(
                title
                .toLowerCase()
                .split(/\s|\\n/g)
                .filter(x => x != "")
                .join(" ")
            );
        }
    }
    return result;
}

// -----------------------------------------------------------------------------
// ADDITIONAL
// -----------------------------------------------------------------------------

// returns whether the filter should be active
function isActive() {
    return new Promise((resolve, reject) => {
        get().then(config => {
            if (
                config.active &&
                window.location.pathname.includes("/feed/subscriptions")
            ) {
                resolve("is active");
            } else {
                lastSite = window.location.href;
                reject('is not active');
            }
        });
    });
}

// filter the sub elements for the
function filterSubsByBlacklist(videos, titles, channels, blacklist) {
    filteredVideos = Array.from(videos).filter(video =>
        hasToBeRemoved(
            blacklist,
            video.querySelector("h3").textContent,
            video.querySelector("a.yt-formatted-string").textContent
        )
    );
    l -= filteredVideos.length;
    filteredVideos.map(video => {
        video.parentNode.removeChild(video);
        filteredNumber++;
    });
}

// filters if the series of this channel is in your blacklist or not on your whitelist
function hasToBeRemoved(list, title, channel) {
    return (
        list.value.filter(
            elem =>
            elem.channel == channel.toLowerCase() &&
            elem.words.some(x =>
                title.toLowerCase().includes(x) ?
                !elem.whitelist :
                elem.whitelist
            )
        ).length > 0
    );
}
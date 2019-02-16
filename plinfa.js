
//this doesnt work right now, storage also not implemented yet
browser.pageAction.onClicked.addListener(handleClick);

function handleClick(){
    console.log("test")
}

//this works though
var all_videos = document.getElementsByTagName("ytd-item-section-renderer");
var all_titles = document.getElementsByClassName("title-and-badge");
for (var i = 0; i < all_videos.length; i++){
    video = all_videos.item(i);
    title = all_titles.item(i).children.namedItem("video-title").text;
}

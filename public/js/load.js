"use strict";



// [pure] get the novel work data from the ID
function getWorkData(workID, callback) {
    get(`/raw/works/${workID}`, function(responseText) {
        var doc = (new DOMParser()).parseFromString(responseText, "text/html");
        var dat = {
            site: "kakuyomu",
            id: workID,
            title: doc.querySelector("#workTitle").textContent,
            author: doc.querySelector("#workAuthor-activityName a").textContent,
            genre: doc.querySelector("#workGenre a").textContent,
            color: doc.querySelector("#workColor").style["background-color"],
            catchphrase: doc.querySelector("#catchphrase-body").textContent,
            introduction: doc.querySelector("#introduction").textContent,
            episodes: [{
                id: "index",
                title: "index",
                content: null,
                pages: null,
                source: responseText
            }]
        };
        var episodes = doc.querySelectorAll(".widget-toc-episode");
        for (var i = 0; i < episodes.length; i++) {
            var episode = episodes[i];
            var matches = /\/works\/\d{19}\/episodes\/(\d{19})/.exec(episode.querySelector("a").getAttribute("href"));
            dat.episodes.push({
                id: matches[1],
                title: episode.querySelector(".widget-toc-episode-titleLabel").textContent,
                content: null, // null suggests "unloaded",
                pages: null,
                source: null
            });
        }
        callback(dat);
    });
}

// [impure] get the episode data from the id
function loadEpisodePages(workData, episodeID, onPageLoaded, onFinish) {
    if(episodeID === "index"){

        renderIndexPage(
            workData,
            function(element){
                onPageLoaded(element);
            },
            function(){
                onFinish(workData.episodes[0]);
            }
        );


    }else{
        var episode = workData.episodes.find(function(episode) {
            return episode.id === episodeID;
        });

        if (!episode) {
            throw new Error();
        } else if (episode.pages) {
            // loaded, ignore
            onFinish(episode);
        } else {
            showViewer();
            showLoading();
            get(`/raw/works/${workData.id}/episodes/${episode.id}`, function(responseText) {
                var episodeIndex = workData.episodes.findIndex(function(episode) {
                    return episode.id === episodeID
                });

                var episodeBody = renderEpisodePages(responseText);
                paging(
                    episodeBody,
                    onPageLoaded,
                    function(pages){
                        episode.pages = pages;
                        episode.pages.forEach(function(page, i) {
                            page.setAttribute("data-episode-index", episodeIndex);
                            page.setAttribute("data-episode-page-index", i);
                            page.querySelector(".header").textContent = `${i + 1}　${episode.title}`;
                            page.style["z-index"] = 100000000 - 10000 * (workData.episodes.indexOf(episode) + 1) - i;
                        });
                        onFinish(episode);
                    }
                );
            });
        }
    }
}

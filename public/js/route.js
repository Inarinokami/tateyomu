"use strict";


// dest: "last" or grater than zero
function movePageTo(app, destStr, callback) {

    if (app.workData) {
        var currentEpisode = app.workData.episodes[app.currentEpisodeIndex];
        var dest = destStr === null ? 0 :
            destStr === "last" ? currentEpisode.pages.length - 1 :
            parseInt(destStr) - 1;

        if (app.currentEpisodeIndex === 0 && dest === -1) {
            // begging og the work, ignore
            closeLoading();
        } else if (app.currentEpisodeIndex === app.workData.episodes.length - 1 && dest === currentEpisode.pages.length) {
            // end of the work, ignore
            closeLoading();
        } else if (dest === -1) {
            app.currentEpisodeIndex = app.currentEpisodeIndex - 1;
            var episode = app.workData.episodes[app.currentEpisodeIndex];
            loadEpisodePages(app.workData, episode.id, function() {
                app.currentPage = episode.pages.length - 1;
                history.pushState(null, null, `/works/${app.workData.id}/episodes/${episode.id}/${app.currentPage + 1}`);
                update(app);
                callback();
            });
        } else if (dest === currentEpisode.pages.length) {
            app.currentEpisodeIndex = app.currentEpisodeIndex + 1;
            var episode = app.workData.episodes[app.currentEpisodeIndex];
            loadEpisodePages(app.workData, episode.id, function() {
                app.currentPage = 0;
                history.pushState(null, null, `/works/${app.workData.id}/episodes/${episode.id}/${app.currentPage + 1}`);
                update(app);
                callback();
            });
        } else {
            if (app.preload && dest === currentEpisode.pages.length - 1 && app.currentEpisodeIndex < app.workData.episodes.length - 1) {
                loadEpisodePages(app.workData, app.workData.episodes[app.currentEpisodeIndex + 1].id, function() {});
            }
            //if(app.preload && dest === 0 && 2 < app.currentEpisodeIndex){
            //    loadEpisodePages(app.workData, app.workData.episodes[app.currentEpisodeIndex - 1].id, function(){
            //    });
            //}

            app.currentPage = dest;
            history.pushState(null, null, `/works/${app.workData.id}/episodes/${currentEpisode.id}/${app.currentPage + 1}`);
            update(app);
            callback();
        }
    } else {
        app.currentPage = parseInt(destStr) - 1;
        //history.pushState(null, null, `/works/xxxxxxxx/episodes/xxxxxxxx/${app.currentPage + 1}`);
        update(app);
        callback();
    }


}

function goto(app, dest, callback) {
    if (viewer.style["display"] === "block" && !isLoading()) {
        movePageTo(app, dest, callback);
    } else {
        callback();
    }
}

function route(app, contentPath, callback) {
    var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(contentPath);
    if (matches) {
        // valid valid url //
        var nextEpisodeID = matches[2] ? matches[3] : "index";
        var nextPage = (matches[2] && matches[5]) || "1";
        loadIndexPage(app, matches[1], function() {
            loadEpisodePages(app.workData, nextEpisodeID, function() {
                app.currentEpisodeIndex = app.workData.episodes.findIndex(function(episode){
                    return episode.id === nextEpisodeID;
                });
                movePageTo(app, nextPage, function() {
                    document.querySelector("#viewer").style["display"] = "block";
                    document.querySelector("#top").style["display"] = "none";
                    resize();
                    update(app);
                    closeLoading();
                });
            });
        });

    } else {
        // invalid url //
        showTopPage();
        callback();
    }
}

function routeExternalURL(app, url) {
    var matches = /^https:\/\/kakuyomu\.jp\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(url);
    if (matches) {
        app.site = "kakuyomu";
        route(app, document.querySelector("input#url").value.slice("https://kakuyomu.jp".length));
    } else {
        var matches = /^http\:\/\/www\.aozora\.gr\.jp\/cards\/(\d+)\/files\/(\d+_\d+)\.html$/.exec(url);
        if (matches) {
            // valid aozora url
            app.site = "aozora";
            container.innerHTML = "";
            app.workData = {
                site: "aozora",
                card: matches[1],
                file: matches[2]
            };
            app.currentEpisodeIndex = null;
            app.currentPage = 0;
            showViewer();
            getAsArrayBuffer(`/raw/aozora${url.slice("http://www.aozora.gr.jp".length)}`, function(arrayBuffer) {
                var decoder = new TextDecoder("shift-jis");
                var sourceXHTML = decoder.decode(arrayBuffer);
                var doc = (new DOMParser()).parseFromString(sourceXHTML, "text/html");
                var mainText = doc.querySelector(".main_text");
                //console.log(mainText.textContent);


                // midashi
                var anchors = mainText.querySelectorAll("a.midashi_anchor")
                for(var i = 0; i < anchors.length; i++){
                    var anchor = anchors[i];
                    anchor.parentNode.textContent = anchor.textContent;
                }

                // jisage
                var jisageList = mainText.querySelectorAll("div.jisage_7")
                for(var i = 0; i < jisageList.length; i++){
                    var jisage = jisageList[i];
                    jisage.parentNode.insertBefore(jisage.firstChild, jisage);
                    jisage.parentNode.removeChild(jisage);
                }

                // remove useless br
                var brList = mainText.querySelectorAll("h4.naka-midashi + br");
                for(var i = 0; i < brList.length; i++){
                    var br = brList[i];
                    br.parentNode.removeChild(br);
                }
                var midashiList = mainText.querySelectorAll("br + h4.naka-midashi");
                for(var i = 0; i < midashiList.length; i++){
                    var midashi = midashiList[i];
                    midashi.parentNode.removeChild(midashi.previousElementSibling);
                }

                // remove gaiji
                var gaijis = mainText.querySelectorAll("img.gaiji")
                for(var i = 0; i < gaijis.length; i++){
                    var gaiji = gaijis[i];
                    var text = document.createTextNode("■");
                    gaiji.parentNode.insertBefore(text, gaiji);
                    gaiji.parentNode.removeChild(gaiji);
                }

                var pages = paging(mainText);
                pages.forEach(function(page, i) {
                    page.setAttribute("data-episode-index", "0");
                    page.setAttribute("data-episode-page-index", i);
                    page.style["z-index"] = "-0000" + pad4(i);
                    page.querySelector(".header").textContent = (i + 1) + "　目次";
                });
                app.workData = null;
                app.currentEpisodeIndex = 0;
                app.currentPage = 0;
                resize();
                update(app);
                closeLoading();
            });
        } else {
            // invalid url
            app.site = null;
            callback();
        }
    }
}

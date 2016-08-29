"use strict";



function resize() {
    outer.style["transform"] = `scale(1.0)`;
    var bounds = outer.getBoundingClientRect();
    var scaleY = window.innerHeight / bounds.height;
    var scaleX = window.innerWidth / bounds.width;
    var scale = Math.min(scaleX, scaleY);
    outer.style["transform"] = `scale(${scale})`;
    outer.style["transform-origin"] = scaleX > scaleY ? "50% 0%" : "0% 50%";
}

function update(app) {

    var urlInput = document.querySelector("input#url");

    // top
    if (
        urlInput.value.match(/^https:\/\/kakuyomu\.jp\/works\/\d{19}(\/episodes\/\d{19}(\/\d{1,4})?)?$/) ||
        urlInput.value.match(/^http\:\/\/www\.aozora\.gr\.jp\/cards\/\d+\/files\/\d+_\d+\.html$/)
    ) {
        read.removeAttribute("disabled");
        document.querySelector(".epub").removeAttribute("disabled");
        document.querySelector(".plaintext").removeAttribute("disabled");
    } else {
        read.setAttribute("disabled", "");
        document.querySelector(".epub").setAttribute("disabled", "");
        document.querySelector(".plaintext").setAttribute("disabled", "");
    }

    // viewer
    if (app.workData && app.currentEpisodeIndex !== null) {
        var currentScale = outer.style["transform"];
        outer.style["transform"] = `scale(1.0)`;
        var pageBoudns = outer.getBoundingClientRect();
        outer.style["transform"] = currentScale;

        var inners = outer.querySelectorAll("div#container > div");
        var cp = container.querySelector(`[data-episode-index="${app.currentEpisodeIndex}"][data-episode-page-index="${app.currentPage}"]`);
        if(cp){
            var z = parseInt(cp.style["z-index"]);
            var left = false;
            for (var i = 0; i < inners.length; i++) {
                var inner = inners[i];
                var episodeIndex = parseInt(inner.getAttribute("data-episode-index"));
                var pi = parseInt(inner.getAttribute("data-episode-page-index"));
                //inner.style["display"] = "none";
                inner.style["left"] = parseInt(inner.style["z-index"]) <= z ? "0px" : (pageBoudns.width + 200 + "px");
                if(app.workData.episodes[app.currentEpisodeIndex].pages){
                    inner.style["display"] = "none";
                }else{
                    inner.style["display"] = "";
                }
            }
            var currentEpisode = app.workData.episodes[app.currentEpisodeIndex];
            if(app.workData.episodes[app.currentEpisodeIndex].pages){
                for(var i = -2; i <= 2; i++){
                    var index = app.currentPage + i;
                    if(0 <= index && index < app.workData.episodes[app.currentEpisodeIndex].pages.length){
                        var page = container.querySelector(`[data-episode-index="${app.currentEpisodeIndex}"][data-episode-page-index="${index}"]`);
                        page.style["display"] = "block";
                    }else if(index < 0 && 0 < app.currentEpisodeIndex){
                        var previousEpisode = app.workData.episodes[app.currentEpisodeIndex - 1];
                        if(previousEpisode.pages){
                            var page = container.querySelector(`[data-episode-index="${app.currentEpisodeIndex - 1}"][data-episode-page-index="${previousEpisode.pages.length + index}"]`);
                            if(page){
                                page.style["display"] = "block";
                            }
                        }
                    }else if(currentEpisode.pages.length <= index && app.currentEpisodeIndex < app.workData.episodes.length - 1){
                        var nextEpisode = app.workData.episodes[app.currentEpisodeIndex + 1];
                        if(nextEpisode.pages){
                            var page = container.querySelector(`[data-episode-index="${app.currentEpisodeIndex + 1}"][data-episode-page-index="${index - currentEpisode.pages.length}"]`);
                            if(page){
                                page.style["display"] = "block";
                            }
                        }
                    }

                }
            }
        }
    }

}

"use strict";

const columns = 42;
const rows = 18;
const lineHeight = 1.0;

const fontSize = 20; // px
const rubySize = 10; // px

const pageAspectRatio = 1.5;
const timespan = 1.0;

const pathPattern = /^\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/;

function halfToFull(text){
    return text.replace(/([^!?！？])([!?！？]{2})(?![!?！？])/g, function(_, a, b){
        return a + (
            b == "!?" ? "⁉" :
            b == "?!" ? "⁈" :
            b == "!!" ? "‼" :
            b == "！？" ? "⁉" :
            b == "？！" ? "⁈" :
            b == "！！" ? "‼" :
            b)
    }).replace(/[a-zA-Z0-9]/g, function(d){
        return String.fromCharCode(0xFEE0 + d.charCodeAt(0));
    }).replace(/―/g, "—").replace(/\(/g, "（").replace(/\)/g, "）")
}

function pad4(value){
    var s = "0000" + value.toFixed(0);
    return s.slice(s.length - 4, s.length);
}

function showLoading(){
    document.querySelector("#top").style["-webkit-filter"] = "blur(5px)";
    document.querySelector("#viewer").style["-webkit-filter"] = "blur(5px)";
    document.querySelector("img.loading").style["display"] = "block";
}

const cacheTable = {};

function get(url, callback){
    if(cacheTable[url]){
        callback(cacheTable[url]);
    }else{
        showLoading();
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) { // DONE
                if (xhr.status == 200 || xhr.status == 304) { // OK
                    cacheTable[url] = xhr.responseText;
                    callback(xhr.responseText);
                }else{
                    console.log("Error: " + xhr.status);
                    closeLoading();
                    document.querySelector(".error").style["visibility"] = "visible";
                }
            }
        };
        xhr.open("GET", url);
        xhr.send();
    }
}

window.addEventListener("load", function() {



    function resize(){
        outer.style["transform"] = `scale(1.0)`;
        var bounds = outer.getBoundingClientRect();
        var scaleY = window.innerHeight / bounds.height;
        var scaleX = window.innerWidth / bounds.width;
        var scale = Math.min(scaleX, scaleY);
        outer.style["transform"] = `scale(${scale})`;
        outer.style["transform-origin"] = scaleX > scaleY ? "50% 0%" : "0% 50%";
    }

    function appendBlankPage(){
        var content = document.createElement("div");
        content.classList.add("content");

        var header = document.createElement("div");
        header.classList.add("header");

        var page = document.createElement("div");
        page.classList.add("page");
        page.appendChild(header);
        page.appendChild(content);

        outer.appendChild(page);

        return page;
    }

    function paging(episodeBody, offset){

        function pushLine(line){
            if(rows <= getLastPage().childNodes.length){
                pageElements.push(appendBlankPage());
            }
            getLastPage().querySelector(".content").appendChild(line);
        }

        function addBlankLine(){
            var rt = document.createElement("rt");
            rt.textContent = "　";
            var ruby = document.createElement("ruby");
            ruby.textContent = "　";
            ruby.appendChild(rt);
            var pe = document.createElement("p");
            pe.appendChild(ruby);
            pushLine(pe);
        }

        function getLastPage(){
            return pageElements[pageElements.length - 1];
        }

        for(var i = 0; i < episodeBody.childNodes.length; i++){
            var paragraph = episodeBody.childNodes[i];
            for(var k = 0; k < paragraph.childNodes.length; k++){
                var e = paragraph.childNodes[k];
                if(e.nodeType === Node.TEXT_NODE){
                    e.textContent = halfToFull(e.textContent);
                }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "RUBY"){
                    var rb = e.querySelector("rb");
                    rb.textContent = halfToFull(rb.textContent);
                    var rt = e.querySelector("rt");
                    rt.textContent = halfToFull(rt.textContent);
                }
            }
        }

        var pageElements = [appendBlankPage()];

        var contentBounds = getLastPage().querySelector(".content").getBoundingClientRect();
        getLastPage().querySelector(".content").style["width"] = "auto";

        while(episodeBody.childNodes.length > 0){
            var lastPage = getLastPage();
            var content = lastPage.querySelector(".content");
            content.appendChild(episodeBody.childNodes[0]);
            var bounds = content.getBoundingClientRect();
            if(contentBounds.width < bounds.width){

                var paragraph = content.childNodes[content.childNodes.length - 1];
                content.removeChild(paragraph);
                episodeBody.insertBefore(paragraph, episodeBody.firstChild);

                var p = document.createElement("p");
                content.appendChild(p);

                while(paragraph.childNodes.length > 0){
                    var e = paragraph.childNodes[0];
                    p.appendChild(e);
                    var bounds = content.getBoundingClientRect();
                    if(contentBounds.width < bounds.width){
                        if(e.nodeType === Node.TEXT_NODE){
                            var remainText = "";
                            while(e.textContent.length > 0){
                                var bounds = content.getBoundingClientRect();
                                if(bounds.width < contentBounds.width){
                                    break;
                                }else{
                                    var lastChar = e.textContent[e.textContent.length - 1];
                                    var w = lastChar === "。" || lastChar === "、" || lastChar === "」" || lastChar === "）" ? 2 : 1;
                                    remainText = e.textContent.slice(e.textContent.length - w) + remainText;
                                    e.textContent = e.textContent.slice(0, e.textContent.length - w);
                                }
                            }

                            if(remainText.length > 0){
                                paragraph.insertBefore(document.createTextNode(remainText), paragraph.firstChild);
                            }

                        }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "RUBY"){
                            p.removeChild(e);
                            paragraph.insertBefore(e, paragraph.firstChild);
                        }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "BR"){
                            p.removeChild(e);
                            paragraph.insertBefore(e, paragraph.firstChild);
                        }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "A"){
                            p.removeChild(e);
                            paragraph.insertBefore(e, paragraph.firstChild);
                        }else{
                            throw new Error();
                        }
                        break;
                    }
                }

                if(episodeBody.childNodes.length > 0){
                    pageElements.push(appendBlankPage());
                    getLastPage().querySelector(".content").style["width"] = "auto";
                }
            }
        }

        var contents = outer.querySelectorAll(".content");
        for(var i = 0; i < contents.length; i++){
            contents[i].style["width"] = "";
        }

        resize();

        return pageElements;
    }

    function route(contentPath, callback) {
        var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(contentPath);
        if(matches){
            var nextWorkID = matches[1];
            var nextEpisodeID = matches[2] ? matches[3] : "index";
            var nextPage = (matches[2] && matches[5]) || "1";
            loadIndexPage(nextWorkID, function(){
                loadEpisodePages(nextEpisodeID, function(){
                    workID = nextWorkID;
                    episodeID = nextEpisodeID;
                    moveTo(nextPage, function(){
                        resize();
                        viewer.style["display"] = "block";
                        top.style["display"] = "none";
                        update();
                        closeLoading();
                    });
                });
            });
        }else{
            // invalid url
            showTopPage();
            callback();
        }
    }

    function loadWorkData(workID, callback){
        if(workData === null || workData.id !== workID){
            get(`/raw/works/${workID}`, function(responseText){
                var doc = (new DOMParser()).parseFromString(responseText, "text/html");
                workData = {
                    id: workID,
                    title: doc.querySelector("#workTitle").textContent,
                    author: doc.querySelector("#workAuthor-activityName a").textContent,
                    genre: doc.querySelector("#workGenre a").textContent,
                    color: doc.querySelector("#workColor").style["background-color"],
                    episodes: [{
                        id: "index",
                        title: "index",
                        content: null,
                        pages: null
                    }]
                };
                var episodes = doc.querySelectorAll(".widget-toc-episode");
                for(var i = 0; i < episodes.length; i++){
                    var episode = episodes[i];
                    var matches = /\/works\/\d{19}\/episodes\/(\d{19})/.exec(episode.querySelector("a").getAttribute("href"));
                    workData.episodes.push({
                        id: matches[1],
                        title: episode.querySelector(".widget-toc-episode-titleLabel").textContent,
                        content: null,   // null suggests "unloaded",
                        pages: null
                    });
                }
                callback(workData);
            });
        }else{
            callback(workData);
        }
    }

    function loadEpisodePages(episodeID, callback){
        var episode = workData.episodes.find(function(episode){
            return episode.id === episodeID;
        });
        if( ! episode){
            throw new Error();
        }else if(episode.pages){
            // loaded, ignore
            callback(episode);
        }else{
            get(`/raw/works/${workData.id}/episodes/${episodeID}`, function(responseText){
                var episodeIndex = workData.episodes.findIndex(function(episode){
                    return episode.id === episodeID
                });
                episode.pages = renderEpisodePages(responseText);
                episode.pages.forEach(function(page, i){
                    page.setAttribute("data-episode", episode.id);
                    page.setAttribute("data-episode-index", episodeIndex);
                    page.setAttribute("data-episode-page-index", i);
                    page.querySelector(".header").textContent = `${i + 1}　${episode.title}` ;
                    page.style["z-index"] = "-" + pad4(workData.episodes.indexOf(episode) + 1) + pad4(i);
                });
                callback(episode);
            });
        }
    }

    function renderEpisodePages(responseText){
        showViewer();



        var parser = new DOMParser();
        var doc = parser.parseFromString(responseText, "text/html");
        var episodeBody = doc.querySelector(".widget-episodeBody");

        var ems = episodeBody.querySelectorAll("em");
        for(var i = 0; i < ems.length; i++){
            var em = ems[i];
            for(var k = 0; k < em.textContent.length; k++){
                var ruby = document.createElement("ruby");
                var rb = document.createElement("rb");
                rb.textContent = em.textContent[k];
                var rt = document.createElement("rt");
                rt.textContent = "丶";
                ruby.appendChild(rb);
                ruby.appendChild(rt);
                em.parentNode.insertBefore(ruby, em);
            }
            em.parentNode.removeChild(em);
        }

        var episodeTitleElement = document.createElement("h2");
        episodeTitleElement.classList.add("episode-title");
        episodeTitleElement.textContent = doc.querySelector(".widget-episodeTitle").textContent;
        episodeBody.insertBefore(episodeTitleElement, episodeBody.firstChild);

        var pages = paging(episodeBody, 1);

        return pages;
    }

    function loadIndexPage(nextWorkID, callback){
        if(workData === null || workData.id !== nextWorkID){
            loadWorkData(nextWorkID, function(dat){
                renderIndexPage(dat);
                callback();
            });
        }else{
            callback();
        }
    }

    function renderIndexPage(workData){

        showViewer();

        outer.innerHTML = "";
        episodeID = null;

        var h1 = document.createElement("h1");
        h1.textContent = workData.title;

        var author = document.createElement("p");
        author.classList.add("author");
        author.textContent = workData.author;

        var h2 = document.createElement("h2");
        h2.textContent = "目次";

        var contents = document.createElement("div");
        contents.appendChild(h1);
        contents.appendChild(author);
        contents.appendChild(h2);


        for(var i = 1; i < workData.episodes.length; i++){
            (function(){
                var episode = workData.episodes[i];
                var url = `/works/${workData.id}/episodes/${episode.id}`;

                var a = document.createElement("a");
                a.setAttribute("href", url);
                a.textContent = halfToFull(episode.title);
                a.addEventListener("click", function(e){
                    route(url);
                    e.preventDefault();
                    e.stopPropagation();
                });

                var p = document.createElement("p");
                p.classList.add("indexitem");
                p.appendChild(a);

                contents.appendChild(p);
            })();
        }

        workData.episodes[0].pages = paging(contents, 0);
        workData.episodes[0].pages.forEach(function(page, i){
            page.setAttribute("data-episode", "index");
            page.setAttribute("data-episode-index", "0");
            page.setAttribute("data-episode-page-index", i);
            page.style["z-index"] = "-0000" + pad4(i);
            page.querySelector(".header").textContent = (i + 1) + "　目次";
        });


    }

    function home(){
        document.querySelector("#url").value = "https://kakuyomu.jp" + window.location.pathname;
        showTopPage();
        history.pushState(null, null, "/");
        update();
    }

    function update() {

        // top
        if (urlInput.value.match(/^https:\/\/kakuyomu\.jp\/works\/\d{19}(\/episodes\/\d{19}(\/\d{1,4})?)?$/)) {
            read.removeAttribute("disabled");
            document.querySelector(".epub").removeAttribute("disabled");
            document.querySelector(".plaintext").removeAttribute("disabled");
        } else {
            read.setAttribute("disabled", "");
            document.querySelector(".epub").setAttribute("disabled", "");
            document.querySelector(".plaintext").setAttribute("disabled", "");
        }

        // viewer
        if(workData && episodeID){
            var pageBoudns = outer.getBoundingClientRect();
            var currentEpisodeIndex = workData.episodes.findIndex(function(episode){
                return episode.id === episodeID;
            });
            var currentEpisode = workData.episodes[currentEpisodeIndex];
            var inners = outer.querySelectorAll("div#outer > div");
            var cp = outer.querySelector(`[data-episode-index="${currentEpisodeIndex}"][data-episode-page-index="${page}"]`);
            var z = parseInt(cp.style["z-index"]);
            var left = false;
            for(var i = 0; i < inners.length; i++){
                var inner = inners[i];
                var pageEpisode = inner.getAttribute("data-episode");
                var episodeIndex = inner.getAttribute("data-episode-index");
                var pi = parseInt(inner.getAttribute("data-episode-page-index"));
                //inner.style["display"] = "none";
                inner.style["left"] = parseInt(inner.style["z-index"]) <= z ? "0px" : (pageBoudns.right + 200 + "px");
            }
    /*
            for(var i = -1; i <= 1; i++){
                var p = outer.querySelector(`[data-episode-index="${currentEpisodeIndex}"][data-episode-page-index="${page + i}"]`);
                if(p){
                    p.style["display"] = "";
                }
            }



            if(page === 0 && 0 < currentEpisodeIndex){
                var previous = workData.episodes[currentEpisodeIndex - 1];
                if(previous.pages){
                    previous.pages[previous.pages.length - 1].style.display = "";
                }
            }
            if(page === currentEpisode.pages.length - 1 && currentEpisodeIndex < workData.episodes.length - 1){
                var next = workData.episodes[currentEpisodeIndex + 1];
                if(next.pages){
                    next.pages[0].style.display = "";
                }
            }
    */
        }

    }





    var page = 0;
    var path = "";
    var workID = "";
    var episodeID = "";

    var workData = null;
    var episodeDataTable = {};
    var preload = true;

    var outer = document.querySelector("div#outer");
    var next = document.querySelector("div#next");
    var prev = document.querySelector("div#prev");
    var urlInput = document.querySelector("input#url");
    var close = document.querySelector("#close");
    var index = document.querySelector("#index");
    var viewer = document.querySelector("#viewer");
    var top = document.querySelector("#top");
    var read = document.querySelector("#read");

    // top menu buttons ///////////////

    read.addEventListener("click", function() {
        route(urlInput.value.slice("https://kakuyomu.jp".length));
    });

    function parseKakuyomuURL(url){
        var matches = /^https:\/\/kakuyomu\.jp\/works\/(\d{19})(\/episodes\/(\d{19}|index))?$/.exec(url);
        if(matches){
            return {
                workID: matches[1],
                episodeID: matches[3]
            }
        }else{
            return null;
        }
    }

    document.querySelector("button.epub").addEventListener("click", function() {
        var path = parseKakuyomuURL(urlInput.value);
        if(path){
            loadWorkData(path.workID, function(workData){
                createEpub(workData, function(epubBlob){
                    download(`${workData.author}『${workData.title}』.epub`, epubBlob);
                    closeLoading();
                });
            });
        }
    });


    document.querySelector("button.plaintext").addEventListener("click", function() {
        var path = parseKakuyomuURL(urlInput.value);
        if(path){
            loadWorkData(path.workID, function(work){
                var i = 0;
                var episodes = work.episodes.slice(1);
                var title = work.title;
                var author = work.author;
                var zip = new JSZip();
                var uuid = generateUUID();

                zip.file("description.txt",
        `【作品名】${work.title}
        【作者】${work.author}
        【イメージカラー】${work.color}
        【ジャンル】${work.genre}
        【キャッチフレーズ】${work.catchphrase}
        【あらすじ】
        ${work.introduction}`);

                function next() {
                    if (i < episodes.length) {
                        var episode = episodes[i];
                        var episodeName = escapeTagChars(episode.title);
                        get(`/raw/works/${work.id}/episodes/${episode.id}`, function(source) {
                            console.log("Downloading \"" + episodeName + "\"...");
                            zip.file("episode_" + padzero(i) + ".txt", "# " + episodeName + "\n\n" + htmlToSource(source));
                            i += 1;
                            setTimeout(next, timespan * 1000);
                        });
                    } else {
                        zip.generateAsync({
                            type: "blob"
                        }).then(function(content) {
                            download(`${work.author}『${work.title}』.zip`, content);
                            closeLoading();
                        });
                    }
                }

                next();
            });
        }
    });


    document.addEventListener("cut",  function(e){
        setTimeout(function(){
            update();
        }, 0);
    });
    document.addEventListener("paste", function(e){
        setTimeout(function(){
            update();
        }, 0);
    });
    urlInput.addEventListener("change", update);

    outer.addEventListener("click", function(e){
        var bounds = outer.getBoundingClientRect();
        if(e.clientY < bounds.height * 0.3){
            document.querySelector(".topmenu").style["left"] = "0px";
        }else if(bounds.width * 0.75 < e.clientX - bounds.left){
            goto(page + 1 - 1, function(){
                closeLoading();
            });
        }else{
            goto(page + 1 + 1, function(){
                closeLoading();
            });
        }
    });

    // dest: "last" or grater than zero
    function moveTo(destStr, callback){
        var currentEpisode = workData.episodes.find(function(episode){
            return episode.id === episodeID;
        });
        var currentEpisodeIndex = workData.episodes.findIndex(function(episode){
            return episode.id === episodeID;
        });
        var dest = destStr === null ? 0 :
                   destStr === "last" ? currentEpisode.pages.length - 1 :
                   parseInt(destStr) - 1;

        if(currentEpisodeIndex === 0 && dest === -1){
            // begging og the work, ignore
            closeLoading();
        }else if(currentEpisodeIndex === workData.episodes.length - 1 && dest === currentEpisode.pages.length){
            // end of the work, ignore
            closeLoading();
        }else if(dest === -1){
            loadEpisodePages(workData.episodes[currentEpisodeIndex - 1].id, function(){
                episodeID = workData.episodes[currentEpisodeIndex - 1].id;
                page = workData.episodes[currentEpisodeIndex - 1].pages.length - 1;
                history.pushState(null, null, `/works/${workData.id}/episodes/${episodeID}/${page + 1}`);
                update();
                callback();
            });
        }else if(dest === currentEpisode.pages.length){
            loadEpisodePages(workData.episodes[currentEpisodeIndex + 1].id, function(){
                episodeID = workData.episodes[currentEpisodeIndex + 1].id;
                page = 0;
                history.pushState(null, null, `/works/${workData.id}/episodes/${episodeID}/${page + 1}`);
                update();
                callback();
            });
        }else{
            if(preload && dest === currentEpisode.pages.length - 1 && currentEpisodeIndex < workData.episodes.length - 1){
                loadEpisodePages(workData.episodes[currentEpisodeIndex + 1].id, function(){
                });
            }
            //if(preload && dest === 0 && 2 < currentEpisodeIndex){
            //    loadEpisodePages(workData.episodes[currentEpisodeIndex - 1].id, function(){
            //    });
            //}

            page = dest;
            history.pushState(null, null, `/works/${workData.id}/episodes/${episodeID}/${page + 1}`);
            update();
            callback();
        }
    }

    function goto(dest, callback) {
        if(viewer.style["display"] === "block" && ! isLoading()){
            moveTo(dest, callback);
        }else{
            callback();
        }
    }


    document.querySelector("#go-home").addEventListener("click", function() {
        home();
    });

    document.querySelector("#go-to-index").addEventListener("click", function() {
        route(`/works/${workID}`);
    });

    document.querySelector("#go-next").addEventListener("click", function() {
        goto(page + 1 + 1, function(){
            closeLoading();
        });
    });

    document.querySelector("#go-back").addEventListener("click", function() {
        goto(page + 1 - 1, function(){
            closeLoading();
        });
    });

    document.querySelector("#fullscreen").addEventListener("click", function() {
        if(document.webkitFullscreenEnabled){
            if(document.webkitFullscreenElement){
                document.webkitExitFullscreen();
            }else{
                document.body.webkitRequestFullscreen();
            }
        }else if(document.mozFullScreenEnabled){
            if(document.mozFullscreenElement){
                document.mozExitFullscreen();
            }else{
                document.body.mozRequestFullscreen();
            }
        }else if(document.fullScreenEnabled){
            if(document.fullscreenElement){
                document.exitFullscreen();
            }else{
                document.body.requestFullscreen();
            }
        }
    });

    document.querySelector("#close-menu").addEventListener("click", function() {
        document.querySelector(".topmenu").style["left"] = "-500px";
    });

    window.addEventListener("popstate", function(e) {
        route(window.location.pathname);
    });

    window.addEventListener("resize", function(e) {
        update();
        resize();
    });

    window.addEventListener("keydown", function(e) {
        if(page !== "last" && document.querySelector("img.loading").style["display"] !== "block"){
            goto(page + 1 + (e.keyCode === 37 ? 1 : 0) - (e.keyCode === 39 ? 1 : 0), function(){
                closeLoading();
            });
        }
    });

    document.querySelector("input#url").addEventListener("keydown", function(e){
        setTimeout(function(){
            update();
            document.querySelector(".error").style["visibility"] = "hidden";
        }, 0)
    });

    function showTopPage(){
        top.style["display"] = "block";
        viewer.style["display"] = "none";
    }

    function showViewer(){
        viewer.style["display"] = "block";
        top.style["display"] = "none";
    }



    function closeLoading(){
        top.style["-webkit-filter"] = "none";
        viewer.style["-webkit-filter"] = "none";
        document.querySelector("img.loading").style["display"] = "none";
    }

    function isLoading(){
        return document.querySelector("img.loading").style["display"] === "block"
    }

    function showError(){
        top.style["-webkit-filter"] = "blur(5px)";
        viewer.style["-webkit-filter"] = "blur(5px)";
        document.querySelector(".error").style["display"] = "block";
    }

    route(window.location.pathname, function(){
        closeLoading();
    });
});

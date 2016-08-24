"use strict";

const timespan = 1.0;

window.addEventListener("load", function() {

    function resize() {
        outer.style["transform"] = `scale(1.0)`;
        var bounds = outer.getBoundingClientRect();
        var scaleY = window.innerHeight / bounds.height;
        var scaleX = window.innerWidth / bounds.width;
        var scale = Math.min(scaleX, scaleY);
        outer.style["transform"] = `scale(${scale})`;
        outer.style["transform-origin"] = scaleX > scaleY ? "50% 0%" : "0% 50%";
    }

    function paging(episodeBody) {

        function appendBlankPage() {
            var content = document.createElement("div");
            content.classList.add("content");

            var header = document.createElement("div");
            header.classList.add("header");

            var page = document.createElement("div");
            page.classList.add("page");
            page.appendChild(header);
            page.appendChild(content);

            container.appendChild(page);

            return page;
        }

        function getLastPage() {
            return pageElements[pageElements.length - 1];
        }


        // convert half-width chars into full-width chars //
        for (var i = 0; i < episodeBody.childNodes.length; i++) {
            var paragraph = episodeBody.childNodes[i];
            for (var k = 0; k < paragraph.childNodes.length; k++) {
                var e = paragraph.childNodes[k];
                if (e.nodeType === Node.TEXT_NODE) {
                    e.textContent = halfToFull(e.textContent);
                } else if (e.nodeType === Node.ELEMENT_NODE && e.nodeName === "RUBY") {
                    var rb = e.querySelector("rb");
                    rb.textContent = halfToFull(rb.textContent);
                    var rt = e.querySelector("rt");
                    rt.textContent = halfToFull(rt.textContent);
                }
            }
        }



        var pageElements = [appendBlankPage()];

        // get the reference bounds of contents in pixels
        var contentBounds = getLastPage().querySelector(".content").getBoundingClientRect();

        // make the page resizable depending on elements
        getLastPage().querySelector(".content").style["width"] = "auto";



        function _paging(parent) {

            // layout elements //
            while (parent.childNodes.length > 0) {
                var lastPage = getLastPage();
                var content = lastPage.querySelector(".content");

                // try to add the element
                content.appendChild(parent.firstChild);

                // check size
                var bounds = content.getBoundingClientRect();
                if (contentBounds.width < bounds.width) {

                    // push it back
                    var stray = content.lastChild;
                    parent.insertBefore(stray, parent.firstChild);

                    // try to split the stray element
                    if (stray.nodeType === Node.TEXT_NODE) {
                        var textNode = document.createTextNode("");
                        content.appendChild(textNode);
                        for (var i = 1; i <= stray.textContent.length; i++) {
                            textNode.textContent = stray.textContent.slice(0, i);
                            var bounds = content.getBoundingClientRect();
                            if (contentBounds.width < bounds.width) {
                                textNode.textContent = stray.textContent.slice(0, i - 1);
                                break;
                            }
                        }
                        if (i === 1) {
                            content.removeChild(textNode);
                        } else if (i < stray.textContent.length) {
                            stray.textContent = stray.textContent.slice(i - 1);
                        } else {
                            parent.removeChild(stray);
                        }
                    } else if (stray.nodeType == Node.ELEMENT_NODE) {

                        if (
                            stray.nodeName === "RUBY" ||
                            stray.nodeName === "IMG" ||
                            stray.nodeName === "BR" ||
                            stray.nodeName === "H1" ||
                            stray.nodeName === "H2" ||
                            stray.nodeName === "H3" ||
                            stray.nodeName === "H4" ||
                            stray.nodeName === "H5" ||
                            stray.nodeName === "H6" ||
                            stray.nodeName === "EM"      // TODO
                        ) {
                            // can't split it, ignore
                        } else if (
                            stray.nodeName === "P" ||
                            stray.nodeName === "DIV" ||
                            stray.nodeName === "SPAN"
                        ) {
                            // split the stray element
                            var padding = document.createElement(stray.nodeName);
                            content.appendChild(padding);

                            while (stray.childNodes.length > 0) {
                                var child = stray.childNodes[0];

                                // try to add the child...
                                padding.appendChild(child);

                                // check the size
                                var bounds = content.getBoundingClientRect();
                                if (contentBounds.width < bounds.width) {

                                    if (child.nodeType === Node.TEXT_NODE) {
                                        var remainText = "";
                                        while (child.textContent.length > 0) {
                                            var bounds = content.getBoundingClientRect();
                                            if (bounds.width < contentBounds.width) {
                                                break;
                                            } else {
                                                var lastChar = child.textContent[child.textContent.length - 1];
                                                var w = lastChar === "。" || lastChar === "、" || lastChar === "」" || lastChar === "）" ? 2 : 1;
                                                remainText = child.textContent.slice(child.textContent.length - w) + remainText;
                                                child.textContent = child.textContent.slice(0, child.textContent.length - w);
                                            }
                                        }

                                        if (remainText.length > 0) {
                                            stray.insertBefore(document.createTextNode(remainText), stray.firstChild);
                                        }

                                    } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === "RUBY") {
                                        padding.removeChild(child);
                                        stray.insertBefore(child, stray.firstChild);
                                    } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === "BR") {
                                        padding.removeChild(child);
                                        stray.insertBefore(child, stray.firstChild);
                                    } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === "A") {
                                        padding.removeChild(child);
                                        stray.insertBefore(child, stray.firstChild);
                                    } else if (child.nodeType === Node.ELEMENT_NODE && child.nodeName === "H4") {
                                        padding.removeChild(child);
                                        stray.insertBefore(child, stray.firstChild);
                                    } else {
                                        throw new Error();
                                    }
                                    break;
                                }
                            }
                        } else {
                            throw new Error();
                        }

                    } else {
                        throw new Error();
                    }

                    if (parent.childNodes.length > 0) {
                        pageElements.push(appendBlankPage());
                        getLastPage().querySelector(".content").style["width"] = "auto";
                    }
                }
            }
        }

        _paging(episodeBody);

        // clear temporary styles
        var contents = container.querySelectorAll(".content");
        for (var i = 0; i < contents.length; i++) {
            contents[i].style["width"] = "";
        }

        return pageElements;
    }

    function route(contentPath, callback) {
        var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(contentPath);
        if (matches) {
            // valid valid url //
            var nextEpisodeID = matches[2] ? matches[3] : "index";
            var nextPage = (matches[2] && matches[5]) || "1";
            loadIndexPage(matches[1], function() {
                loadEpisodePages(workData, nextEpisodeID, function() {
                    currentEpisodeIndex = workData.episodes.findIndex(function(episode){
                        return episode.id === nextEpisodeID;
                    });
                    moveTo(nextPage, function() {
                        viewer.style["display"] = "block";
                        top.style["display"] = "none";
                        resize();
                        update();
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

    function routeExternalURL(url) {
        var matches = /^https:\/\/kakuyomu\.jp\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(url);
        if (matches) {
            site = "kakuyomu";
            route(urlInput.value.slice("https://kakuyomu.jp".length));
        } else {
            var matches = /^http\:\/\/www\.aozora\.gr\.jp\/cards\/(\d+)\/files\/(\d+_\d+)\.html$/.exec(url);
            if (matches) {
                // valid aozora url
                site = "aozora";
                container.innerHTML = "";
                workData = {
                    site: "aozora",
                    card: matches[1],
                    file: matches[2]
                };
                currentEpisodeIndex = null;
                currentPage = 0;
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
                    workData = null;
                    currentEpisodeIndex = 0;
                    currentPage = 0;
                    resize();
                    update();
                    closeLoading();
                });
            } else {
                // invalid url
                site = null;
                callback();
            }
        }
    }

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
                episodes: [{
                    id: "index",
                    title: "index",
                    content: null,
                    pages: null
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
                    pages: null
                });
            }
            callback(dat);
        });
    }

    // [impure] get the episode data from the id
    function loadEpisodePages(workData, episodeID, callback) {
        var episode = workData.episodes.find(function(episode) {
            return episode.id === episodeID;
        });
        if (!episode) {
            throw new Error();
        } else if (episode.pages) {
            // loaded, ignore
            callback(episode);
        } else {
            get(`/raw/works/${workData.id}/episodes/${episode.id}`, function(responseText) {
                var episodeIndex = workData.episodes.findIndex(function(episode) {
                    return episode.id === episodeID
                });
                episode.pages = renderEpisodePages(responseText);
                episode.pages.forEach(function(page, i) {
                    page.setAttribute("data-episode-index", episodeIndex);
                    page.setAttribute("data-episode-page-index", i);
                    page.querySelector(".header").textContent = `${i + 1}　${episode.title}`;
                    page.style["z-index"] = "-" + pad4(workData.episodes.indexOf(episode) + 1) + pad4(i);
                });
                callback(episode);
            });
        }
    }



    function renderEpisodePages(responseText) {
        showViewer();



        var parser = new DOMParser();
        var doc = parser.parseFromString(responseText, "text/html");
        var episodeBody = doc.querySelector(".widget-episodeBody");

        var ems = episodeBody.querySelectorAll("em");
        for (var i = 0; i < ems.length; i++) {
            var em = ems[i];
            for (var k = 0; k < em.textContent.length; k++) {
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

        var pages = paging(episodeBody);

        return pages;
    }

    function loadIndexPage(nextWorkID, callback) {
        if (workData === null || workData.id !== nextWorkID) {
            getWorkData(nextWorkID, function(dat) {
                workData = dat;
                renderIndexPage(dat);
                callback();
            });
        } else {
            callback();
        }
    }

    function renderIndexPage(workData) {

        showViewer();

        container.innerHTML = "";
        currentEpisodeIndex = null;

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


        for (var i = 1; i < workData.episodes.length; i++) {
            (function() {
                var episode = workData.episodes[i];
                var url = `/works/${workData.id}/episodes/${episode.id}`;

                var a = document.createElement("a");
                a.setAttribute("href", url);
                a.textContent = halfToFull(episode.title);
                a.addEventListener("click", function(e) {
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

        workData.episodes[0].pages = paging(contents);
        workData.episodes[0].pages.forEach(function(page, i) {
            page.setAttribute("data-episode-index", "0");
            page.setAttribute("data-episode-page-index", i);
            page.style["z-index"] = "-0000" + pad4(i);
            page.querySelector(".header").textContent = (i + 1) + "　目次";
        });


    }

    function pushURL(){
        if(site === "kakuyomu"){
            history.pushState(null, null, `/works/${workData.id}/episodes/${episode.id}/${currentPage + 1}`);
        }else if(site === "aozora"){

        }else{
            throw new Error();
        }
    }

    function update() {

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
        if (workData && currentEpisodeIndex !== null) {
            var currentScale = outer.style["transform"];
            outer.style["transform"] = `scale(1.0)`;
            var pageBoudns = outer.getBoundingClientRect();
            outer.style["transform"] = currentScale;

            var inners = outer.querySelectorAll("div#container > div");
            var cp = container.querySelector(`[data-episode-index="${currentEpisodeIndex}"][data-episode-page-index="${currentPage}"]`);
            var z = parseInt(cp.style["z-index"]);
            var left = false;
            for (var i = 0; i < inners.length; i++) {
                var inner = inners[i];
                var episodeIndex = parseInt(inner.getAttribute("data-episode-index"));
                var pi = parseInt(inner.getAttribute("data-episode-page-index"));
                //inner.style["display"] = "none";
                inner.style["left"] = parseInt(inner.style["z-index"]) <= z ? "0px" : (pageBoudns.width + 200 + "px");
                inner.style["display"] = "none";
            }
            var currentEpisode = workData.episodes[currentEpisodeIndex];
            for(var i = -2; i <= 2; i++){
                var index = currentPage + i;
                if(0 <= index && index < workData.episodes[currentEpisodeIndex].pages.length){
                    var page = container.querySelector(`[data-episode-index="${currentEpisodeIndex}"][data-episode-page-index="${index}"]`);
                    page.style["display"] = "block";
                }else if(index < 0 && 0 < currentEpisodeIndex){
                    var previousEpisode = workData.episodes[currentEpisodeIndex - 1];
                    if(previousEpisode.pages){
                        var page = container.querySelector(`[data-episode-index="${currentEpisodeIndex - 1}"][data-episode-page-index="${previousEpisode.pages.length + index}"]`);
                        if(page){
                            page.style["display"] = "block";
                        }
                    }
                }else if(currentEpisode.pages.length <= index && currentEpisodeIndex < workData.episodes.length - 1){
                    var nextEpisode = workData.episodes[currentEpisodeIndex + 1];
                    if(nextEpisode.pages){
                        var page = container.querySelector(`[data-episode-index="${currentEpisodeIndex + 1}"][data-episode-page-index="${index - currentEpisode.pages.length}"]`);
                        if(page){
                            page.style["display"] = "block";
                        }
                    }
                }

            }
        }

    }



    var workData = null;
    var currentEpisodeIndex = null;
    var currentPage = 0;
    var preload = true;
    var menuVisible = false;
    var site = null;

    var outer = document.querySelector("div#outer");
    var container = document.querySelector("div#container");
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
        routeExternalURL(urlInput.value);
    });

    function parseKakuyomuURL(url) {
        var matches = /^https:\/\/kakuyomu\.jp\/works\/(\d{19})(\/episodes\/(\d{19}|index))?$/.exec(url);
        if (matches) {
            return {
                workID: matches[1],
                episodeID: matches[3]
            }
        } else {
            return null;
        }
    }

    if( ! localStorage.getItem("guide")){
        document.querySelector(".mapping").style["display"] = "block";
        container.style["-webkit-filter"] = "blur(5px)";
        document.querySelector(".mapping").addEventListener("click", function(e) {
            document.querySelector(".mapping").style["display"] = "none";
            container.style["-webkit-filter"] = "";
            e.stopPropagation();
            e.preventDefault();
            localStorage.setItem("guide", "false");
        });
    }

    document.querySelector("button.epub").addEventListener("click", function() {
        var path = parseKakuyomuURL(urlInput.value);
        if (path) {
            getWorkData(path.workID, function(workData) {
                createEpub(workData, function(epubBlob) {
                    download(`${workData.author}『${workData.title}』.epub`, epubBlob);
                    closeLoading();
                });
            });
        }
    });


    document.querySelector("button.plaintext").addEventListener("click", function() {
        var path = parseKakuyomuURL(urlInput.value);
        if (path) {
            getWorkData(path.workID, function(work) {
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
${work.introduction}`
                );

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


    document.addEventListener("cut", function(e) {
        setTimeout(function() {
            update();
        }, 0);
    });
    document.addEventListener("paste", function(e) {
        setTimeout(function() {
            update();
        }, 0);
    });
    urlInput.addEventListener("change", update);

    outer.addEventListener("click", function(e) {
        if(menuVisible){
            document.querySelector(".topmenu").style["left"] = "-500px";
            menuVisible = false;
        }else{
            var bounds = outer.getBoundingClientRect();
            if (e.clientY < bounds.height * 0.3) {
                document.querySelector(".topmenu").style["left"] = "0px";
                menuVisible = true;
            } else if (bounds.width * 0.75 < e.clientX - bounds.left) {
                goto(currentPage + 1 - 1, function() {
                    closeLoading();
                });
            } else {
                goto(currentPage + 1 + 1, function() {
                    closeLoading();
                });
            }
        }
    });


    // dest: "last" or grater than zero
    function moveTo(destStr, callback) {

        if (workData) {
            var currentEpisode = workData.episodes[currentEpisodeIndex];
            var dest = destStr === null ? 0 :
                destStr === "last" ? currentEpisode.pages.length - 1 :
                parseInt(destStr) - 1;

            if (currentEpisodeIndex === 0 && dest === -1) {
                // begging og the work, ignore
                closeLoading();
            } else if (currentEpisodeIndex === workData.episodes.length - 1 && dest === currentEpisode.pages.length) {
                // end of the work, ignore
                closeLoading();
            } else if (dest === -1) {
                currentEpisodeIndex = currentEpisodeIndex - 1;
                var episode = workData.episodes[currentEpisodeIndex];
                loadEpisodePages(workData, episode.id, function() {
                    currentPage = episode.pages.length - 1;
                    history.pushState(null, null, `/works/${workData.id}/episodes/${episode.id}/${currentPage + 1}`);
                    update();
                    callback();
                });
            } else if (dest === currentEpisode.pages.length) {
                currentEpisodeIndex = currentEpisodeIndex + 1;
                var episode = workData.episodes[currentEpisodeIndex];
                loadEpisodePages(workData, episode.id, function() {
                    currentPage = 0;
                    history.pushState(null, null, `/works/${workData.id}/episodes/${episode.id}/${currentPage + 1}`);
                    update();
                    callback();
                });
            } else {
                if (preload && dest === currentEpisode.pages.length - 1 && currentEpisodeIndex < workData.episodes.length - 1) {
                    loadEpisodePages(workData, workData.episodes[currentEpisodeIndex + 1].id, function() {});
                }
                //if(preload && dest === 0 && 2 < currentEpisodeIndex){
                //    loadEpisodePages(workData, workData.episodes[currentEpisodeIndex - 1].id, function(){
                //    });
                //}

                currentPage = dest;
                history.pushState(null, null, `/works/${workData.id}/episodes/${currentEpisode.id}/${currentPage + 1}`);
                update();
                callback();
            }
        } else {
            currentPage = parseInt(destStr) - 1;
            //history.pushState(null, null, `/works/xxxxxxxx/episodes/xxxxxxxx/${currentPage + 1}`);
            update();
            callback();
        }


    }

    function goto(dest, callback) {
        if (viewer.style["display"] === "block" && !isLoading()) {
            moveTo(dest, callback);
        } else {
            callback();
        }
    }


    document.querySelector("#go-home").addEventListener("click", function() {
        document.querySelector("#url").value = "https://kakuyomu.jp" + window.location.pathname;
        showTopPage();
        history.pushState(null, null, "/");
        update();

        if (document.webkitFullscreenEnabled) {
            document.webkitExitFullscreen();
        } else if (document.mozFullScreenEnabled) {
            document.mozExitFullscreen();
        } else if (document.fullScreenEnabled) {
            document.exitFullscreen();
        }
    });

    document.querySelector("#go-to-index").addEventListener("click", function() {
        route(`/works/${workData.id}`);
    });

    document.querySelector("#fullscreen").addEventListener("click", function() {
        if (document.webkitFullscreenEnabled) {
            if (document.webkitFullscreenElement) {
                document.webkitExitFullscreen();
            } else {
                document.body.webkitRequestFullscreen();
            }
        } else if (document.mozFullScreenEnabled) {
            if (document.mozFullscreenElement) {
                document.mozExitFullscreen();
            } else {
                document.body.mozRequestFullscreen();
            }
        } else if (document.fullScreenEnabled) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.body.requestFullscreen();
            }
        }
    });

    document.querySelector("#close-menu").addEventListener("click", function() {
        document.querySelector(".topmenu").style["left"] = "-500px";
        menuVisible = false;
    });

    window.addEventListener("popstate", function(e) {
        route(window.location.pathname);
    });

    window.addEventListener("resize", function(e) {
        update();
        resize();
    });

    window.addEventListener("keydown", function(e) {
        if (currentPage !== "last" && document.querySelector("img.loading").style["display"] !== "block") {
            goto(currentPage + 1 + (e.keyCode === 37 ? 1 : 0) - (e.keyCode === 39 ? 1 : 0), function() {
                closeLoading();
            });
        }
    });

    document.querySelector("input#url").addEventListener("keydown", function(e) {
        setTimeout(function() {
            update();
            document.querySelector(".error").style["visibility"] = "hidden";
        }, 0)
    });


    document.querySelector("#theme-siro").addEventListener("click", function(e) {
        document.querySelector("#theme").setAttribute("href", "");
        localStorage.removeItem('theme');
    });

    document.querySelector("#theme-kinari").addEventListener("click", function(e) {
        document.querySelector("#theme").setAttribute("href", "/theme/kinari.css");
        localStorage.setItem('theme', 'kinari');
    });
    document.querySelector("#theme-yoru").addEventListener("click", function(e) {
        document.querySelector("#theme").setAttribute("href", "/theme/yoru.css");
        localStorage.setItem('theme', 'yoru');
    });

    function loadFontSizeCSS(css) {
        document.querySelector("#font-size").textContent = css;
        outer.innerHTML = "";
        workData.episodes.forEach(function(episode) {
            episode.pages = null;
        });
        outer.style["transform"] = `scale(1.0)`;
        renderIndexPage(workData);
        loadEpisodePages(workData, workData.episodes[currentEpisodeIndex], function() {
            resize();
            update();
            closeLoading();
        });
    }

    document.querySelector("#font-size-huge").addEventListener("click", function(e) {
        get("/theme/huge.css", function(css) {
            loadFontSizeCSS(css);
        });
    });
    document.querySelector("#font-size-large").addEventListener("click", function(e) {
        get("/theme/large.css", function(css) {
            loadFontSizeCSS(css);
        });
    });
    document.querySelector("#font-size-normal").addEventListener("click", function(e) {
        loadFontSizeCSS("");
    });


    function showTopPage() {
        top.style["display"] = "block";
        viewer.style["display"] = "none";
    }

    function showViewer() {
        viewer.style["display"] = "block";
        top.style["display"] = "none";
    }







    function showError() {
        top.style["-webkit-filter"] = "blur(5px)";
        viewer.style["-webkit-filter"] = "blur(5px)";
        document.querySelector(".error").style["display"] = "block";
    }

    var theme = localStorage.getItem("theme");
    if (theme) {
        document.querySelector("#theme").setAttribute("href", `/theme/${theme}.css`);
    }

    route(window.location.pathname, function() {
        closeLoading();
    });
});

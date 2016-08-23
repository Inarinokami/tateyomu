"use strict";

const timespan = 1.0;

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

    function paging(episodeBody){

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

        function getLastPage(){
            return pageElements[pageElements.length - 1];
        }


        // convert half-width chars into full-width chars //
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

        // get the reference bounds of contents in pixels
        var contentBounds = getLastPage().querySelector(".content").getBoundingClientRect();

        // make the page resizable depending on elements
        getLastPage().querySelector(".content").style["width"] = "auto";

        // layout elements //
        while(episodeBody.childNodes.length > 0){
            var lastPage = getLastPage();
            var content = lastPage.querySelector(".content");
            content.appendChild(episodeBody.childNodes[0]);
            var bounds = content.getBoundingClientRect();
            if(contentBounds.width < bounds.width){

                var stray = content.childNodes[content.childNodes.length - 1];
                content.removeChild(stray);
                episodeBody.insertBefore(stray, episodeBody.firstChild);

                if(stray.nodeType === Node.TEXT_NODE){
                    throw new Error();
                }else if(stray.nodeType == Node.ELEMENT_NODE){

                    if(
                        stray.nodeName === "RUBY" ||
                        stray.nodeName === "IMG"
                    ){
                        content.appendChild(stray);
                    }else if(
                        stray.nodeName === "P" ||
                        stray.nodeName === "DIV" ||
                        stray.nodeName === "SPAN"
                    ){

                        var padding = document.createElement(stray.nodeName);
                        content.appendChild(padding);

                        while(stray.childNodes.length > 0){
                            var e = stray.childNodes[0];
                            padding.appendChild(e);
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
                                        stray.insertBefore(document.createTextNode(remainText), stray.firstChild);
                                    }

                                }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "RUBY"){
                                    padding.removeChild(e);
                                    stray.insertBefore(e, stray.firstChild);
                                }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "BR"){
                                    padding.removeChild(e);
                                    stray.insertBefore(e, stray.firstChild);
                                }else if(e.nodeType === Node.ELEMENT_NODE && e.nodeName === "A"){
                                    padding.removeChild(e);
                                    stray.insertBefore(e, stray.firstChild);
                                }else{
                                    throw new Error();
                                }
                                break;
                            }
                        }
                    }else{
                        throw new Error();
                    }

                }else{
                    throw new Error();
                }

                if(episodeBody.childNodes.length > 0){
                    pageElements.push(appendBlankPage());
                    getLastPage().querySelector(".content").style["width"] = "auto";
                }
            }
        }

        // clear temporary styles
        var contents = outer.querySelectorAll(".content");
        for(var i = 0; i < contents.length; i++){
            contents[i].style["width"] = "";
        }

        return pageElements;
    }

    function route(contentPath, callback) {
        var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(contentPath);
        if(matches){
            // valid valid url //
            var nextEpisodeID = matches[2] ? matches[3] : "index";
            var nextPage = (matches[2] && matches[5]) || "1";
            loadIndexPage(matches[1], function(){
                loadEpisodePages(workData, nextEpisodeID, function(){
                    episodeID = nextEpisodeID;
                    moveTo(nextPage, function(){
                        viewer.style["display"] = "block";
                        top.style["display"] = "none";
                        resize();
                        update();
                        closeLoading();
                    });
                });
            });

        }else{
            // invalid url //
            showTopPage();
            callback();
        }
    }

    function routeExternalURL(url){
        var matches = /^https:\/\/kakuyomu\.jp\/works\/(\d{19})(\/episodes\/(\d{19}|index)(\/(\d{1,4}|last))?)?$/.exec(url);
        if(matches){
            route(urlInput.value.slice("https://kakuyomu.jp".length));
        }else{
            var matches = /^http\:\/\/www\.aozora\.gr\.jp\/cards\/\d+\/files\/\d+_\d+\.html$/.exec(url);
            if(matches){
                // valid aozora url
                outer.innerHTML = "";
                workData = null;
                episodeID = null;
                page = 0;
                showViewer();
                getAsArrayBuffer(`/raw/aozora${url.slice("http://www.aozora.gr.jp".length)}`, function(arrayBuffer){
                    var decoder = new TextDecoder("shift-jis");
                    var sourceXHTML = decoder.decode(arrayBuffer);
                    var doc = (new DOMParser()).parseFromString(sourceXHTML, "text/html");
                    var mainText = doc.querySelector(".main_text");
                    //console.log(mainText.textContent);
                    var pages = paging(mainText);
                    showViewer();
                    closeLoading();
                });
            }else{

                callback();
            }
        }
    }

    // [pure] get the novel work data from the ID
    function getWorkData(workID, callback){
        get(`/raw/works/${workID}`, function(responseText){
            var doc = (new DOMParser()).parseFromString(responseText, "text/html");
            var dat = {
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
                dat.episodes.push({
                    id: matches[1],
                    title: episode.querySelector(".widget-toc-episode-titleLabel").textContent,
                    content: null,   // null suggests "unloaded",
                    pages: null
                });
            }
            callback(dat);
        });
    }

    // [impure] get the episode data from the id
    function loadEpisodePages(workData, episodeID, callback){
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

        var pages = paging(episodeBody);

        return pages;
    }

    function loadIndexPage(nextWorkID, callback){
        if(workData === null || workData.id !== nextWorkID){
            getWorkData(nextWorkID, function(dat){
                workData = dat;
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

        workData.episodes[0].pages = paging(contents);
        workData.episodes[0].pages.forEach(function(page, i){
            page.setAttribute("data-episode", "index");
            page.setAttribute("data-episode-index", "0");
            page.setAttribute("data-episode-page-index", i);
            page.style["z-index"] = "-0000" + pad4(i);
            page.querySelector(".header").textContent = (i + 1) + "　目次";
        });


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
        if(workData && episodeID){
            var currentScale = outer.style["transform"];
            outer.style["transform"] = `scale(1.0)`;
            var pageBoudns = outer.getBoundingClientRect();
            outer.style["transform"] = currentScale;

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
                inner.style["left"] = parseInt(inner.style["z-index"]) <= z ? "0px" : (pageBoudns.width + 200 + "px");
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
        routeExternalURL(urlInput.value);
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
            getWorkData(path.workID, function(workData){
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
            getWorkData(path.workID, function(work){
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
            var episode = workData.episodes[currentEpisodeIndex - 1];
            loadEpisodePages(workData, episode.id, function(){
                episodeID = episode.id;
                page = episode.pages.length - 1;
                history.pushState(null, null, `/works/${workData.id}/episodes/${episodeID}/${page + 1}`);
                update();
                callback();
            });
        }else if(dest === currentEpisode.pages.length){
            var episode = workData.episodes[currentEpisodeIndex + 1];
            loadEpisodePages(workData, episode.id, function(){
                episodeID = episode.id;
                page = 0;
                history.pushState(null, null, `/works/${workData.id}/episodes/${episodeID}/${page + 1}`);
                update();
                callback();
            });
        }else{
            if(preload && dest === currentEpisode.pages.length - 1 && currentEpisodeIndex < workData.episodes.length - 1){
                loadEpisodePages(workData, workData.episodes[currentEpisodeIndex + 1].id, function(){
                });
            }
            //if(preload && dest === 0 && 2 < currentEpisodeIndex){
            //    loadEpisodePages(workData, workData.episodes[currentEpisodeIndex - 1].id, function(){
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
        document.querySelector("#url").value = "https://kakuyomu.jp" + window.location.pathname;
        showTopPage();
        history.pushState(null, null, "/");
        update();

        if(document.webkitFullscreenEnabled){
            document.webkitExitFullscreen();
        }else if(document.mozFullScreenEnabled){
            document.mozExitFullscreen();
        }else if(document.fullScreenEnabled){
            document.exitFullscreen();
        }
    });

    document.querySelector("#go-to-index").addEventListener("click", function() {
        route(`/works/${workData.id}`);
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


    document.querySelector("#theme-siro").addEventListener("click", function(e){
        document.querySelector("#theme").setAttribute("href", "");
        localStorage.removeItem('theme');
    });

    document.querySelector("#theme-kinari").addEventListener("click", function(e){
        document.querySelector("#theme").setAttribute("href", "/theme/kinari.css");
        localStorage.setItem('theme', 'kinari');
    });
    document.querySelector("#theme-yoru").addEventListener("click", function(e){
        document.querySelector("#theme").setAttribute("href", "/theme/yoru.css");
        localStorage.setItem('theme', 'yoru');
    });

    function loadFontSizeCSS(css){
        document.querySelector("#font-size").textContent = css;
        outer.innerHTML = "";
        workData.episodes.forEach(function(episode){
            episode.pages = null;
        });
        outer.style["transform"] = `scale(1.0)`;
        var currentEpisodeID = episodeID;
        renderIndexPage(workData);
        episodeID = currentEpisodeID;
        loadEpisodePages(workData, episodeID, function(){
            resize();
            update();
            closeLoading();
        });
    }

    document.querySelector("#font-size-huge").addEventListener("click", function(e){
        get("/theme/huge.css", function(css){
            loadFontSizeCSS(css);
        });
    });
    document.querySelector("#font-size-large").addEventListener("click", function(e){
        get("/theme/large.css", function(css){
            loadFontSizeCSS(css);
        });
    });
    document.querySelector("#font-size-normal").addEventListener("click", function(e){
        loadFontSizeCSS("");
    });


    function showTopPage(){
        top.style["display"] = "block";
        viewer.style["display"] = "none";
    }

    function showViewer(){
        viewer.style["display"] = "block";
        top.style["display"] = "none";
    }







    function showError(){
        top.style["-webkit-filter"] = "blur(5px)";
        viewer.style["-webkit-filter"] = "blur(5px)";
        document.querySelector(".error").style["display"] = "block";
    }

    var theme = localStorage.getItem("theme");
    if(theme){
        document.querySelector("#theme").setAttribute("href", `/theme/${theme}.css`);
    }

    route(window.location.pathname, function(){
        closeLoading();
    });
});

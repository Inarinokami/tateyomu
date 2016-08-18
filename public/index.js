"use strict";

const columns = 42;
const rows = 18;
const lineHeight = 1.0;

const fontSize = 20; // px
const rubySize = 10; // px

const pageAspectRatio = 1.5;

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
    })
}



window.addEventListener("load", function() {

    var cacheTable = {};

    function get(url, callback){
        if(cacheTable[url]){
            callback(cacheTable[url]);
        }else{
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

    function resize(){
        outer.style["transform"] = `scale(1.0)`;
        var bounds = outer.getBoundingClientRect();
        var scaleY = window.innerHeight / bounds.height;
        var scaleX = window.innerWidth / bounds.width;
        var scale = Math.min(scaleX, scaleY);
        outer.style["transform"] = `scale(${scale})`;
        outer.style["transform-origin"] = scaleX > scaleY ? "50% 0%" : "0% 50%";
    }

    function clearPages(){
        outer.innerHTML = "";
        appendBlankPage();
    }

    function appendBlankPage(){
        var content = document.createElement("div");
        content.classList.add("content");

        var header = document.createElement("div");
        header.classList.add("header");
        header.textContent = outer.childNodes.length + 1;

        var page = document.createElement("div");
        page.classList.add("page");
        page.appendChild(header);
        page.appendChild(content);

        outer.appendChild(page);
    }

    function paging(episodeBody){

        function pushLine(line){
            if(rows <= getLastPage().childNodes.length){
                appendBlankPage();
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
            return outer.childNodes[outer.childNodes.length - 1];
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
                    appendBlankPage();
                    getLastPage().querySelector(".content").style["width"] = "auto";
                }
            }
        }

        var contents = outer.querySelectorAll(".content");
        for(var i = 0; i < contents.length; i++){
            contents[i].style["width"] = "";
        }

        resize();
    }

    function route(contentPath) {

        var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19})(\/(\d{1,4}|last))?)?$/.exec(contentPath);

        if(matches && matches[2]){

            var nextWorkID = matches[1];

            var nextEpisodeID = matches[3];
            var nextPage = matches[5];

            // episode page //

            if(workID !== nextWorkID || episodeID !== nextEpisodeID){
                workID = nextWorkID;
                episodeID = nextEpisodeID;
                path = `/${workID}/episodes/${episodeID}`;

                get(`/raw/works${path}`, function(responseText){

                    showViewer();

                    var parser = new DOMParser();
                    var doc = parser.parseFromString(responseText, "text/html");
                    var episodeBody = doc.querySelector(".widget-episodeBody");

                    var episodeTitleElement = document.createElement("h2");
                    episodeTitleElement.classList.add("episode-title");
                    episodeTitleElement.textContent = doc.querySelector(".widget-episodeTitle").textContent;
                    episodeBody.insertBefore(episodeTitleElement, episodeBody.firstChild);

                    clearPages();
                    paging(episodeBody);

                    page = nextPage === "last" ?  outer.childNodes.length - 1 : (nextPage && Math.max(0, parseInt(nextPage) - 1)) || 0;

                    resize();


                    viewer.style["display"] = "block";
                    top.style["display"] = "none";
                    history.pushState(null, null, "/works" + path + "/" + (page + 1));
                    update();

                    closeLoading();
                });
            }else{
                // just move to the page
                page = nextPage === "last" ?  outer.childNodes.length - 1 : (nextPage && Math.max(0, parseInt(nextPage) - 1)) || 0;
                update();
            }





        }else{
            var matches = /^\/works\/(\d{19})(\/index(\/(\d{1,4}|last))?)?$/.exec(contentPath);

            if(matches){

                workID = matches[1];
                episodeID = null;

                // index
                get(`/raw/works/${workID}`, function(responseText){
                    renderIndexPage(responseText, matches[4]);
                });

            }else{
                showTopPage();
            }
        }
    }

    function renderIndexPage(responseText, indexPage){

        showViewer();

        episodeID = null;

        var parser = new DOMParser();
        var doc = parser.parseFromString(responseText, "text/html");
        var episodes = doc.querySelectorAll(".widget-toc-items .widget-toc-episode");

        var h1 = document.createElement("h1");
        h1.textContent = doc.querySelector("#workTitle a").textContent;

        var author = document.createElement("p");
        author.classList.add("author");
        author.textContent = doc.querySelector("#workAuthor-activityName a").textContent;

        var h2 = document.createElement("h2");
        h2.textContent = "目次";

        var contents = document.createElement("div");
        contents.appendChild(h1);
        contents.appendChild(author);
        contents.appendChild(h2);


        for(var i = 0; i < episodes.length; i++){
            (function(){
                var episode = episodes[i];
                var url = episode.querySelector("a").getAttribute("href");

                var a = document.createElement("a");
                a.setAttribute("href", url);
                a.textContent = halfToFull(episode.querySelector(".widget-toc-episode-titleLabel").textContent);
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

        clearPages();
        paging(contents);

        if(indexPage === "last"){
            page = outer.childNodes.length - 1;
        }else if(indexPage){
            page = Math.max(0, Math.min(outer.childNodes.length - 1, parseInt(indexPage) - 1));
        }else{
            page = 0;
        }


        resize();  // caution: do resize after showing
        update();
        history.pushState(null, null, "/works/" + workID + "/index/" + (page + 1));
        closeLoading();
    }

    function home(){
        document.querySelector("#url").value = "https://kakuyomu.jp" + window.location.pathname;
        showTopPage();
        history.pushState(null, null, "/");
    }

    function update() {
        if (urlInput.value.match(/^https:\/\/kakuyomu\.jp\/works\/\d{19}(\/episodes\/\d{19}(\/\d{1,4})?)?$/)) {
            read.removeAttribute("disabled");
        } else {
            read.setAttribute("disabled", "");
        }

        var pageBoudns = outer.getBoundingClientRect();

        var inners = outer.querySelectorAll("div#outer > div");
        for(var i = 0; i < inners.length; i++){
            var inner = inners[i];
            inner.style["display"] = page - 2 <= i && i <= page + 2 ? "block" : "none";
            inner.style["z-index"] = -i;
            /*inner.style["position"] = page === i ? "relative" : "absolute";*/
            inner.style["left"] = i >= page ? "0px" : (pageBoudns.right + 200 + "px");
            inner.style["top"] = "0px"
        }
    }





    var page = 0;
    var path = "";
    var workID = "";
    var episodeID = "";

    var outer = document.querySelector("div#outer");
    var next = document.querySelector("div#next");
    var prev = document.querySelector("div#prev");
    var urlInput = document.querySelector("input#url");
    var close = document.querySelector("#close");
    var index = document.querySelector("#index");
    var viewer = document.querySelector("#viewer");
    var top = document.querySelector("#top");
    var read = document.querySelector("#read");

    read.addEventListener("click", function() {
        showLoading();
        route(urlInput.value.slice("https://kakuyomu.jp".length));
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
            goto(page - 1);
        }else{
            goto(page + 1);
        }
    });

    function goto(dest) {

        if(viewer.style["display"] === "block" && ! isLoading()){

            if(dest === -1 || dest === outer.childNodes.length){

                if(episodeID === null && dest === -1){
                    // beginning end of the work
                }else{
                    showLoading();
                    get(`/raw/works/${workID}`, function(responseText){
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(responseText, "text/html");
                        var episodes = doc.querySelectorAll(".widget-toc-items .widget-toc-episode a");

                        if(episodeID === null && dest === outer.childNodes.length){
                            // beginning of the main texts
                            route(episodes[0].getAttribute("href"));
                        }else {
                            for(var i = 0; i < episodes.length; i++){
                                var episode = episodes[i];
                                if(episode.getAttribute("href") === `/works/${workID}/episodes/${episodeID}`){
                                    if(i === 0 && dest === -1){

                                        // bug workaround in chrome?
                                        // nested xhr cause 304?
                                        //setTimeout(function(){
                                        //    route(`/works/${workID}/index/last`);
                                        //}, 0);
                                        renderIndexPage(responseText, `last`);

                                    }else if(0 < i && dest === -1){
                                        route(episodes[i - 1].getAttribute("href") + "/last");
                                    }else if(i < episodes.length - 1 && dest === outer.childNodes.length){
                                        route(episodes[i + 1].getAttribute("href"));
                                    }else{
                                        // terminative end of the work
                                        closeLoading();
                                    }
                                    break;
                                }
                            }
                        }
                    });
                }
            }else{
                var nextPage = Math.max(0, Math.min(outer.childNodes.length - 1, dest === "last" ? outer.childNodes.length - 1 : dest));
                if(nextPage != page){
                    page = nextPage;
                    if(episodeID === null){
                        history.pushState(null, null, `/works/${workID}/index/${page + 1}`);
                    }else{
                        history.pushState(null, null, `/works${path}/${page + 1}`);
                    }
                    update();
                }
            }
        }
    }


    document.querySelector("#go-home").addEventListener("click", function() {
        home();
    });

    document.querySelector("#go-to-index").addEventListener("click", function() {
        showLoading();
        route(`/works/${workID}`);
    });

    document.querySelector("#go-next").addEventListener("click", function() {
        goto(page + 1);
    });

    document.querySelector("#go-back").addEventListener("click", function() {
        goto(page - 1);
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
            goto(page + (e.keyCode === 37 ? 1 : 0) - (e.keyCode === 39 ? 1 : 0));
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
        //if(window.location.pathname !== "/"){
        //    history.pushState(null, null, "/");
        //}
        closeLoading();
    }

    function showViewer(){
        viewer.style["display"] = "block";
        top.style["display"] = "none";
    }

    function showLoading(){
        top.style["-webkit-filter"] = "blur(5px)";
        viewer.style["-webkit-filter"] = "blur(5px)";
        document.querySelector("img.loading").style["display"] = "block";
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



    route(window.location.pathname);
});

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

function get(url, callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) { // DONE
            if (xhr.status == 200) { // OK
                callback(xhr.responseText);
            }
        }
    };
    xhr.open("GET", url);
    xhr.send();
}

window.addEventListener("load", function() {

    function resize(){
        outer.style["transform"] = `scale(1.0)`;
        var pageWidth = 0;
        var pageHeight = 0;
        for(var i = 0; i < outer.childNodes.length; i++){
            var rect = outer.childNodes[i].getBoundingClientRect();
            pageWidth = Math.max(pageWidth, rect.width);
            pageHeight = Math.max(pageHeight, rect.height);
        }
        for(var i = 0; i < outer.childNodes.length; i++){
            var page = outer.childNodes[i];
            page.style["width"] = pageWidth + "px";
            page.style["height"] = pageHeight + "px";
        }
        var scaleY = window.innerHeight / pageHeight;
        var scaleX = window.innerWidth / pageWidth;
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

        while(episodeBody.childNodes.length > 0){
            var content = getLastPage().querySelector(".content");
            content.appendChild(episodeBody.childNodes[0]);
            var bounds = getLastPage().getBoundingClientRect();
            if(bounds.height < bounds.width * pageAspectRatio){

                var paragraph = content.childNodes[content.childNodes.length - 1];
                content.removeChild(paragraph);
                episodeBody.insertBefore(paragraph, episodeBody.firstChild);

                var p = document.createElement("p");
                content.appendChild(p);

                while(paragraph.childNodes.length > 0){
                    var e = paragraph.childNodes[0];
                    p.appendChild(e);
                    var bounds = getLastPage().getBoundingClientRect();
                    if(bounds.height < bounds.width * pageAspectRatio){
                        if(e.nodeType === Node.TEXT_NODE){
                            var remainText = "";
                            while(e.textContent.length > 0){
                                var bounds = getLastPage().getBoundingClientRect();
                                if(bounds.width * pageAspectRatio < bounds.height){
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
                }
            }
        }

        resize();
    }

    function load(episodeURL) {

        var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19})(\/(\d{1,4}|last))?)?$/.exec(episodeURL);

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
                    notfound.style["display"] = "none";
                    history.pushState(null, null, "/works" + path + "/" + (page + 1));
                    update();


                    viewer.style["-webkit-filter"] = "none";
                    document.querySelector("img.loading").style["display"] = "none";
                });
            }else{
                // just move to the page
                page = nextPage === "last" ?  outer.childNodes.length - 1 : (nextPage && Math.max(0, parseInt(nextPage) - 1)) || 0;
                update();
            }





        }else{
            var matches = /^\/works\/(\d{19})(\/index(\/(\d{1,4}))?)?$/.exec(episodeURL);
            workID = matches[1];
            episodeID = null;

            // index
            get(`/raw/works/${workID}`, function(responseText){

                var parser = new DOMParser();
                var doc = parser.parseFromString(responseText, "text/html");
                var episodes = doc.querySelectorAll(".widget-toc-items .widget-toc-episode");

                var h1 = document.createElement("h1");
                h1.textContent = "目次";

                var contents = document.createElement("div");
                contents.appendChild(h1);

                for(var i = 0; i < episodes.length; i++){
                    (function(){
                        var episode = episodes[i];
                        var url = episode.querySelector("a").getAttribute("href");

                        var a = document.createElement("a");
                        a.setAttribute("href", url);
                        a.textContent = halfToFull(episode.querySelector(".widget-toc-episode-titleLabel").textContent);
                        a.addEventListener("click", function(e){
                            load(url);
                            e.preventDefault();
                            e.stopPropagation();
                        });

                        var div = document.createElement("div");
                        div.classList.add("indexitem");
                        div.appendChild(a);

                        contents.appendChild(div);
                    })();
                }

                clearPages();
                paging(contents);

                if(matches && matches[4]){
                    page = Math.max(0, Math.min(outer.childNodes.length - 1, parseInt(matches[4]) - 1));
                }else{
                    page = 0;
                }

                resize();
                update();
                history.pushState(null, null, "/works/" + workID + "/index/" + page);

                viewer.style["display"] = "block";
                top.style["display"] = "none";
                notfound.style["display"] = "none";
                document.querySelector("img.loading").style["display"] = "none";
            });
        }
    }

    function home(){
        top.style["display"] = "block";
        viewer.style["display"] = "none";
        notfound.style["display"] = "none";
        history.pushState(null, null, "/");
    }


    function update() {
        if (urlInput.value.match(/^https:\/\/kakuyomu\.jp\/works\/\d{19}(\/episodes\/\d{19}(\/\d{1,4})?)?$/)) {
            read.removeAttribute("disabled");
        } else {
            read.setAttribute("disabled", "");
        }

        var inners = outer.querySelectorAll("div#outer > div");
        for(var i = 0; i < inners.length; i++){
            var inner = inners[i];
            inner.style["display"] = page - 2 <= i && i <= page + 2 ? "flex" : "none";
            inner.style["z-index"] = -i;
            inner.style["position"] = page === i ? "relative" : "absolute";
            inner.style["left"] = i >= page ? "0px" : "1000px";
            inner.style["top"] = "0px"
        }



        //document.querySelector("#caption").textContent = `${page + 1} / ${outer.childNodes.length}`;
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
    var notfound = document.querySelector(".notfound");

    var read = document.querySelector("#read");

    read.addEventListener("click", function() {
        load(urlInput.value.slice("https://kakuyomu.jp".length));
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
        if(e.clientY < window.innerHeight * 0.3){
            document.querySelector(".topmenu").style["left"] = "0px";
        }else{
            goto(page + 1);
        }
    });

    function goto(dest) {

        if(document.querySelector("img.loading").style["display"] !== "block"){

            if(dest === -1 || dest === outer.childNodes.length){
                viewer.style["-webkit-filter"] = "blur(5px)";
                document.querySelector("img.loading").style["display"] = "block";

                get(`/raw/works/${workID}`, function(responseText){
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(responseText, "text/html");
                    var episodes = doc.querySelectorAll(".widget-toc-items .widget-toc-episode a");

                    if(episodeID === null){
                        load(episodes[i].getAttribute("href"));
                    }else{
                        for(var i = 0; i < episodes.length; i++){
                            var episode = episodes[i];
                            if(episode.getAttribute("href") === `/works/${workID}/episodes/${episodeID}`){
                                if(0 < i && dest === -1){
                                    var nextEpisode = episodes[i - 1];
                                    load(nextEpisode.getAttribute("href") + "/last");
                                }else if(i < episodes.length - 1 && dest === outer.childNodes.length){
                                    var nextEpisode = episodes[i + 1];
                                    load(nextEpisode.getAttribute("href"));
                                }else{
                                    // end of work
                                    viewer.style["-webkit-filter"] = "none";
                                    document.querySelector("img.loading").style["display"] = "none";
                                }

                                break;
                            }
                        }
                    }
                });
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
        load(`/works/${workID}`);
    });

    document.querySelector("#fullscreen").addEventListener("click", function() {
        if(document.webkitFullscreenEnabled){
            if(document.webkitFullscreenElement){
                document.webkitExitFullscreen();
                delete document.body.style["width"];
                delete document.body.style["height"];
            }else{
                document.body.style["width"] = "100%";
                document.body.style["height"] = "100%";
                document.body.webkitRequestFullscreen();
            }
        }
    });

    document.querySelector("#close-menu").addEventListener("click", function() {
        document.querySelector(".topmenu").style["left"] = "-500px";
    });

    window.addEventListener("popstate", function(e) {
        route();
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

    function route(){
        if(window.location.pathname === "/"){
            top.style["display"] = "block";
            viewer.style["display"] = "none";
            notfound.style["display"] = "none";
        }else{
            var matches = /^\/works\/(\d{19})((\/episodes\/(\d{19})(\/(\d{1,4}|last))?)|\/index(\/\d{1,4})?)?$/.exec(window.location.pathname);
            if(matches){
                load(window.location.pathname);
            }else{
                //404
            }
        }
    }

    route();
});

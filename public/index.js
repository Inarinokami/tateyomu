"use strict";

const columns = 42;
const rows = 18;
const pageMargin = 20; //px
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

    function clearPages(){
        outer.innerHTML = "";
        appendBlankPage();
    }

    function appendBlankPage(){
        outer.appendChild(document.createElement("div"));
    }

    function getLastPage(){
        return outer.childNodes[outer.childNodes.length - 1];
    }

    function layout(){
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
        var scaleY = (window.innerHeight - close.getBoundingClientRect().height - pageMargin * 2) / pageHeight;
        var scaleX = (window.innerWidth - pageMargin * 2) / pageWidth;
        var scale = Math.min(scaleX, scaleY);
        outer.style["transform"] = `scale(${scale})`;
        outer.style["transform-origin"] = scaleX > scaleY ? "50% 0%" : "0% 50%";
    }

    function load(episodeURL) {
        var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19})(\/(\d{1,4}|last))?)?$/.exec(episodeURL);
        var nextWorkID = matches[1];
        if(matches[2]){

            var nextEpisodeID = matches[3];
            var nextPage = matches[5];

            // episode page //

            if(workID !== nextWorkID || episodeID !== nextEpisodeID){
                workID = nextWorkID;
                episodeID = nextEpisodeID;
                path = `/${workID}/episodes/${episodeID}`;

                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) { // DONE
                        if (xhr.status == 200) { // OK

                            var parser = new DOMParser();
                            var doc = parser.parseFromString(xhr.responseText, "text/html");
                            var episodeBody = doc.querySelector(".widget-episodeBody");

                            clearPages();

                            function pushLine(line){
                                if(rows <= getLastPage().childNodes.length){
                                    appendBlankPage();
                                }
                                getLastPage().appendChild(line);
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
                                getLastPage().appendChild(episodeBody.childNodes[0]);
                                var bounds = getLastPage().getBoundingClientRect();
                                if(bounds.height < bounds.width * pageAspectRatio){

                                    var paragraph = getLastPage().childNodes[getLastPage().childNodes.length - 1];
                                    getLastPage().removeChild(paragraph);
                                    episodeBody.insertBefore(paragraph, episodeBody.firstChild);

                                    var p = document.createElement("p");
                                    getLastPage().appendChild(p);

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
                                            } else{
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

                            page = nextPage === "last" ?  outer.childNodes.length - 1 : (nextPage && Math.max(0, parseInt(nextPage) - 1)) || 0;

                            layout();


                            viewer.style["display"] = "block";
                            top.style["display"] = "none";
                            notfound.style["display"] = "none";
                            history.pushState(null, null, "/works" + path + "/" + (page + 1));
                            update();


                            viewer.style["-webkit-filter"] = "none";
                            document.querySelector("img.loading").style["display"] = "none";

                        } else if(xhr.status === 404){
                            history.pushState(null, null, "/works" + path);
                            top.style["display"] = "none";
                            viewer.style["display"] = "none";
                            notfound.style["display"] = "block";
                        } else {
                            //alert("status = " + xhr.status);
                        }
                    }
                }
                xhr.open("GET", `/raw/works${path}`);
                xhr.send();
            }else{
                // just move to the page
                page = nextPage === "last" ?  outer.childNodes.length - 1 : (nextPage && Math.max(0, parseInt(nextPage) - 1)) || 0;
                update();
            }





        }else{
            workID = nextWorkID;

            // index
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var parser = new DOMParser();
                        var doc = parser.parseFromString(xhr.responseText, "text/html");
                        var episodes = doc.querySelectorAll(".widget-toc-items .widget-toc-episode");

                        clearPages();
                        getLastPage().innerHTML = "<h1>目次</h1>";

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

                                getLastPage().appendChild(div);
                            })();
                        }


                        viewer.style["display"] = "block";
                        top.style["display"] = "none";
                        notfound.style["display"] = "none";
                        document.querySelector("img.loading").style["display"] = "none";
                    }else{
                        // error, but ignore
                    }
                }
            };
            xhr.open("GET", `/raw/works/${workID}`);
            xhr.send();
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

        var inners = outer.querySelectorAll("div");
        for(var i = 0; i < inners.length; i++){
            var inner = inners[i];
            inner.style["display"] = page - 2 <= i && i <= page + 2 ? "block" : "none";
            inner.style["z-index"] = -i;
            inner.style["position"] = page === i ? "relative" : "absolute";
            inner.style["left"] = i >= page ? "0px" : "1000px";
            inner.style["top"] = "0px"
        }



        document.querySelector("#caption").textContent = `${page + 1} / ${outer.childNodes.length}`;
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
        goto(page + 1);
    });

    function goto(dest) {

        if(document.querySelector("img.loading").style["display"] !== "block"){

            if(dest === -1 || dest === outer.childNodes.length){
                viewer.style["-webkit-filter"] = "blur(5px)";
                document.querySelector("img.loading").style["display"] = "block";

                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState == 4) { // DONE
                        if (xhr.status == 200) { // OK
                            var parser = new DOMParser();
                            var doc = parser.parseFromString(xhr.responseText, "text/html");
                            var episodes = doc.querySelectorAll(".widget-toc-items .widget-toc-episode a");
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
                    }
                };
                xhr.open("GET", `/raw/works/${workID}`);
                xhr.send();
            }else{
                var nextPage = Math.max(0, Math.min(outer.childNodes.length - 1, dest === "last" ? outer.childNodes.length - 1 : dest));
                if(nextPage != page){
                    page = nextPage;
                    history.pushState(null, null, "/works" + path + "/" + (page + 1));
                    update();
                }
            }
        }
    }



    close.addEventListener("click", function() {
        home();
    });
    index.addEventListener("click", function() {
        load(`/works/${workID}`);
    });


    window.addEventListener("popstate", function(e) {
        route();
    });

    window.addEventListener("resize", function(e) {
        update();
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
            var matches = /^\/works\/(\d{19})(\/episodes\/(\d{19})(\/(\d{1,4}|last))?)?$/.exec(window.location.pathname);
            if(matches){
                load(window.location.pathname);
            }else{
                //404
            }
        }
    }

    route();
});

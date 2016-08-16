"use strict";

const columns = 42;
const rows = 18;
const pageMargin = 20; //px
const lineHeight = 1.0;

const fontSize = 20; // px
const rubySize = 10; // px



window.addEventListener("load", function() {

    function load(episodeURL) {



        var matches = /^\/works\/(\d{19})\/episodes\/(\d{19})(\/(\d{1,4}|last))?$/.exec(episodeURL);
        workID = matches[1];
        episodeID = matches[2];
        page = matches[4] === "last" ? "last" : (matches[4] && Math.max(0, parseInt(matches[4]) - 1)) || 0;
        path = `/${workID}/episodes/${episodeID}`;


        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) { // DONE
                if (xhr.status == 200) { // OK
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(xhr.responseText, "text/html");
                    var episodeBody = doc.querySelector(".widget-episodeBody");
                    pageNodes = [document.createElement("div")];

                    function pushLine(line){
                        if(rows <= pageNodes[pageNodes.length - 1].childNodes.length){
                            var div = document.createElement("div");
                            pageNodes.push(div);
                        }

                        pageNodes[pageNodes.length - 1].appendChild(line);
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
                        if(paragraph.nodeType === Node.ELEMENT_NODE){
                            if(paragraph.nodeName === "P"){
                                if(paragraph.classList.contains("blank")){
                                    addBlankLine();
                                }else{
                                    var pe = document.createElement("p");
                                    pushLine(pe);
                                    var count = 0;
                                    for(var c = 0; c < paragraph.childNodes.length; c++){
                                        var child = paragraph.childNodes[c];
                                        if(child.nodeType === Node.ELEMENT_NODE && child.nodeName === "RUBY"){
                                            if(columns <= count + child.firstChild.textContent.length){
                                                pushLine(pe);
                                                pe = document.createElement("p");
                                            }
                                            var rt = document.createElement("rt");
                                            rt.textContent = child.querySelector("rt").textContent;
                                            var ruby = document.createElement("ruby");
                                            ruby.textContent = child.firstChild.textContent;
                                            ruby.appendChild(rt);
                                            pe.appendChild(ruby);
                                            count += child.firstChild.textContent.length;
                                        }else if(child.nodeType === Node.TEXT_NODE){

                                            var text = child.textContent.replace(/[a-zA-Z0-9]/g, function(d){
                                                return String.fromCharCode(0xFEE0 + d.charCodeAt(0));
                                            });

                                            for(var s = 0; 0 < text.length && s < 100000; s++){

                                                var len = Math.min(columns - count, text.length);

                                                //if(text[len] === "。"){
                                                //    len = len - 1;
                                                //}

                                                if(len === 0) break;

                                                var rt = document.createElement("rt");
                                                rt.textContent = "　";

                                                var ruby = document.createElement("ruby");
                                                ruby.textContent = text.slice(0, len);
                                                ruby.appendChild(rt);

                                                pe.appendChild(ruby);

                                                text = text.slice(len);

                                                count += len;

                                                if(columns <= count && 0 < text.length){
                                                    pe = document.createElement("p");
                                                    pushLine(pe);
                                                    count = 0;
                                                }


                                            }
                                        }
                                    }

                                }
                            }else{
                                throw new Error();
                            }

                        }else if(paragraph.nodeType === Node.TEXT_NODE){
                            // ignore
                        }else{
                            throw new Error();
                        }
                    }


                    for(var i = pageNodes[pageNodes.length - 1].childNodes.length; i < rows; i++){
                        addBlankLine();
                    }

                    if(page === "last"){
                        page = pageNodes.length - 1;
                    }

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
        xhr.open("GET", `/raw${path}`);
        xhr.send();
    }

    function home(){
        top.style["display"] = "block";
        viewer.style["display"] = "none";
        notfound.style["display"] = "none";
        history.pushState(null, null, "/");
    }


    function update() {
        if (urlInput.value.match(/^https:\/\/kakuyomu\.jp\/works\/\d{19}\/episodes\/\d{19}$/)) {
            read.removeAttribute("disabled");
        } else {
            read.setAttribute("disabled", "");
        }


        inner.innerHTML = "";
        inner.appendChild(pageNodes[Math.max(0, Math.min(pageNodes.length - 1, page))]);

        outer.style["transform"] = `scale(1.0)`;
        var rect = outer.getBoundingClientRect();
        var scaleY = (window.innerHeight - close.getBoundingClientRect().height - pageMargin * 2) / rect.height;
        var scaleX = (window.innerWidth - pageMargin * 2) / rect.width;
        outer.style["transform"] = `scale(${Math.min(scaleX, scaleY)})`;
        outer.style["transform-origin"] = scaleX > scaleY ? "50% 0%" : "0% 50%";

        document.querySelector("#caption").textContent = `${page + 1} / ${pageNodes.length}`;
    }


    var page = 0;
    var path = "";
    var workID = "";
    var episodeID = "";
    var pageNodes = [document.createElement("div")];

    var outer = document.querySelector("div#outer");
    var inner = document.querySelector("div#inner");

    var next = document.querySelector("div#next");
    var prev = document.querySelector("div#prev");
    var urlInput = document.querySelector("input#url");
    var close = document.querySelector("#close");

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

    inner.addEventListener("click", function(e) {
        goto(page + 1);
    });
/*
    prev.addEventListener("click", function(e) {
        goto(page - 1);
    });
*/
    function goto(dest) {

        if(document.querySelector("img.loading").style["display"] !== "block"){

            if(dest === -1 || dest === pageNodes.length){
                viewer.style["-webkit-filter"] = "blur(8px)";
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
                                    }else if(i < episodes.length - 1 && dest === pageNodes.length){
                                        var nextEpisode = episodes[i + 1];
                                        load(nextEpisode.getAttribute("href"));
                                    }

                                    break;
                                }
                            }
                            viewer.style["-webkit-filter"] = "";
                            document.querySelector("img.loading").style["display"] = "";
                        }
                    }
                };
                xhr.open("GET", `/raw/works/${workID}`);
                xhr.send();
            }else{
                var nextPage = Math.max(0, Math.min(pageNodes.length - 1, dest));
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

    window.addEventListener("popstate", function(e) {
        navigate();
    });

    window.addEventListener("resize", function(e) {
        update();
    });

    window.addEventListener("keydown", function(e) {
        goto(page + (e.keyCode === 37 ? 1 : 0) - (e.keyCode === 39 ? 1 : 0));
    });

    function navigate(){
        if(window.location.pathname === "/"){
            home();
        }else{
            var matches = /^\/works\/(\d{19})\/episodes\/(\d{19})(\/(\d{1,4}|last))?$/.exec(window.location.pathname);
            if(matches){
                workID = matches[1];
                episodeID = matches[2];
                page = matches[4] === "last" ? "last" : (matches[4] && Math.max(0, parseInt(matches[4]) - 1)) || 0;
                path = `/${workID}/episodes/${episodeID}`;

                load(window.location.pathname);

                //load(matches[1], matches[2], matches[4] === "last" ? "last" : (matches[4] && Math.max(0, parseInt(matches[4]) - 1)) || 0);
            }else{
                //404
            }
        }
    }

    navigate();
});

"use strict";

const columns = 42;
const rows = 18;
const pageMargin = 20; //px
const lineHeight = 1.0;

const fontSize = 20; // px
const rubySize = 10; // px

window.addEventListener("load", function() {

    function load(episodeURL) {
        var matches = /^https:\/\/kakuyomu\.jp\/works(\/\d{19}\/episodes\/\d{19})(\/(\d{1,4}))?$/.exec(episodeURL);
        path = matches[1];
        page = (matches[3] && Math.max(0, parseInt(matches[3]) - 1)) || 0;

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
                        var p = episodeBody.childNodes[i];
                        if(p.nodeType === Node.ELEMENT_NODE){
                            if(p.nodeName === "P"){

                                if(p.classList.contains("blank")){
                                    addBlankLine();
                                }else{



                                    for(var c = 0; c < p.childNodes.length; c++){
                                        var child = p.childNodes[c];
                                        if(child.nodeType === Node.ELEMENT_NODE && child.nodeName === "RUBY"){

                                        }else if(child.nodeType === Node.TEXT_NODE){
                                            var text = child.textContent;
                                            for(var k = 0; k < child.textContent.length; k += columns){
                                                var rt = document.createElement("rt");
                                                rt.textContent = "　";

                                                var ruby = document.createElement("ruby");
                                                ruby.textContent = text.slice(k, k + columns);
                                                ruby.appendChild(rt);

                                                var pe = document.createElement("p");
                                                pe.appendChild(ruby);

                                                pushLine(pe);
                                            }
                                        }
                                    }
                                }
                            }else{
                                throw new Error();
                            }

                        }else if(p.nodeType === Node.TEXT_NODE){
                            // ignore
                        }else{
                            throw new Error();
                        }
                    }


                    for(var i = pageNodes[pageNodes.length - 1].length; i < rows; i++){
                        addBlankLine();
                    }

                    viewer.style["display"] = "block";
                    top.style["display"] = "none";
                    notfound.style["display"] = "none";
                    history.pushState(null, null, "/works" + path + "/" + (page + 1));
                    update();

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
        outer.style["transform-origin"] = "0% 0%";

        document.querySelector("#caption").textContent = `${page + 1} / ${pageNodes.length}`;
    }


    var page = 0;
    var path = "";

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
        load(urlInput.value);
    });

    urlInput.addEventListener("keydown", function(e) {
        if (e.keyCode === 13) {
            load(urlInput.value);
        } else {
            update();
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

    inner.addEventListener("click", function(e) {
        goto(page + 1);
    });

    prev.addEventListener("click", function(e) {
        goto(page - 1);
    });

    function goto(dest) {
        page = Math.max(0, Math.min(pageNodes.length - 1, dest));
        history.pushState(null, null, "/works" + path + "/" + (page + 1));
        update();
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
        }else if(window.location.pathname.match(/^\/works\/\d{19}\/episodes\/\d{19}(\/\d{1,4})?$/)){
            load(`https://kakuyomu.jp${window.location.pathname}`);
        }
    }

    navigate();
});

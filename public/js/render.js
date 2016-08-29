"use strict";

function renderIndexPage(workData, onPageLoaded, onComplete) {
    if( ! workData.episodes[0].pages){
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

        paging(
            contents,
            function(page){
                var i = parseInt(page.getAttribute("data-episode-page-index"));
                page.setAttribute("data-episode-index", "0");
                page.setAttribute("data-episode-page-index", i);
                page.style["z-index"] = 100000000 - i;
                page.querySelector(".header").textContent = (i + 1) + "　目次";
                onPageLoaded(page);
            },
            function(pages){
            workData.episodes[0].pages = pages;
            onComplete(workData.episodes[0]);
        });
    }else{
        onComplete(workData.episodes[0]);
    }
}

function renderEpisodePages(responseText) {

    function linknize(parent){
        var nodeList = Array.prototype.slice.call(parent.childNodes);
        for(var i = 0; i < nodeList.length; i++){
            var child = nodeList[i];
            if(child.nodeType === Node.TEXT_NODE){
                var index = 0;
                var pattern = /(.*?)(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g;
                var children = [];
                while(true){
                    var match = pattern.exec(child.nodeValue);
                    if(match){
                        if(0 < match[1].length){
                            children.push(document.createTextNode(match[1]));
                        }
                        var a = document.createElement("a");
                        a.setAttribute("href", match[2]);
                        a.textContent = match[2];
                        children.push(a);
                        index = pattern.lastIndex;
                    }else{
                        var slice = child.nodeValue.slice(index);
                        if(slice !== ""){
                            children.push(document.createTextNode(slice));
                        }
                        break;
                    }
                }
                children.forEach(function(e){
                    parent.insertBefore(e, child);
                });
                parent.removeChild(child);
            }else if(child.nodeType === Node.ELEMENT_NODE && child.nodeName === "P"){
                linknize(child);
            }
        }
    }

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

    linknize(episodeBody);

    return episodeBody;
}

"use strict";

function showTopPage() {
    document.querySelector("#top").style["display"] = "block";
    document.querySelector("#viewer").style["display"] = "none";
}

function showViewer() {
    document.querySelector("#viewer").style["display"] = "block";
    document.querySelector("#top").style["display"] = "none";
}


function renderIndexPage(workData) {
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

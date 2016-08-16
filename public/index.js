window.addEventListener("load", function() {

    function load(episodeURL) {
        var path = episodeURL.slice("https://kakuyomu.jp/works".length);

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) { // DONE
                if (xhr.status == 200) { // OK
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(xhr.responseText, "text/html");
                    document.querySelector("div#inner").innerHTML = doc.querySelector(".widget-episodeBody").innerHTML;

                    viewer.style["display"] = "block";
                    top.style["display"] = "none";
                    notfound.style["display"] = "none";
                    history.pushState(null, null, "/works" + path);
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

        var outer = document.querySelector("div#outer");
        outer.style["transform"] = `scale(1.0)`;
        var rect = outer.getBoundingClientRect();
        var scale = (window.innerHeight - close.getBoundingClientRect().height - 40) / rect.height;
        outer.style["transform"] = `scale(${scale})`;
        outer.style["transform-origin"] = "50% 0%";
    }


    var page = 0;

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

    next.addEventListener("click", function(e) {
        goto(page + 1);
    });

    prev.addEventListener("click", function(e) {
        goto(page - 1);
    });

    function goto(dest) {
        page = Math.max(0, Math.min(1000, dest));
        inner.style["left"] = `calc( ( 18em * 1.5) * ${page})`;
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

    function navigate(){
        if(window.location.pathname === "/"){
            home();
        }else if(window.location.pathname.match(/^\/works\/\d{19}\/episodes\/\d{19}$/)){
            load(`https://kakuyomu.jp${window.location.pathname}`);
        }
    }

    navigate();
});

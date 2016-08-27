"use strict";

function paging(episodeBody, callback) {

    function appendBlankPage() {
        var content = document.createElement("div");
        content.classList.add("content");

        var header = document.createElement("div");
        header.classList.add("header");

        var page = document.createElement("div");
        page.classList.add("page");
        page.appendChild(header);
        page.appendChild(content);

        if(container.childNodes.length === 0){
            container.appendChild(page);
        }else{
            container.insertBefore(page, container.firstChild);
        }

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

    function _paging(parent, callback) {

        // layout elements //
        function next(callback){
            if (parent.childNodes.length > 0) {
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

                setImmediate(function(){
                    next(callback);
                }, 0);
            }else{
                callback();
            }
        }

        next(callback);
    }

    _paging(episodeBody, function(){
        // clear temporary styles
        var contents = container.querySelectorAll(".content");
        for (var i = 0; i < contents.length; i++) {
            contents[i].style["width"] = "";
        }

        callback(pageElements);
    });
}

"use strict";

const cacheTable = {};

function showLoading(){
    document.querySelector("#top").style["-webkit-filter"] = "blur(5px)";
    document.querySelector("#viewer").style["-webkit-filter"] = "blur(5px)";
    document.querySelector("img.loading").style["display"] = "block";
}

function closeLoading(){
    document.querySelector("#top").style["-webkit-filter"] = "none";
    document.querySelector("#viewer").style["-webkit-filter"] = "none";
    document.querySelector("img.loading").style["display"] = "none";
}

function isLoading(){
    return document.querySelector("img.loading").style["display"] === "block"
}

function get(url, callback){
    if(cacheTable[url]){
        callback(cacheTable[url]);
    }else{
        showLoading();
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

function getAsArrayBuffer(url, callback){
    if(cacheTable[url]){
        callback(cacheTable[url]);
    }else{
        showLoading();
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) { // DONE
                if (xhr.status == 200 || xhr.status == 304) { // OK
                    cacheTable[url] = xhr.response;
                    callback(xhr.response);
                }else{
                    console.log("Error: " + xhr.status);
                    closeLoading();
                    document.querySelector(".error").style["visibility"] = "visible";
                }
            }
        };
        xhr.responseType = "arraybuffer";
        xhr.open("GET", url);
        xhr.send();
    }
}

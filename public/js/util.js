"use strict";


function getImage(url, callback) {
    var image = new Image();
    image.onload = function() {
        callback(image);
    };
    image.src = url;
}

function generateUUID() {
    var uuid = "",
        i, random;
    for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;

        if (i == 8 || i == 12 || i == 16 || i == 20) {
            uuid += "-"
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}

function padzero(i) {
    var num = "00000" + i;
    return num.slice(num.length - 4);
}

function escapeTagChars(s) {
    return s.replace(/\&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, "<br></br>");
}

function download(fileName, blob){
    var element = document.createElement("a");
    element.download = fileName;
    element.href = window.URL.createObjectURL(blob);
    element.click();
}

function toISOString(date){

    function pad(number) {
      if (number < 10) {
        return '0' + number;
      }
      return number;
    }


    return date.getUTCFullYear() +
        '-' + pad(date.getUTCMonth() + 1) +
        '-' + pad(date.getUTCDate()) +
        'T' + pad(date.getUTCHours()) +
        ':' + pad(date.getUTCMinutes()) +
        ':' + pad(date.getUTCSeconds()) +
        'Z';
}



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
    }).replace(/―/g, "—").replace(/\(/g, "（").replace(/\)/g, "）")
}

function pad4(value){
    var s = "0000" + value.toFixed(0);
    return s.slice(s.length - 4, s.length);
}

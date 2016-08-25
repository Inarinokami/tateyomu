"use strict";

function parseKakuyomuURL(url) {
    var matches = /^https:\/\/kakuyomu\.jp\/works\/(\d{19})(\/episodes\/(\d{19}|index))?$/.exec(url);
    if (matches) {
        return {
            workID: matches[1],
            episodeID: matches[3]
        }
    } else {
        return null;
    }
}

function plainText(url, callback){
    var path = parseKakuyomuURL(url);
    if (path) {
        getWorkData(path.workID, function(work) {
            var i = 0;
            var episodes = work.episodes.slice(1);
            var title = work.title;
            var author = work.author;
            var zip = new JSZip();
            var uuid = generateUUID();

            zip.file("description.txt",
`【作品名】${work.title}
【作者】${work.author}
【イメージカラー】${work.color}
【ジャンル】${work.genre}
【キャッチフレーズ】${work.catchphrase}
【あらすじ】
${work.introduction}`
            );

            function next() {
                if (i < episodes.length) {
                    var episode = episodes[i];
                    var episodeName = escapeTagChars(episode.title);
                    get(`/raw/works/${work.id}/episodes/${episode.id}`, function(source) {
                        console.log("Downloading \"" + episodeName + "\"...");
                        zip.file("episode_" + padzero(i) + ".txt", "# " + episodeName + "\n\n" + htmlToSource(source));
                        i += 1;
                        setTimeout(next, timespan * 1000);
                    });
                } else {
                    zip.generateAsync({
                        type: "blob"
                    }).then(function(content) {
                        callback(work, content);
                    });
                }
            }

            next();
        });
    }
}

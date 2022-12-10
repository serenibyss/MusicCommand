function processResponseV2(response, ctx) {
    if (response.status != 200) {
        return `Bad response from worker\nStatus: ${request.status}\n<@359820220753248257>`;
    }

    let respData = response.data;
    if (ctx.getFlagValue(RAW_FLAG)) {
        return JSON.stringify(respData);
    }

    if (ctx.getFlagValue(HIDDEN_ID_FLAG)) {
        return respData.id;
    }

    let title = respData.name;
    if (respData.artist != undefined) {
        title += ` - ${respData.artist}`;
    }

    if (ctx.getFlagValue(NO_EMBED_FLAG)) {
        return `${title}\n<${respData.url}>`;
    }

    let site = ctx.getFlagValue(SITE_FLAG);
    let returnStr = "";
    if (site === undefined || site === "spotify") {
        returnStr += ":warning: WARNING: Spotify embeds are loud :warning:\n";
    }
    return `${returnStr}${title}\n${respData.url}`
}

// TODO Remove this and move all to V2
function processResponse(response, ctx) {
    if (response.status != 200) {
        return `Bad response from worker\nStatus: ${request.status}\n<@359820220753248257>`;
    }

    let respData = response.data;
    if (respData.statusCode != 200) {
        return `Worker failed to access ${respData.endpoint}\nStatus: ${respData.status}\nCode: ${respData.statusCode}\n<@359820220753248257>`;
    }

    if (ctx.getFlagValue(RAW_FLAG)) {
        return JSON.stringify(respData);
    }

    let data = respData.data;
    if (ctx.getFlagValue(HIDDEN_ID_FLAG)) {
        return data.id;
    }

    let embed = ctx.getFlagValue(NO_EMBED_FLAG);

    var returnStr = "";
    if (embed) {
        returnStr += ":warning: WARNING: Spotify embeds are loud :warning:\n";
    }
    if (data.playlistName != undefined) {
        returnStr += `Chosen from Playlist: ${data.playlistName}\n`;
    }

    if (!embed) {
        returnStr += "<";
    }

    if (data.type == undefined || data.type == "song") {
        returnStr += "https://open.spotify.com/track/"
    } else if (data.type == "album") {
        returnStr += "https://open.spotify.com/album/"
    } else if (data.type == "artist") {
        returnStr += "https://open.spotify.com/artist/"
    }
    returnStr += data.id;

    if (!embed) {
        returnStr += ">";
    }
    return returnStr;
}

function encodeParams(params) {
    return Object.entries(params).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
}

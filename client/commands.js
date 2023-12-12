function rootCommand() {
    let command = new Command("music");
    command.setUsage("Leveret command for browsing music, currently supports Spotify and Youtube");
    command.setFlags(HELP_FLAG);
    command.setAction((ctx) => ctx.getHelpText());
    return command;
}

function helpCommand() {
    let command = new Command("help");
    command.setUsage("Show a list of commands or help for one command");
    return command;
}

function searchCommand() {
    let command = new Command("search");
    command.setUsage("Search a song on Spotify or Youtube");
    command.setFlags(...commonFlags(), ARTIST_FLAG, ALBUM_FLAG, SITE_FLAG);
    command.setAction((ctx) => {
        if (!ctx.hasArgs()) {
            return ctx.getHelpText(); // + "Requires a search parameter"
        }

        let artist = ctx.getFlagValue(ARTIST_FLAG);
        let album = ctx.getFlagValue(ALBUM_FLAG);
        if (artist && album) {
            return ctx.getHelpText(); // + "Cannot have both artist and album flag applied"
        }

        let type = artist ? "artist" : album ? "album" : "track";

        // TODO Clean this all up
        let site = ctx.getFlagValue(SITE_FLAG);
        if (site === undefined) {
            site = "spotify";
        }

        let params = encodeParams({
            type: type,
            q: ctx.args,
            site: site,
        });

        let url = `https://spotifyv2.danfloppa.workers.dev/search?${params}`;
    
        if (ctx.getFlagValue(RAW_REQUEST_FLAG)) {
            return url;
        } else {
            return processResponseV2(http.request(url), ctx);
        }
    });
    return command;
}

function seniSongCommand() {
    let command = new Command("senisong");
    command.setUsage("Search a song on one of seni's Spotify Playlists. Defaults to the On Repeat playlist");
    command.setFlags(...commonFlags(), PID_FLAG, PNAME_FLAG);
    command.setAction((ctx) => {
        let pid = ctx.getFlagValue(PID_FLAG);
        let pname = ctx.getFlagValue(PNAME_FLAG);
        let data = null;

        // TODO Clean this all up
        if (pid != undefined) {
            data = {
                "pID": pid,
            };
        } else if (pname != undefined) {
            data = {
                "playlist": pname,
            };
        }

        let response = null;
        if (data != null) {
            request = http.request({
                url: "https://spotify.danfloppa.workers.dev/",
                headers: {
                    "accept": "application/json",
                },
                method: "post",
                data: data,
            });
        } else {
            response = http.request({
                url: "https://spotify.danfloppa.workers.dev/",
                headers: {
                    "accept": "application/json",
                },
                method: "get",
            });
        }
        return processResponse(response, ctx);
    });
    return command;
}
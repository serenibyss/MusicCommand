
// API Keys
const CLIENT = "hidden key";
const YT_API_KEY = "hidden key";

const API_TOKEN = "https://accounts.spotify.com/api/token";
const API_SPOTIFY_SEARCH = "https://api.spotify.com/v1/search";

const REQ_POST = "POST";
const REQ_GET  = "GET";

const CT_JSON = "application/json";
const CT_URL  = "application/x-www-form-urlencoded";

const URL_SPOTIFY_TRACK  = "https://open.spotify.com/track/";
const URL_SPOTIFY_ALBUM  = "https://open.spotify.com/album/";
const URL_SPOTIFY_ARTIST = "https://open.spotify.com/artist/";
const URL_YOUTUBE_VIDEO  = "https://www.youtube.com/watch?v=";

const NO_BODY = {};



addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) => new Response(err, { status: 500 })
    )
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const { pathname } = new URL(request.url);

  // Placeholder, this place represents a "before" action before processing other requests.
  // Eventually, this could for instance either gather the Spotify API Token if we are doing a
  // Spotify request, or gather a YouTube Music API Token instead etc.
  if (true) {
    await gatherToken();
  }

  // Status endpoint
  if (pathname.startsWith("/status")) {
    return handleStatusRequest();
  }

  // Search endpoint
  if (pathname.startsWith("/search")) {
    return handleSearchRequest(url.searchParams);
  }

  // Mayasong endpoint
  if (pathname.startsWith("/mayasong")) {
    return handleMayasongRequest(url);
  }

  return fetch("https://welcome.developers.workers.dev");
}

async function handleStatusRequest() {
  return new Response("Currently under construction", {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleSearchRequest(params) {
  let type = params.get("type");
  if (type == null) {
    type = "track";
  }

  let query = params.get("q");
  if (query == null) {
    return new Response("sussy search query"); // todo return the error here for no search query
  }

  let site = params.get("site");
  if (site == null) {
    site = "spotify";
  }

  if (site == "youtube") {
    return handleYoutubeSearch(type, query);
  }
  return handleSpotifySearch(type, query);
}

async function handleSpotifySearch(type, query) {
  let url = `${API_SPOTIFY_SEARCH}?q=${query}&type=${type}`;

  let body = await sendRequest(url, REQ_GET, tokenAuth(), CT_JSON, NO_BODY);

  switch (type) {
    case "album":
      if (body.albums !== undefined && body.albums.items !== undefined && body.albums.items[0] !== undefined) {
        return albumResponse(body.albums.items[0]);
      }
      break;
    
    case "artist":
      if (body.artists !== undefined && body.artists.items !== undefined && body.artists.items[0] !== undefined) {
        return artistResponse(body.artists.items[0]);
      }
      break;
    
    //case "playlist":
    //  
    //  break;

    case "track":
      if (body.tracks !== undefined && body.tracks.items !== undefined && body.tracks.items[0] !== undefined) {
        return trackResponse(body.tracks.items[0]);
      }
      break;

    //case "show":
    //  
    //  break;

    //case "episode":
    //  
    //  break;

    //case "audiobook":
    //  
    //  break;
  }

  return new Response(`Could not find ${type} with parameters "${query}"`, {status: 404});
}

async function handleYoutubeSearch(type, query) {
  if (type == "track") {
    type = "video";
  } else if (type == "album") { // TODO
    // type = "playlist";
    return new Response("Album search not yet implemented for YouTube API", {status: 501});
  } else if (type == "artist") { // TODO
    // type = "channel";
    return new Response("Artist search not yet implemented for YouTube API", {status: 501});
  }

  let url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&safeSearch=none&type=${type}`;
  url += `&key=${YT_API_KEY}`;

  let body = await sendRequest(url, REQ_GET, tokenAuthYT(), CT_JSON, NO_BODY);

  if (body.pageInfo === undefined || body.pageInfo.totalResults === undefined || body.pageInfo.totalResults <= 0) {
    return new Response(`Could not find ${type} with parameters "${query}"`, {status: 404});
  }
  return videoResponse(body.items[0]);
}

async function handleMayasongRequest(path) {

  return new Response("", {status: 501});
}

var SPOTIFY_TOKEN = "";
async function gatherToken() {
  if (SPOTIFY_TOKEN != "") {
    return;
  }
  let body = await sendRequest(API_TOKEN, REQ_POST, CLIENT, CT_URL, "grant_type=client_credentials");
  SPOTIFY_TOKEN = body.access_token;
}

function tokenAuth() {
  return `Bearer ${SPOTIFY_TOKEN}`;
}

function tokenAuthYT() {
  return `Bearer ${YT_TOKEN}`;
}

var YT_TOKEN = "";
async function gatherYTToken() {

}

async function sendRequest(url, method, auth, contentType, body) {
  let requestOptions = {
    method: method,
    headers: {
      'Content-Type':  contentType,
      'Authorization': auth,
    },
  };

  if (body != NO_BODY) {
    Object.assign(requestOptions, {body: body});
  }

  let resp = await fetch(url, requestOptions);
  // verifyResponse(resp); todo
  return await resp.json();
}

function trackResponse(song) {
  return buildResponse({
    id: song.id,
    url: `${URL_SPOTIFY_TRACK}${song.id}`,
    name: song.name,
    artist: song.artists[0].name,
    type: "track",
  }, 200);
}

function albumResponse(album) {
  return buildResponse({
    id: album.id,
    url: `${URL_SPOTIFY_ALBUM}${album.id}`,
    name: album.name,
    artist: album.artists[0].name,
    type: "album",
  }, 200);
}

function artistResponse(artist) {
  return buildResponse({
    id: artist.id,
    url: `${URL_SPOTIFY_ARTIST}${artist.id}`,
    name: artist.name,
    type: "artist",
  }, 200);
}

function videoResponse(video) {
  return buildResponse({
    id: video.id.videoId,
    url: `${URL_YOUTUBE_VIDEO}${video.id.videoId}`,
    name: video.snippet.title,
    type: "track",
  }, 200);
}

function buildResponse(data, status) {
  const json = JSON.stringify(data, null, "  ");
  return new Response(json, {
    headers: { "Content-Type": "application/json" },
  });
}

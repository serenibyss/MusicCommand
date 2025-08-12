// Spotify OAuth 2.0 API Endpoint
const tokenEndpoint = "/api/token";

// Spotify V1 API Endpoints
const API_GET_PLAYLIST = "/v1/playlists/{playlist_id}";
const API_GET_TRACKS = "/v1/playlists/{playlist_id}/tracks";
const API_GET_PLAYLISTS = "/v1/me/playlists";
const API_SEARCH = "/v1/search";

// Spotify Client Key
const CLIENT_ID = "hidden key";
const CLIENT_SECRET = "hidden key";

// Spotify Playlist IDs
const ON_REPEAT_PLAYLIST_ID = "37i9dQZF1Epi7tc8xxXded";
const RELEASE_RADAR_PLAYLIST_ID = "37i9dQZEVXbrvVXRSAXAWx";
const DISCOVER_WEEKLY_PLAYLIST_ID = "37i9dQZEVXcJiM3tOtKQKv";

// Event listener for the main event
addEventListener("fetch", event => {
  return event.respondWith(handleRequest(event.request))
});

/**
 * Request format:
 * pID: "some id",
 * playlist: "some playlist name",
 *
 * Will ignore "playlist" if "pID" is set.
 */
async function handleRequest(request) {

  // Get the token
  let token = await getOAuthToken();

  let body = null;
  if (request.body != null) {
    body = await request.json();
  }

  // Check if we are searching for a song instead of getting a playlist song
  if (shouldSearch(body)) {
    return searchSong(token, body);
  }

  // We know we are getting a song from a playlist at this point
  let playlistID = getPlaylistID(body);

  // Get playlist name
  let r1 = await getPlaylistNameFromID(token, playlistID);
  if (r1.name == null) {
    return buildResponse('', r1.status, r1.code, API_GET_PLAYLIST);
  }
  let playlistName = r1.name;

  // Get the playlist request body
  let r2 = await getPlaylistSongsFromID(token, playlistID);
  if (r2.playlist == null) {
    return buildResponse('', r2.status, r2.code, API_GET_TRACKS);
  }
  let playlist = r2.playlist;


  // Get a random song from the playlist
  let song = getRandomSongFromPlaylist(playlist);

  // Send off the final response
  return buildResponse({
    id: song.id,
    name: song.name,
    artist: song.artist,
    playlistName: playlistName,
  }, "OK", 200, "");
}

function shouldSearch(body) {
  if (body === null || body.search === undefined) {
    return false;
  }
  return true;
}

async function searchSong(token, passedBody) {
  let searchParam = passedBody.search;
  let searchType = "track";
  if (passedBody.type != undefined) {
    searchType = passedBody.type;
  }

  let requestOptions = {
    method: "GET",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  let response = await fetch(`https://api.spotify.com/v1/search?q=${searchParam}&type=${searchType}`, requestOptions);
  if (response.status != 200) {
    return buildResponse('', response.status, response.status, API_SEARCH);
  }

  let body = await response.json();

  if (searchType == "track") {
    if (body.tracks === undefined || body.tracks.items === undefined || body.tracks.items[0] === undefined) {
      return buildResponse(`Could not find song from search parameter ${searchParam}`, "OK", 200, API_SEARCH);
    }
    return buildResponse(getSongStruct(body.tracks.items[0]), "OK", 200, API_SEARCH);
  } else if (searchType == "album") {
    if (body.albums === undefined || body.albums.items === undefined || body.albums.items[0] === undefined) {
      return buildResponse(`Could not find album from search parameter ${searchParam}`, "OK", 200, API_SEARCH);
    }
    return buildResponse(getAlbumStruct(body.albums.items[0]), "OK", 200, API_SEARCH);
  } else if (searchType == "artist") {
    if (body.artists === undefined || body.artists.items === undefined || body.artists.items[0] === undefined) {
      return buildResponse(`Could not find artist from search parameter ${searchParam}`, "OK", 200, API_SEARCH);
    }
    return buildResponse(getArtistStruct(body.artists.items[0]), "OK", 200, API_SEARCH);
  }
}

function getPlaylistID(body) {

  // Default option if none specified
  if (body === null) {
    return ON_REPEAT_PLAYLIST_ID;
  } else if (body.pID !== undefined) {
    return body.pID;
  } else if (body.playlist !== undefined) {
    return getPlaylistFromName(body.playlist);
  }
  return ON_REPEAT_PLAYLIST_ID;
}

function getPlaylistFromName(name) {
  let lower = name.toLowerCase();
  if (lower === "on repeat" || lower === "or" || lower.includes("repeat")) {
    return ON_REPEAT_PLAYLIST_ID;
  } else if (lower === "release radar" || lower === "rr" || lower.includes("release") || lower.includes("radar")) {
    return RELEASE_RADAR_PLAYLIST_ID;
  } else if (lower === "discover weekly" || lower === "dw" || lower.includes("discover") || lower.includes("weekly")) {
    return DISCOVER_WEEKLY_PLAYLIST_ID;
  }
  return ON_REPEAT_PLAYLIST_ID;
}

// Spotify OAuth request handler
async function getOAuthToken() {

  // urlencoded POST request
  const requestOptions = {
    method: "POST",
    headers: {
      'Authorization': 'Basic ' + (btoa(CLIENT_ID + ":" + CLIENT_SECRET)),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: "grant_type=client_credentials",
    redirect: "follow",
  };

  // send request for spotify token
  let response = await fetch("https://accounts.spotify.com/api/token", requestOptions);
  if (response.status != 200) {
    return buildResponse('', response.status, response.status, tokenEndpoint);
  }

  // read access_token from the request and send to V1 API
  let jsonResponse = await response.json();
  return jsonResponse.access_token;
}

// Gets the playlist name given a playlist ID.
// If playlist name is null, the request to the Spotify API failed.
async function getPlaylistNameFromID(token, playlistID) {
  const requestOptions = {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  let response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, requestOptions);
  if (response.status != 200) {
    return {
      name: null,
      status: response.statusText,
      code: response.status,
    };
  }

  let body = await response.json();
  return {
    name: body.name,
    status: "OK",
    code: 200,
  };
}

// Returns a struct formatted in the spotify tracks API format.
//
// Return format:
// {
//    playlist:             // struct
//    status:     "example" // string
//    statusCode: 200       // int
// }
async function getPlaylistSongsFromID(token, playlistID) {
  // JSON encoded GET request
  const requestOptions = {
    method: "GET",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // send request for playlist track info
  let response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`, requestOptions);
  if (response.status != 200) {
    return {
      playlist: null,
      status: response.statusText,
      code: response.status,
    };
  }

  let body = await response.json();
  return {
    playlist: body,
    status: "OK",
    code: 200,
  };
}

function getRandomSongFromPlaylist(playlist) {
  let index = Math.floor(Math.random() * playlist.items.length);
  return getSongStruct(playlist.items[index].track);
}

// Response format from this worker
//
// Takes data (some struct), status (string), statusCode (int), and endpoint (string).
function buildResponse(data, status, statusCode, endpoint) {

  let resp = {
      data: data,
      status: status,
      statusCode: statusCode,
      endpoint: endpoint,
  }
  const json = JSON.stringify(resp, null, "  ");

  return new Response(json,
    {
      headers: {
        'content-type': 'application/json'
      }
    }
  );
}

function getSongStruct(song) {
  return {
    id: song.id,
    name: song.name,
    artist: song.artists[0].name,
    type: "song",
  };
}

function getAlbumStruct(album) {
  return {
    id: album.id,
    name: album.name,
    artist: album.artists[0].name,
    type: "album",
  };
}

function getArtistStruct(artist) {
  return {
    id: artist.id,
    name: artist.name,
    type: "artist",
  };
}

function buildAPIDocsResponse() {
  let resp = {
    data: "", // TODO document the allowed POST request format
    status: "OK",
    statusCode: "200",
    endpoint: "mayaAPI",
  }
}

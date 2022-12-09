const HELP_FLAG = new Flag("help", "h", BOOL_TYPE, "Show help");
const NO_EMBED_FLAG = new Flag("no-embed", "e", BOOL_TYPE, "Remove the embed from the output link");
const RAW_FLAG = new Flag("raw", "r", BOOL_TYPE, "Show the raw JSON response from the backend");
const PID_FLAG = new Flag("pid", "p", STRING_TYPE, "Pass a specified Playlist ID");
const PNAME_FLAG = new Flag("pname", "n", STRING_TYPE, "Pass a specified Playlist Name. Currently allowed: 'On Repeat' / 'OR', 'Discover Weekly' / 'DW', and 'Release Radar' / 'RR'");
const ARTIST_FLAG = new Flag("artist", "", BOOL_TYPE, "Search for an artist instead of a song");
const ALBUM_FLAG = new Flag("album", "", BOOL_TYPE, "Search for an album instead of a song");
const SITE_FLAG = new Flag("site", "s", STRING_TYPE, "Specify what site to search on. Allowed are 'YouTube', 'Spotify'. Default: 'Spotify'");
const ID_FLAG = new Flag("id", "i", BOOL_TYPE, "");

ID_FLAG.setHidden();

function commonFlags() {
    return [HELP_FLAG, NO_EMBED_FLAG, RAW_FLAG, ID_FLAG];
}

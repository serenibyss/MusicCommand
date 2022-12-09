// COMMAND STRUCT DEFINITION:
// - name (string)            // The name of this subcommand
// - aliases (array)          // Allowed aliases of this subcommand
// - usage (string)           // Short description of this subcommand
// - action (function)        // The function to execute for this subcommand
// - subcommands (array)      // List of subcommands of this subcommand
// - flags (array)            // List of flags of this subcommand
//
//
//
// For the ACTION, send a function(ctx) where "ctx" is the CLI context.
// CLI CONTEXT DEFINITION:
// - command (command)        // The command struct of this subcommand (effectively "this")
// - flags (array)            // Array of FlagValue objects
// - args (string)            // Command arguments passed after the flags and subcommands were parsed out
//
//
//
// FLAG DEFINITION:
// - name (string)            // Name of this flag
// - short (string)           // Single character shorthand of this flag
// - usage (string)           // Description of this flag
// - type (type integer)      // Integer representing the type of this flag
//
//
//
// FLAGVALUE DEFINITION
// - name (string)            // Name of this flag
// - type (type integer)      // Integer representing the type of this flag
// - value (any)              // Value of this flag, type indicated by the type integer

const BOOL_TYPE = 0;
const STRING_TYPE = 1;

(() => {
  return "Under reconstruction";
  //let val = init(tag.args);
  //if (val !== undefined) {
  //  return val;
  //}
})();
//console.log(init("-h"));

function init(args) {
  let root = baseCommand();

  root.subcommands.push(
    searchCommand(),
    danSongCommand(),
    helpCommand()
  );

  let retVal = runCommands(root, args);
  if (retVal != undefined && retVal.embed != undefined && retVal.embed) {
    msg.reply({ embed: retVal.embedBody });
  } else {
    return retVal.data;
  }
}

function runCommands(root, args) {
  // No args passed, do the root action
  if (args === null || args === "" || args == undefined) {
    return root.action({ command: root, args: "", flags: [] });
  }

  let context = parseArgs(root, args);
  if (typeof context === 'string' || context instanceof String) {
    return getRetVal(context, "", false); // error was hit, exit early
  }

  if (context.command.name == "help") {
    return getHelpText(root);
  }
  if (hasHelpFlag(context.flags)) {
    return getHelpText(context.command);
  }

  try {
    return context.command.action(context);
  } catch (err) {
    if (err.status !== undefined) {
      return getRetVal(`Failed with status code ${err.status}`, "", false);
    } else {
      return getRetVal(err.toString(), "", false);
    }
  }
}

function parseArgs(root, args) {
  let splitArgs = args.split(" ");
  let chosenCmd = root;
  let currentIndex = 0;
  let providedFlags = [];

  // First, parse args until we find the current "deepest" subcommand we can do
  for (let i = 0; i < splitArgs.length; i++) {
    // Pass empty strings
    if (splitArgs[i] == "") {
      currentIndex++;
      continue;
    }

    if (chosenCmd.subcommands == undefined || chosenCmd.subcommands.length == 0) {
      // No possible subcommands, move on to flags
      break;
    }

    let found = false;
    for (let j = 0; j < chosenCmd.subcommands.length; j++) {
      // Check if current argument matches any of the possible subcommands
      if (matchesSubcommand(chosenCmd.subcommands[j], splitArgs[i])) {
        // If it does, pick that command and continue
        chosenCmd = chosenCmd.subcommands[j];
        found = true;
        break;
      }
    }
    if (!found) {
      break;
    } else {
      currentIndex++;
    }
  }

  // Next, parse args to try and process any flags
  for (let i = currentIndex; i < splitArgs.length; i++) {
    // Pass empty strings
    if (splitArgs[i] == "") {
      currentIndex++;
      continue;
    }

    if (chosenCmd.flags == undefined || chosenCmd.flags.length == 0) {
      // No possible flags, break
      break;
    }

    let found = false;
    for (let j = 0; j < chosenCmd.flags.length; j++) {
      if (matchesFlag(chosenCmd.flags[j], splitArgs[i])) {
        found = true;
        let flagTemplate = chosenCmd.flags[j];
        switch (flagTemplate.type) {
          case BOOL_TYPE:
            currentIndex++;
            providedFlags.push({
              name: flagTemplate.name,
              type: BOOL_TYPE,
              value: true,
            });
            break;

          case STRING_TYPE:
            if (splitArgs.length <= i + 1) {
              return getHelpText(chosenCmd) + `Flag ${flagTemplate.name} must have data following it.`;
            }
            currentIndex += 2;
            providedFlags.push({
              name: flagTemplate.name,
              type: STRING_TYPE,
              value: splitArgs[++i],
            });
            break;
        }
        break;
      }
    }
    if (!found) {
      break;
    }
  }

  // Build and return the context object
  return {
    command: chosenCmd,
    flags: providedFlags,
    args: splitArgs.slice(currentIndex).join(" "),
  };
}

function matchesSubcommand(command, arg) {
  return command.name == arg || (command.aliases != undefined && command.aliases.includes(arg));
}

function matchesFlag(flag, arg) {
  return `--${flag.name}` == arg || `-${flag.short}` == arg;
}

function baseCommand() {
  return {
    name: "music",
    usage: "Leveret command for browsing music, currently supports Spotify and Youtube",
    action: (ctx) => {
      return getHelpText(ctx.command);
    },
    flags: [
      {
        name: "help",
        short: "h",
        type: BOOL_TYPE,
        usage: "Show help",
      },
    ],
    subcommands: [], // empty array to not hit an "undefined" above
  };
}

function searchCommand() {
  return {
    name: "search",
    aliases: ["find"],
    usage: "Search a song on Spotify or Youtube",
    action: (ctx) => {
      if (ctx.args == "") {
        return getHelpText(ctx.command) + "Requires a search parameter";
      }

      if (getFlagValue(ctx.flags, "artist") && getFlagValue(ctx.flags, "album")) {
        return getHelpText(ctx.command) + "Cannot have both artist and album flag applied"
      }
      let type = "track";
      if (getFlagValue(ctx.flags, "artist")) {
        type = "artist";
      } else if (getFlagValue(ctx.flags, "album")) {
        type = "album";
      }

      let site = getFlagValue(ctx.flags, "site")
      if (site == null) {
        site = "spotify";
      }

      let params = encodeParams({
        type: type,
        q: ctx.args,
        site: site,
      });

      return processResponseV2(http.request(`https://spotifyv2.danfloppa.workers.dev/search?${params}`), ctx.flags);
    },
    flags: commonFlags().concat(
      {
        name: "artist",
        type: BOOL_TYPE,
        usage: "Search for an artist instead of a song",
      },
      {
        name: "album",
        type: BOOL_TYPE,
        usage: "Search for an album instead of a song",
      },
      {
        name: "site",
        short: "s",
        type: STRING_TYPE,
        usage: "Specify what site to search on. Allowed are 'YouTube', 'Spotify'. Default: 'Spotify'",
      }
    ),
  }
}

function helpCommand() {
  return {
    name: "help",
    usage: "Show a list of commands or help for one command",
  };
}

function danSongCommand() {
  return {
    name: "dansong",
    aliases: ["dan-song", "dan_song", "dan"],
    usage: "Search a song on one of dan's Spotify Playlists. Defaults to the On Repeat playlist",
    action: (ctx) => {
      let pid = getFlagValue(ctx.flags, "pid");
      let pname = getFlagValue(ctx.flags, "pname");
      let data = null;

      if (pid != null) {
        data = {
          "pID": pid,
        };
      } else if (pname != null) {
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
      return processResponse(response, ctx.flags);
    },
    flags: commonFlags().concat(
      {
        name: "pid",
        short: "p",
        type: STRING_TYPE,
        usage: "Pass a specified Playlist ID",
      },
      {
        name: "pname",
        short: "n",
        type: STRING_TYPE,
        usage: "Pass a specified Playlist Name. Currently allowed: 'On Repeat' / 'OR', 'Discover Weekly' / 'DW', and 'Release Radar' / 'RR'",
      },
    ),
  }
}


// Flags intended for all commands
function commonFlags() {
  return [
    {
      name: "help",
      short: "h",
      type: BOOL_TYPE,
      usage: "Show help",
    },
    {
      name: "no-embed",
      short: "e",
      type: BOOL_TYPE,
      usage: "Remove the embed from the output link",
    },
    {
      name: "raw",
      short: "r",
      type: BOOL_TYPE,
      usage: "Show the raw JSON response from the backend",
    },
  ];
}

function hasHelpFlag(flags) {
  return getFlagValue(flags, "help");
}

function hasRawFlag(flags) {
  return getFlagValue(flags, "raw");
}

function hasIDFlag(flags) {
  return getFlagValue(flags, "id");
}

function hasNoEmbedFlag(flags) {
  return getFlagValue(flags, "no-embed");
}

function getFlagValue(flags, flagName) {
  if (flags == undefined || flags.length == 0) {
    return null;
  }
  for (let i = 0; i < flags.length; i++) {
    if (flags[i].name == flagName) {
      return flags[i].value;
    }
  }
  return null;
}

function encodeParams(params) {
  return Object.entries(params).map(kv => kv.map(encodeURIComponent).join("=")).join("&");
}

function processResponseV2(response, flags) {
  if (response.status != 200) {
    return `Bad response from worker\nStatus: ${request.status}\n<@359820220753248257>`;
  }

  let respData = response.data;
  if (hasRawFlag(flags)) {
    return JSON.stringify(respData);
  }

  if (hasIDFlag(flags)) {
    return respData.id;
  }

  let title = respData.name;
  if (respData.artist != undefined) {
    title += ` - ${respData.artist}`;
  }

  if (hasNoEmbedFlag(flags)) {
    return `${title}\n<${respData.url}>`;
  }

  var returnStr = "";
  if (getFlagValue(flags, "site") == null || getFlagValue(flags, "site") == "spotify") {
    returnStr += ":warning: WARNING: Spotify embeds are loud :warning:\n";
  }
  return `${returnStr}${title}\n${respData.url}`
}

function processResponse(response, flags) {
  if (response.status != 200) {
    return `Bad response from worker\nStatus: ${request.status}\n<@359820220753248257>`;
  }

  let respData = response.data;
  if (respData.statusCode != 200) {
    return `Worker failed to access ${respData.endpoint}\nStatus: ${respData.status}\nCode: ${respData.statusCode}\n<@359820220753248257>`;
  }

  if (hasRawFlag(flags)) {
    return JSON.stringify(respData);
  }

  let data = respData.data;
  if (hasIDFlag(flags)) {
    return data.id;
  }

  let embed = !hasNoEmbedFlag(flags);

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

function getHelpText(command) {
  let embed = {
    title: command.name,
    color: 0x5DADEC,
    description: command.usage,
    footer: { text: "Generated automatically for the music command", iconURL: "	https://media.discordapp.net/attachments/814985279697846306/1050681221878919229/guitar.png" },
    thumbnail: { url: "https://media.discordapp.net/attachments/814985279697846306/1050681207236595802/musical_note.png" },
  };
  let fieldsIdx = 0;
  let fields = [];

  // Subcommands (normal fields)
  if (command.subcommands != undefined && command.subcommands.length > 0) {
    for (let i = 0; i < command.subcommands.length; i++) {
      fields[i] = {
        name: command.subcommands[i].name,
        value: command.subcommands[i].usage,
      };
    }
    fieldsIdx = command.subcommands.length + 1;
  }

  // Flags (inline fields)
  if (command.flags != undefined && command.flags.length > 0) {
    for (let i = 0; i < command.flags.length; i++) {
      if (command.flags[i].name === "help") {
        continue;
      }

      // Gather the normal and short names of this flag
      let name = `--${command.flags[i].name}`;
      if (command.flags[i].short != undefined) {
        name += `, -${command.flags[i].short}`;
      }

      fields[i + fieldsIdx] = {
        name: name,
        value: command.flags[i].usage,
        inline: true,
      };
    }
  }

  if (fields.length > 0) {
    embed.fields = fields;
  }

  return getRetVal(embed, "", true);
}

function getRetVal(data, extra, isEmbed) {
  let retVal = {};
  if (isEmbed) {
    retVal.embed = true;
    retVal.embedBody = data;
    if (extra !== "") {
      retVal.extra = extra;
    }
  } else {
    retVal.data = data + "\n" + extra;
  }
  return retVal;
}

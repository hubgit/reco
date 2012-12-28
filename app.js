$(function() {
  var echonest_key = "D3JK5N3NLFII4K3HF";
  var loading = $("<div class='loading'>Generating&hellip; <img src='images/spinner.gif'></div>");

  var addArtist = function(artist) {
    if ($("#input [name=artist]").length === 6) {
      $("#input [name=artist]:first").closest("div").remove();
    }

    var input = $("<input/>", { type: "hidden", name: "artist" }).val(artist);

    var remove = $("<button/>", { type: "button" })
      .addClass("remove-artist btn btn-danger btn-mini")
      .append("<i class='icon-white icon-minus-sign'></i>");

    $("<div/>").text(artist).addClass("artist").append(input).prepend(remove).appendTo("#artists");

    generatePlaylist();
  };

  var addSuggestion = function(event) {
    event.preventDefault();

    var artist = $.trim($(this).text());
    addArtist(artist);
  };

  var getArtistNames = function() {
    var artistNames = [];

    $("#input input[name=artist]").each(function(i){
      var artistName = $(this).val();
      if (artistName){
        artistNames.push(artistName);
      }
    });

    return artistNames;
  };

  var generatePlaylist = function(event){
    if (event) {
      event.preventDefault();
    }

    $("#input").addClass("has-artists");

    var inputs = $("input[name=artist]");
    inputs.css("outline-color", "black");

    var artists = [];
    var artistNames = getArtistNames();

    if (!artistNames.length){
      inputs.eq(0).css("outline-color", "red").focus();
      return false;
    }

    $("#playlist").empty().append(loading);

    $.ajax({
      type: "GET",
      url: "http://developer.echonest.com/api/v4/playlist/static",
      data: {
        format: "json",
        api_key: echonest_key,
        variety: 1,
        results: 25,
        type: "artist-radio",
        bucket: ["id:spotify-WW","tracks"],
        artist: artistNames
      },
      datatype: "json",
      success: playlistLoaded,
      traditional: true
    });

    document.title  = "ReCo: " + ((artistNames.length == 1) ? artistNames[0] : artistNames.slice(0, -1).join(", ") + " & " + artistNames.slice(-1));

    var url = window.location.href.replace(/\?.+/, "") + "?" + $.param({ artist: artistNames }, true);
    history.pushState(null, document.title, url);

    return false;
  };

  var playlistLoaded = function(data){
    $("#playlist").empty();

    if (!data.response.songs.length){
      $("<li class='error'>No tracks could be recommended using these artists, sorry.</li>").appendTo("#playlist");
      return false;
    }

    var tracks = [];
    var artists = [];

    $.each(data.response.songs, function(i, item){
      artists.push(item.artist_name);

      if (!item.tracks.length) return true; // continue
      var matches = item.tracks[0].foreign_id.match(/^spotify-WW:track:(.+)/);

      if (matches.length) {
        tracks.push(matches[1]);
      }
    });

    if (tracks.length) {
      var trackSet = tracks.join(",");

      $("<iframe/>", { src: "https://embed.spotify.com/?uri=spotify:trackset:ReCo:" + trackSet, frameborder: "0", allowtransparency: "true", height: 400, width: 320 }).appendTo("#playlist");
    }

    $("#suggestions").empty();

    if (artists.length) {
      var uniqueArtists = artists.filter(function(item, index){
          return index == artists.indexOf(item);
      });

      var usedArtists = getArtistNames();

      var unusedArtists = uniqueArtists.filter(function(item) {
        return usedArtists.indexOf(item) < 0;
      });

      $.each(unusedArtists, function(index, artist) {
        $("<button/>", { type: "button", text: artist })
          .addClass("artist-name btn btn-mini btn-primary")
          .prepend("<i class='icon-white icon-plus-sign'></i> ")
          .appendTo("#suggestions");
      });

      $("#suggestions").show();
    }
  };

  var removeArtist = function(event) {
    event.preventDefault();

    $(this).closest("div").remove();
    generatePlaylist();
  };

  var parseQueryString = function() {
    return location.search.substring(1).split("&").map(function(item) {
      return item.split("=").map(decodeURIComponent).map(function(text) {
        return text.replace(/\+/g, " ").replace(/\/$/, "");
      });
    })
  };

  var readQuery = function() {
    var artists = [];

    $.each(parseQueryString(), function(index, item) {
      if (item[0] == "artist") {
        var artist = $.trim(item[1]);
        addArtist(artist);
        artists.push(artist);
      }
    });

    if (artists.length){
      generatePlaylist();
    }
  };

  $.ajaxSetup({ cache: true });

  $("#add")
    .on("keyup", function(event) {
      $("#input").addClass("has-artists"); // TODO: read artists
    })
    .suggest({ filter: "(all type:/music/artist)" })
    .bind("fb-select", function(event, selected) {
      addArtist(selected.name);
      $("#add").val(null);
    });

  $("#input").on("submit", function(event) {
    event.preventDefault();
    addArtist($("#add").val());
  });
  $("#suggestions").on("click", ".artist-name", addSuggestion);
  $("#input").on("click", ".remove-artist", removeArtist);

  readQuery();
});


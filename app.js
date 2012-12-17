$(function() {
  var echonest_key = "D3JK5N3NLFII4K3HF";
  var loading = $("<div class='loading'>Generating&hellip; <img src='images/spinner.gif'></div>");

  var addButtonClicked = function(event) {
    event.preventDefault();
    addArtistInput(true);
  };

  var addArtistInput = function(focus){
    if ($("#input [name=artist]").length === 5) {
      alert("Up to 5 artists can be used as seeds - remove some before adding more!");
      return false;
    }

    var input = $("<input/>", { type: "text", name: "artist" })
      .insertBefore("#add-button")
      .suggest({ filter: "(all type:/music/artist)" })
      .bind("fb-select", function() {
        generatePlaylist();
      })
      .wrap("<div></div>");

    if (focus) {
        input.focus();
    }

    var remove = $("<button/>", { type: "button" })
      .addClass("remove-artist btn btn-danger")
      .append("<i class='icon-white icon-minus-sign'></i>")
      .insertAfter(input);

    return input;
  };

  var generatePlaylist = function(event){
    if (event) {
      event.preventDefault();
    }

    $("#input").addClass("has-artists");

    var inputs = $("input[name=artist]");
    inputs.css("outline-color", "black");

    var artists = [];
    var artistNames = [];
    var artistName;

    inputs.each(function(i){
      var artistName = $(this).val();
       if (artistName){
         artistNames.push(artistName);
       }
    });

    if (!artistNames.length){
      alert("Enter some artist names first!");
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
        results: 15,
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

      $("<iframe/>", { src: "https://embed.spotify.com/?uri=spotify:trackset:ReCo:" + trackSet, frameborder: "0", allowtransparency: "true", height: 720, width: 320 }).appendTo("#playlist");
    }

    $("#artists").empty();

    if (artists.length) {
      $.each($.unique(artists), function(index, artist) {
        $("<button/>", { type: "button", text: artist })
          .addClass("artist-name btn btn-mini btn-primary")
          .prepend("<i class='icon-white icon-plus-sign'></i> ")
          .appendTo("#artists");
      });

      $("#artists").show();
    }
  };

  var addArtist = function(event) {
    event.preventDefault();

    var artist = $.trim($(this).text());
    addArtistInput().val(artist);

    $("#input").submit();
  };

  var removeArtist = function(event) {
    event.preventDefault();

    $(this).closest("div").remove();
    $("#input").submit();
  };

  var parseQueryString = function() {
    return location.search.substring(1).split("&").map(function(item) {
      return item.split("=").map(decodeURIComponent).map(function(text) {
        return text.replace(/\+/g, " ").replace(/\/$/, "");
      });
    })
  };

  $.ajaxSetup({ cache: true });

  $("#input").on("keyup", "[name=artist]", function(event) {
    $("#input").addClass("has-artists");
  });

  $("#input").on("submit", generatePlaylist);
  $("#add-button").on("click", addButtonClicked);
  $("#artists").on("click", ".artist-name", addArtist);
  $("#input").on("click", ".remove-artist", removeArtist);

  var artists = [];

  $.each(parseQueryString(), function(index, item) {
    if (item[0] == "artist") {
      var artist = $.trim(item[1]);
      addArtistInput().val(artist);
      artists.push(artist);
    }
  });

  if (artists.length){
    generatePlaylist();
  }
});


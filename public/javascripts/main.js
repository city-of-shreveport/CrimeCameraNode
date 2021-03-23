var socket = io();
var dreamHost = io('http://192.168.196.123:3001/cameras');
var cameraNode1 = io('//192.168.196.89:3000/');
let map 
var marker
var marker2
var marker3
let infoWindow;
var nodeID = "";
var calendarHTML = "<div class='calendar'></div>"
var PTZCamHTML = "<div class='row'>"+
"<div class='col-sm-6'>"+
  "<div class='card'>"+
    "<div class='card-body' id=PTZVideoFeed>"+
      
    "</div>"+
  "</div>"+
"</div>"+
"<div class='col-sm-6'>"+
  "<div class='row'>"+
    "<div class='col-6 col-md-3 customBox videoSide'>"+
        "<div class='customBox videoInSide'>"+
          "<div class='card border-dark mb-3' style='max-width: 400px;'>"+
            "<div class='card-header actionHeader'>Controls</div>"+
            "<div class='card-body text-dark'>"+
            "<form>"+
              "<div class='form-group'>"+
                "<label for='formControlRange'>Movement Speed</label>"+
                "<input type='range' class='form-control-range' id='panSpeed' value=4 min=0 max=8>"+
              "</div>"+
            "</form>"+
              "<div class='container'>"+
                "<div class='row'>"+
                  "<div class='col-sm'>"+
                  "</div>"+
                  "<div class='col-sm'>"+
                    "<button type='button' class='btn btn-secondary up'> Up </button>"+
                  "</div>"+
                  "<div class='col-sm'>"+
                  "</div>"+
                "</div>"+
                "<div class='row'>"+
                  "<div class='col-sm'>"+
                    "<button type='button' class='btn btn-secondary left'>Left</button>"+
                  "</div>"+
                  "<div class='col-sm'></div>"+
                  "<div class='col-sm'>"+
                    "<button type='button' class='btn btn-secondary right'>Right</button>"+
                  "</div>"+
                "</div>"+
                "<div class='row'>"+
                  "<div class='col-sm'>"+
                  "</div>"+
                  "<div class='col-sm'>"+
                    "<button type='button' class='btn btn-secondary down' >Down</button>"+
                  "</div>"+
                  "<div class='col-sm'>"+
                  "</div>"+
                "</div>"+
              "</div>"+
            "</div>"+   
                "<div class='card-footer'>"+
                  "<div class='container'>"+
                    "<div class='row'>"+
                      "<div class='col'>"+
                        "<h5>Zoom</h5>"+
                        "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                          "<button type='button' class='btn btn-primary btn-sm zoomout'>Out\</button>"+
                          "<button type='button' class='btn btn-danger btn-sm zoomin'>IN</button>"+
                        "</div>"+
                      "</div>"+
                      "<div class='col'>"+
                        "<h5>Recording</h5>"+
                        "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                          "<button type='button' class='btn btn-primary btn-sm recordon'>Start</button>"+
                          "<button type='button' class='btn btn-danger btn-sm recordoff'>Stop</button>"+
                        "</div>"+
                      "</div>"+
                      "<div class='col'>"+
                      "<h5>Tour</h5>"+
                      "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                        "<button type='button' class='btn btn-primary btn-sm startTour'>Start</button>"+
                        "<button type='button' class='btn btn-danger btn-sm stopTour'>Stop</button>"+
                      "</div>"+
                      "</div>"+
                      "<div class='col'>"+
                      "<h5>Scanning</h5>"+
                      "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                            "<button type='button' class='btn btn-primary btn-sm scanon'>Start</button>"+
                            "<button type='button' class='btn btn-danger btn-sm scanoff'>Stop</button>"+
                        "</div>"+
                      "</div>"+
                    "</div>"+
                  "</div>"+
                "</div>"+
                "</div>"+
          "</div>"+
      "</div>"+
  "</div>"+
    "</div>"+
  "</div>"+
"</div>"+
"</div>"  
var Cam2ViewHTML = "<div class='row'>"+
  "<div class='col-sm-6'>"+
    "<div class='card'>"+
      "<div class='card-body'>"+
        "<h5 class='card-title'>Special title treatment</h5>"+
        "<p class='card-text'>With supporting text below as a natural lead-in to additional content.</p>"+
        "<a href='#' class='btn btn-primary'>Go somewhere</a>"+
      "</div>"+
   " </div>"+
  "</div>"+
  "<div class='col-sm-6'>"+
    "<div class='card'>"+
      "<div class='card-body'>"+
        "<h5 class='card-title'>Special title treatment</h5>"+
        "<p class='card-text'>With supporting text below as a natural lead-in to additional content.</p>"+
        "<a href='#' class='btn btn-primary'>Go somewhere</a>"+
      "</div>"+
    "</div>"+
  "</div>"+
"</div>"

var Cam3ViewHTML = "<div class='row'>"+
  "<div class='col-sm-6'>"+
    "<div class='card'>"+
      "<div class='card-body'>"+
        "<h5 class='card-title'>Special title treatment</h5>"+
        "<p class='card-text'>With supporting text below as a natural lead-in to additional content.</p>"+
        "<a href='#' class='btn btn-primary'>Go somewhere</a>"+
      "</div>"+
   " </div>"+
  "</div>"+
  "<div class='col-sm-6'>"+
    "<div class='card'>"+
      "<div class='card-body'>"+
        "<h5 class='card-title'>Special title treatment</h5>"+
        "<p class='card-text'>With supporting text below as a natural lead-in to additional content.</p>"+
        "<a href='#' class='btn btn-primary'>Go somewhere</a>"+
      "</div>"+
    "</div>"+
  "</div>"+
"<div class='col-sm-6'>"+
    "<div class='card'>"+
      "<div class='card-body'>"+
        "<h5 class='card-title'>Special title treatment</h5>"+
        "<p class='card-text'>With supporting text below as a natural lead-in to additional content.</p>"+
        "<a href='#' class='btn btn-primary'>Go somewhere</a>"+
      "</div>"+
    "</div>"+
  "</div>"+
"</div>"

var Cards3HTML = "<div class='card-group'>"+
"<div class='card'>"+
"<div class='col-md-6 customBox videoBox' id='livefeed1'>"+

"</div>"+
  "<div class='card-body'>"+
    "<h5 class='card-title'>Card title</h5>"+
    "<p class='card-text'>This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>"+
    "<a href='#' class='btn btn-primary'>Go somewhere</a>"+
    "<p class='card-text'><small class='text-muted'>Last updated 3 mins ago</small></p>"+
  "</div>"+
"</div>"+
" <div class='card'>"+
"<div class='col-md-6 customBox videoBox' id='livefeed2'>"+

"</div>"+
  "<div class='card-body'>"+
    "<h5 class='card-title'>Card title</h5>"+
    "<p class='card-text'>This card has supporting text below as a natural lead-in to additional content.</p>"+
    "<p class='card-text'><small class='text-muted'>Last updated 3 mins ago</small></p>"+
  "</div>"+
"</div>"+
"<div class='card'>"+
"<div class='col-md-6 customBox videoBox' id='livefeed3'>"+

"</div>"+
  "<div class='card-body'>"+
    "<h5 class='card-title'>Card title</h5>"+
    "<p class='card-text'>This is a wider card with supporting text below as a natural lead-in to additional content. This card has even longer content than the first to show that equal height action.</p>"+
    "<p class='card-text'><small class='text-muted'>Last updated 3 mins ago</small></p>"+
  "</div>"+
"</div>"+
"</div>"
var caraouselHTML = "<div class='card' style='width: 18rem;'>"+
"<img id='liveVideo' style='width:200px;height:200px' src='http://192.168.196.113:8081/'></img>"+
"<div class='card-body'>"+
  "<p class='card-text'>Some quick example text to build on the card title and make up the bulk of the card's content.</p>"+
"</div>"+
"</div>"

var grid = `
<div class='container'>
  <div class='row justify-content-md-center'>
    <div class='col col-4'>
      <div class='card border-dark mb-4' style='max-width: 100%;'>
        <div class='card-header actionHeader'>Cameras</div>
        <div class='card-body text-dark'>
          <input class='form-control' id='filterCameras' type='text' placeholder='Search..'></input>
          <div class='list-group' id='cameraListItems' role='tablist'>
          </div>
        </div>
      </div>
      </div>
    <div class='col-5'>
      <div id='map'>
      </div>
    </div>
    <div class='col col-2'>
    <div class='card border-dark mb-4' style='max-width: 100%;'>
    <div class='card-header actionHeader'>Camera Info</div>
      <div class='card-body text-dark'>
      <div class='container'>
<canvas id='myChart' width='400' height='400'></canvas>
</div>
    </div>
    </div>
    </div>
  </div>
  <br>
  <div class='row'>
    <div class='col-lg-3'>
    <div class='card border-dark mb-3' style='max-width: 90%;'>
    <div class='card-header actionHeader'>Calendar</div>
    ${calendarHTML}
    </div>
    </div>
  <div class='col-6 col-md-3 customBox'>
    <div class='card border-dark mb-3' style='max-width: 100%;'>
        <div class='card-header actionHeader'>Videos by Date</div>
        <div class='card-body text-dark cardVIdeosDate'>
        <form>
        <div class='mb-3'>
        <select class='form-select form-select-lg' aria-label='Default select example'>
          <option selected>Start Time</option>
          <option value='1'>One</option>
          <option value='2'>Two</option>
          <option value='3'>Three</option>
        </select>
        <select class='form-select form-select-lg' aria-label='Default select example'>
          <option selected>End Time</option>
          <option value='1'>One</option>
          <option value='2'>Two</option>
          <option value='3'>Three</option>
        </select>
        </div>
        </form>
          <input class='form-control' id='filterVideos' type='text' placeholder='Search..'></input>
          <ul class='list-group list-group-flush' id='videoDates'>
          </ul>
        </div>
      </div>
    </div>" 
  <div class='col col-lg' id='vidoeCOntainer'>
    <video controls='controls' autoplay width='320' height='240' id='video' >
    </video>
    <video controls='controls' autoplay width='320' height='240' id='video2' >
    </video>
    <video controls='controls' autoplay width='320' height='240' id='video3' >
    </video>
  </div>
</div>
`

var grid2 = "<div class='container'>"+
  "<div class='row'>"+
    "<div class='col'>"+
    "<div id='map'>"+
    "</div>"+
    "</div>"+
    "<div class='col'>"+
    calendarHTML+
    "</div>"+
  "</div>"+

"<div class='row videoFeeds'>"+
"</div>"+
"<button type='button'id='modalbtn'>Launch modal</button>"+

"<div class='modal' id='myModal'>"+
  "<div class='modal-dialog modal-lg'>"+
    "<div class='modal-content'>"+
      "<div class='modal-header'>"+
        "<h5 class='modal-title'>Video Player</h5>"+
        "<button type='button' class='close' data-dismiss='modal' aria-label='Close'>"+
            "<span aria-hidden='true'>&times;</span>"+
        "</button>"+
      "</div>"+
      "<div class='row'>"+
    "<div class='col-6'>"+
    "<div class='card' style='width: 50%;'>"+
        "<div class='card-body'>"+
          "<div class='container'>"+
          "<canvas id='myChart' width='400' height='400'></canvas>"+
          "</div>"+
        "</div>"+
      "</div>"+
    
    "</div>"+
    "<div class='col-6'>"+
    "<video controls='controls' id='myVideo' >"+

   "</video>"+
    
    "</div>"+

  "</div>"+
"</div>"+
      
    "</div>"+
  "</div>"+
"</div>"


var html = "<div class='container'>"+
"<div class='row'>"+

  "</div>"+
  "<div class='col-sm'>"+
  "<div class='col' id='liveFeeds'>"+
  "</div>"+
  "</div>"+
  "<div class='col' id='liveFeeds2'>"+
    "One of three columns"+
  "</div>"+
"</div>"+
"</div>"+
"  "
var mainLayOutHTML = "<div class='container mainContainer'>"+
                        "<div class='row'>"+
                          "<div class='col-5 col-md-5 customBox topRow'><h1>Shreveport LA Crime Camera</h1></div>"+
                          "<div class='col-5 col-md-6 customBox  topRow'>Shreveport LA Crime Camera</div>"+
                        "</div>"+
                        "<div class='row'>"+
                          "<div class='col-md-8 customBox videoBox'>"+
                            "<img id='liveVideo' src='http://192.168.196.75:8081/'></img>"+
                          "</div>"+
                          "<div class='col-6 col-md-3 customBox videoSide'>"+
                            "<h4>Sound Levels</h4>"+
                            "<canvas id='soundLevel'></canvas>"+
                              "<div class='customBox videoInSide'>"+
                                "<div class='card border-dark mb-3' style='max-width: 100%;'>"+
                                  "<div class='card-header actionHeader'>Controls</div>"+
                                  "<div class='card-body text-dark'>"+
                                  "<form>"+
                                    "<div class='form-group'>"+
                                      "<label for='formControlRange'>Movement Speed</label>"+
                                      "<input type='range' class='form-control-range' id='panSpeed' value=4 min=0 max=8>"+
                                    "</div>"+
                                  "</form>"+
                                    "<div class='container'>"+
                                      "<div class='row'>"+
                                        "<div class='col-sm'>"+
                                        "</div>"+
                                        "<div class='col-sm'>"+
                                          "<button type='button' class='btn btn-secondary up'> Up </button>"+
                                        "</div>"+
                                        "<div class='col-sm'>"+
                                        "</div>"+
                                      "</div>"+
                                      "<div class='row'>"+
                                        "<div class='col-sm'>"+
                                          "<button type='button' class='btn btn-secondary left'>Left</button>"+
                                        "</div>"+
                                        "<div class='col-sm'></div>"+
                                        "<div class='col-sm'>"+
                                          "<button type='button' class='btn btn-secondary right'>Right</button>"+
                                        "</div>"+
                                      "</div>"+
                                      "<div class='row'>"+
                                        "<div class='col-sm'>"+
                                        "</div>"+
                                        "<div class='col-sm'>"+
                                          "<button type='button' class='btn btn-secondary down' >Down</button>"+
                                        "</div>"+
                                        "<div class='col-sm'>"+
                                        "</div>"+
                                      "</div>"+
                                    "</div>"+
                                  "</div>"+   
                                      "<div class='card-footer'>"+
                                        "<div class='container'>"+
                                          "<div class='row'>"+
                                            "<div class='col'>"+
                                              "<h5>Zoom</h5>"+
                                              "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                                                "<button type='button' class='btn btn-primary btn-sm zoomout'>Out\</button>"+
                                                "<button type='button' class='btn btn-danger btn-sm zoomin'>IN</button>"+
                                              "</div>"+
                                            "</div>"+
                                            "<div class='col'>"+
                                              "<h5>Recording</h5>"+
                                              "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                                                "<button type='button' class='btn btn-primary btn-sm recordon'>Start</button>"+
                                                "<button type='button' class='btn btn-danger btn-sm recordoff'>Stop</button>"+
                                              "</div>"+
                                            "</div>"+
                                            "<div class='col'>"+
                                            "<h5>Tour</h5>"+
                                            "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                                              "<button type='button' class='btn btn-primary btn-sm startTour'>Start</button>"+
                                              "<button type='button' class='btn btn-danger btn-sm stopTour'>Stop</button>"+
                                            "</div>"+
                                            "</div>"+
                                            "<div class='col'>"+
                                            "<h5>Scanning</h5>"+
                                            "<div class='btn-group btn-group-sm' role='group' aria-label='...'>"+
                                                  "<button type='button' class='btn btn-primary btn-sm scanon'>Start</button>"+
                                                  "<button type='button' class='btn btn-danger btn-sm scanoff'>Stop</button>"+
                                              "</div>"+
                                            "</div>"+
                                          "</div>"+
                                        "</div>"+
                                      "</div>"+
                                      "</div>"+
                                "</div>"+
                            "</div>"+
                        "</div>"+
                        "<div class='row'>"+
                          "<div class='col-6 col-md-4 customBox'>"+
                          "<div class='card border-dark mb-4' style='max-width: 100%;'>"+
                                "<div class='card-header actionHeader'>Videos by Date</div>"+
                                "<div class='card-body text-dark cardVIdeosDate'>"+ 
                                "<input class='form-control' id='filterVideos' type='text' placeholder='Search..'></input>"+
                                  "<ul class='list-group list-group-flush' id='videoDates'>"+
                                  "</ul>"+
                                "</div>"+
                              "</div>"+
                          "</div>"+
                          "<div class='col-6 col-md-4 customBox'>"+ 
                              "<div class='card border-dark mb-4' style='max-width: 100%;'>"+
                                "<div class='card-header actionHeader'>Video Info</div>"+
                                "<div class='card-body text-dark'>"+ 
                                "<ul class='list-group list-group' id='videoInfo'>"+
                                  "</ul>"+
                                "</div>"+
                              "</div>"+
                            "</div>"+
                          "<div class='col-6 col-md-3 customBox'>"+
                            "<div class='card border-dark mb-3' style='max-width: 100%;'>"+
                              "<div class='card-header actionHeader'>Presets</div>"+
                              "<div class='card-body text-dark'>"+
                                "<div class='container'>"+
                                  "<div class='row'>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos1 presetButton' >1</button>"+
                                    "</div>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos2 presetButton '>2</button>"+
                                    "</div>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos3 presetButton'>3</button>"+
                                    "</div>"+
                                  "</div>"+
                                  "<div class='row'>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos4 presetButton'>4</button>"+
                                    "</div>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos5 presetButton'>5</button>"+
                                    "</div>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos6 presetButton'>6</button>"+
                                    "</div>"+
                                  "</div>"+
                                  "<div class='row'>"+
                                    "<div class='col-sm'>"+ 
                                      "<button type='button' class='btn btn-secondary pos7 presetButton'>7</button>"+
                                    "</div>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos8 presetButton'>8</button>"+
                                    "</div>"+
                                    "<div class='col-sm'>"+
                                      "<button type='button' class='btn btn-secondary pos9 presetButton'>9</button>"+
                                    "</div>"+
                                  "</div>"+
                                "</div>"+            
                              "</div>"+
                            "</div>"+
                          "</div>"+
                        "</div>"+
                      "</div>"


const myLatLng = { lat: 38.926908833333336, lng: -77.69556366666667 }
myLatlng = new google.maps.LatLng(38.926415, -77.704038);

$(function() {
    $('#mainDIV').html(grid)


    var video = document.getElementById('video');
    var video2 = document.getElementById('video2');
    var video3 = document.getElementById('video3');
  var videoSrc = '/liveStream/index.m3u8';
  var videoSrc2 = '/liveStream/index2.m3u8';
  var videoSrc3 = '/liveStream/index3.m3u8';
  if (Hls.isSupported()) {
    var hls = new Hls();
    var hls2 = new Hls();
    var hls3 = new Hls();
    hls.loadSource(videoSrc);
    hls.attachMedia(video);

    hls2.loadSource(videoSrc2);
    hls2.attachMedia(video2);

    hls3.loadSource(videoSrc3);
    hls3.attachMedia(video3);
  }
  // hls.js is not supported on platforms that do not have Media Source
  // Extensions (MSE) enabled.
  //
  // When the browser has built-in HLS support (check using `canPlayType`),
  // we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video
  // element through the `src` property. This is using the built-in support
  // of the plain video element, without using hls.js.
  //
  // Note: it would be more normal to wait on the 'canplay' event below however
  // on Safari (where you are most likely to find built-in HLS support) the
  // video.src URL must be on the user-driven white-list before a 'canplay'
  // event will be emitted; the last video event that can be reliably
  // listened-for when the URL is not on the white-list is 'loadedmetadata'.
  else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = videoSrc;
  }
    var myModal = document.getElementById('myModal')
    $('body').on('click', '#modalbtn', function () {
      $('#myModal').modal('show');
    });
    var myLatLng = { lat: 38.926415, lng: -77.704038 };
    var myLatLng2 = { lat: 38.92987, lng: -77.708098 };
    myLatlng2 = new google.maps.LatLng(38.92987, -77.708098 );
    myLatlng = new google.maps.LatLng(38.926415, -77.704038 );
    var myLatLng3 = { lat: 38.926415, lng: -77.712076 };
    myLatlng3 = new google.maps.LatLng(38.85216, -77.702076 );
    var myLatLng4 = { lat: 38.926415, lng: -77.732076 };
    myLatlng4 = new google.maps.LatLng(38.85216, -77.732076 );
    map = new google.maps.Map(document.getElementById("map"), {
        center: {
          lat: 38.926908833333336,
          lng: -77.69556366666667
        },
        zoom:14
      });
      infoWindow = new google.maps.InfoWindow(); // Try HTML5 geolocation.
      var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
      
      
      function createMarker(pos, t, v,i,type,numCams) {

        console.log(pos, t, v,i,type,numCams)
        var marker = new google.maps.Marker({       
            position: pos, 
            map: map,  // google.maps.Map 
            customInfo: t,
            sysType: type,
            cams:numCams,
            videoURL: v,
            icon: i
                 
        });
        google.maps.event.addListener(marker, 'click', function() { 
          $('.videoFeeds').html("")
          $( "li" ).each(function( index ) {
            $( this ).css('background', 'white')
          })
          var cameraVideoURL = "http://192.168.196.123:3001/cameras/videoDatesbyNode/"+marker.customInfo
          nodeID=marker.customInfo
          $.getJSON(cameraVideoURL, function(data) {
            console.log(data)
            for(var i=0;i<data.length;i++){
              var dateCalendar = moment(data[i].DateTime).format('M/DD/YYYY')
              console.log(moment(data[i].DateTime).format('M/DD/YYYY hh:mm'))
              
              
              //$(searchparam).css('background', 'lightblue');
              
              $( "li" ).each(function( index ) {
                
                if($( this ).attr('data-date')===dateCalendar){
                  
                  $( this ).css('background', 'lightblue')

                }
              });
              
              
            };
          })
          console.log(marker.cams)
          if(marker.cams===3){
            var URL1 = "<img id='liveVideo' style='height:400px;width:490px' src='http://"+ marker.videoURL  +":8081/'></img>"
            var URL2 = "<img id='liveVideo2' style='height:400px;width:490px' src='http://"+ marker.videoURL  +":8082/'></img>"
            var URL3 = "<img id='liveVideo3' style='height:400px;width:490px' src='http://"+ marker.videoURL  +":8083/'></img>"
            
            $('.videoFeeds').html(Cards3HTML)
            $('#livefeed1').html(URL1)
            $('#livefeed2').html(URL2)
            $('#livefeed3').html(URL3)
          }
          if(marker.sysType==='PTZ'){
            var URL1 = "<img id='liveVideo' style='height:400px;width:490px' src='http://"+ marker.videoURL  +":8081/'></img>"
            
            
            $('.videoFeeds').html(PTZCamHTML)
            $('#PTZVideoFeed').html(URL1)
            $("#panSpeed").change(function(){ 
      
              panspeed = $("#panSpeed").val()
              dreamHost.emit('panSpeed',panspeed)
            });
            
            
                  $( ".up" ).mousedown(function() {
                    dreamHost.emit('Cameraaction','up')
                    console.log("UP")
                      
                  });
                  $( ".up" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','upStop')
                   
                     
                  });
            
            
                  $( ".down" ).mousedown(function() {
                    dreamHost.emit('Cameraaction','down')
                  });
                  $( ".down" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','downStop')
                  });
                  $( ".left" ).mousedown(function() {
                    dreamHost.emit('Cameraaction','left')
                  });
                  $( ".left" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','leftStop')
                  });
                  $( ".right" ).mousedown(function() {
                    dreamHost.emit('Cameraaction','right')
                  });
                  $( ".right" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','rightStop')
                  });
                  $( ".pos1" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','pos1')
                  });
                  $( ".pos2" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','pos2')
                  });
                  $( ".pos3" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','pos3')
                  });
                  $( ".pos4" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','pos4')
                  });
                  $( ".pos5" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','pos5')
                  });
                  $( ".startTour" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','startTour')
                  });
                  $( ".zoomin" ).mousedown(function() {
                    dreamHost.emit('Cameraaction','zoomIN')
                  });
            
                  $( ".zoomout" ).mousedown(function() {
                    dreamHost.emit('Cameraaction','zoomOUT')
                  });
            
                  $( ".zoomin" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','zoomINStop')
                  });
            
                  $( ".zoomout" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','zoomOUTStop')
                  });
                  $( ".scanon" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','scanON')
                  });
                  $( ".scanoff" ).mouseup(function() {
                    dreamHost.emit('Cameraaction','scanOff')
                  });
                  $( ".recordon" ).mousedown(function() {
                    dreamHost.emit('recording','start')
                  });
                  $( ".recordoff" ).mousedown(function() {
                    dreamHost.emit('recording','stop')
                    dreamHost.emit('getVideos','start')
                  });
          }
           if(marker.customInfo!='m1'){
            $('#liveFeed2').html('')
            $('#liveFeed3').html('')
            $('#liveFeed1').html(marker.videoURL)
             }
        return marker;      
    }) 
      }
      
  var videoFiles = []

  $.getJSON('http://192.168.196.123:3001/cameras/currentcameraList', function(data) {
    console.log(data)
    var lihtmlCameras = ""


        
      for(var i=0;i<data.length;i++){
        var checkedinTime = moment(data[i].lastCheckIn).format("MM-DD hh:mm")
        
        $('#cameraListItems').append("<a href='#' class='list-group-item list-group-item-action' aria-current='true' id='"+ data[i].nodeName +"'>"+
                                      "<div class='d-flex w-100 justify-content-between'>"+
                                      "<h5 class='mb-1'>"+ data[i].nodeName +"</h5>"+
                                      "<small class='text-muted'>"+ checkedinTime  +"</small>"+
                                    "</div>"+
                                    "<p class='text-muted'>Cameras: "+ data[i].numOfCams +"</p>"+
                                    "<div class='d-flex w-100 justify-content-between'>"+
                                    "<p class='text-muted'>Camera Type: "+ data[i].systemType +"</p>"+
                                    "<small class='text-muted'>IP: "+  data[i].ip  +"</small>"+
                                    "</div>"+
                                    "</a")
     
        
        
        
        $("#filterCameras").on("keyup", function() {
          var value = $(this).val().toLowerCase();
          console.log(value)
          $("#camTable tr").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
          });
        });




        $(".list-group-item").on("click", function() {
         
          //$('#myModal').modal('show');
     

          var ctx = document.getElementById('myChart');
 
          var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                    label: '# of Votes',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
            console.log(this.id);
            ///////
            $.getJSON("http://192.168.196.123:3001/cameras/getCameraInfo/"+this.id, function(data) {
             
            console.log(data)
            
            
            })
         
        });
      };
      
      
    
    for(var i=0;i<data.length;i++){
      
      
      createMarker(new google.maps.LatLng(data[i].location.lat, data[i].location.lng), data[i].nodeName, data[i].ip , 'http://maps.google.com/mapfiles/kml/pal4/icon38.png', data[i].systemType, data[i].numOfCams)
      
    };
    
  })
  
  
  
  
  
   /*  marker.addListener("click", () => {
        map.setZoom(16);
        map.setCenter(marker.getPosition());
        $('#liveFeeds').html("<img id='liveVideo' style='height:400px;width:640px' src='http://192.168.196.89:8081/'></img>")
        cameraNode1.emit("getVideos","ja")
        cameraNode1.on('videoFiles', function(data){
        
          var string = data.format.filename.split("/")
          var fileName = string[6]
          var date = fileName.split(".")
          var cleanDate = date[0].split("_")
          var timeFormat = cleanDate[1].replaceAll("-",":")
          var dateFormatting = cleanDate[0].split("-")
          //console.log(dateFormatting[1])
          
          var newDaterFormat = dateFormatting[0] +"-"+dateFormatting[1]+"-"+dateFormatting[2]+" "+timeFormat
          videoFiles.push({"fileLocation": data.format.filename, "dateUTC": moment(newDaterFormat).format("X")})
          //var dateforMoment = moment(newDaterFormat).format("X")
          
          
          
    });
  })
  */
 
    cameraNode1.on('videoFileDataDone', function(data){
      videoFiles.sort(function(a, b){return a.dateUTC - b.dateUTC});
      console.log(videoFiles)
  
  
  
    })
    $('ul').on('click','li', function(e) {
      console.log($(this)[0].id);
      //dreamHost.emit('downloadFile', $(this)[0].id)
    });




///////////// Calendar Stuff
class Calendar {
  /**
   * @constructor
   * @param {string} container - represents calendar container DOM query
   * @param {string} activeDateClass - represents custom class for selected date
   * @param {Date} initialDate - represents initially selected calendar date
   */
  constructor({ container = '',
                activeDateClass = '',
                initialDate = new Date() } = {}) {
    this.$container = container ? document.querySelector(container) : null;
    this.activeDateClass = activeDateClass;

    this.selectedDate = initialDate;
    this.currentMonth = initialDate;
    this.currentMonthDays = [];

    // Months human readable names, to be used inside
    // getFormattedDate() function
    this.monthsNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    // initizlize markup and bootstrap application events
    this.generateMarkup();
    this.bootstrapEvents();
  }

  /**
   * Generate selected month visible dates
   * @function buildCurrentMonthDays
   */
  buildCurrentMonthDays() {
    var curYear = this.currentMonth.getFullYear(),
        curMonth = this.currentMonth.getMonth(),
        firstMonthDay = new Date(curYear, curMonth, 1),
        lastMonthDay = new Date(curYear, curMonth + 1, 0);

    // clear previously selected month generated days
    this.currentMonthDays = [];

    // push visible previous month days
    for (let i = -firstMonthDay.getUTCDay(); i < 0; i++) {
      this.currentMonthDays.push(new Date(curYear, curMonth, i));
    }

    // push current month days
    for (let i = 1, lastDay = lastMonthDay.getDate(); i <= lastDay; i++) {
      this.currentMonthDays.push(new Date(curYear, curMonth, i));
    }

    // push visible next month days
    for (let i = 1, daysAppend = 7 - lastMonthDay.getUTCDay(); i < daysAppend; i++) {
      this.currentMonthDays.push(new Date(curYear, curMonth + 1, i));
    }
  }

  /**
   * Generate 'days-list__item' element class
   * @function getDayClass
   * @return {string} - represents element class string
   */
  getDayClass(date) {
    var classes = ['wc-calendar__days-list__item'],
        curYear = this.currentMonth.getFullYear(),
        curMonth = this.currentMonth.getMonth(),
        firstMonthDay = new Date(curYear, curMonth, 1),
        lastMonthDay = new Date(curYear, curMonth + 1, 0);

    // if date is selectedDate
    if (date.toDateString() === this.selectedDate.toDateString()) {
      // add default and custom active classes
      classes = classes.concat(['wc-calendar__days-list__item--active', this.activeDateClass]);
    }
    // if date is from previous year
    if (date.getMonth() === 11 && this.currentMonth.getMonth() === 0) {
      // mark as previous month date
      classes.push('wc-calendar__days-list__item--prev-month');
    // if date is from next year
    } else if (date.getMonth() === 0 && this.currentMonth.getMonth() === 11) {
      // mark as next month date
      classes.push('wc-calendar__days-list__item--next-month');
    // if date is from previous month
    } else if (date.getMonth() < this.currentMonth.getMonth()) {
      classes.push('wc-calendar__days-list__item--prev-month');
    // if date is from next month
    } else if(date.getMonth() > this.currentMonth.getMonth()) {
      classes.push('wc-calendar__days-list__item--next-month');
    }

    // return element class string
    return classes.join(' ');
  }
  /**
   * Utility function for showing formatted date of type 'MonthName YYYY'
   * @function gerFormattedDate
   * @param {Date} date - represents date object which shall be formatted
   * @return {string} - represents formatted date
   */
  getFormattedDate(date) {
    return `${date.getFullYear()} ${this.monthsNames[date.getMonth()]}`;
  }
  /**
   * Generate HTML string markup for visible calendar dates
   * @function generateDaysMarkup
   * @return {string} - represents HTML markup for currently selected month days
   */
  generateDaysMarkup() {
    var days = [];
    // build month days list
    this.buildCurrentMonthDays();
    // generate markup for each month day
    this.currentMonthDays.forEach(function(day) {
      days.push(`<li data-date="${day.toLocaleDateString()}" class="${this.getDayClass(day)}">${day.getDate()}</li>`);
    }.bind(this));

    return days.join('');
  }
  /**
   * Refresh calendar view
   * @function refreshCalendar
   */
  refreshCalendar() {
    // refresh days-list
    this.$container.querySelector('.wc-calendar__days-list').innerHTML = this.generateDaysMarkup();
    // refresh calendar header date
    this.$container.querySelector('.wc-calendar__header__date').innerHTML = this.getFormattedDate(this.currentMonth);
  }
  /**
   * Switch calendar to previous month
   * @function prevMonth
   */
  prevMonth() {
    var curYear = this.currentMonth.getFullYear(),
        curMonth = this.currentMonth.getMonth();
    // set currentMonth to month before
    this.currentMonth = new Date(curYear, curMonth - 1, 1);
    // refresh calendar view
    this.refreshCalendar();
  }
  /**
   * Switch calendar to next month
   * @function nextMonth
   */
  nextMonth() {
    var curYear = this.currentMonth.getFullYear(),
        curMonth = this.currentMonth.getMonth();
    // set currentMonth to month after
    this.currentMonth = new Date(curYear, curMonth + 1, 1);
    // refresh calendar view
    this.refreshCalendar();
  }
  /**
   * Update calendar options
   * @function update
   * @param {string} [option='selectedDate'|'activeDateClass'] - name of option to be updated
   * @param {string} value - value of option to be updated
   */
  update(option, value) {
    if (option === 'selectedDate') {
      let date = new Date(value)

      if (!isNaN(date.getTime())) {
        this.selectedDate = new Date(value)
        this.currentMonth = this.selectedDate
      } else {
        throw new Error('Invalid date format')
      }
    } else if (option === 'activeDateClass') {
      this.activeDateClass = value
    }

    this.refreshCalendar()
  }
  /**
   * Select day. Used as event handler for day-list__item 'click'
   * @function selectDay
   * @prop {Object} event - represents 'click' event object
   */
  selectDay(event) {
    var $target = event.target;
    // Act only if 'day-list__item' was clicked
    if ($target.classList.contains('wc-calendar__days-list__item')) {
      let isPrevMonth = $target.classList.contains('wc-calendar__days-list__item--prev-month'),
          isNextMonth = $target.classList.contains('wc-calendar__days-list__item--next-month');
          
      this.selectedDate = new Date($target.dataset.date);
console.log( this.selectedDate)
var selectedDate = moment(this.selectedDate).format("YYYY-MM-DD")
var getIPString = "http://192.168.196.123:3001/cameras/getIP/"+nodeID
var getURLString = "http://192.168.196.123:3001/cameras/videosByDay/"+selectedDate+"/"+nodeID
var dailyVidsItemsLIcam1 = ""
var dailyVidsItemsLIcam2 = ""
var dailyVidsItemsLIcam3 = ""
var videoSource = []
var ip;
$.getJSON(getIPString, function(data) {
  ip = data[0].ip
console.log(data)


})
$(document).on('input', '#customRange3', function() {
  $('#customRange3_value').html( $(this).val() );
});




$.getJSON(getURLString, function(data) {
  console.log(data)
  $('#videoListGrid').html("")
  if(data.cam1.length>0){
    
    $('#videoListGrid').append("<div class='col-sm'>"+
                "<div id='videoPlayer1'></div>"+
                "<h3>Camera 1</h3>"+
                  "<ul class='list-group list-group-flush' id='ulCam1'>"+
                  "</ul>"+
              "</div>")

  for(var i=0;i<data.cam1.length;i++){
    try {
      var numItems = data.cam1.length -1
      var cleanedtimeStartFilter = moment(data.cam1[0].DateTime).format("HHmm")
      var cleanedEndtimeFilter = moment(data.cam1[numItems].DateTime).format("HHmm")
      
      
      var cleanedtime = moment(data.cam1[i].DateTime).format("HH:mm")
      var locationString = data.cam1[i].fileLocation
      var locationArray = locationString.split("/")
      
      var videourlLocation = "http://"+ip+":3000/"+ locationArray[5] +"/" +locationArray[6]+"/"+ locationArray[7]
      videoSource.push(videourlLocation)
      $('#videoDates').append("<li class='list-group-item' id='"+cleanedtime  +"'>"+cleanedtime+"</li>")
      //dailyVidsItemsLIcam1 += "<li class='list-group-item'>"+cleanedtime+"</li>"
    } catch (error) {
      console.log(error)
    }
  
    

  }
  }

  if(data.cam2.length>0){
    $('#videoListGrid').append("<div class='col-sm'>"+
                "<div id='videoPlayer2'></div>"+
                "<h3>Camera 2</h3>"+
                  "<ul class='list-group list-group-flush' id='ulCam2'>"+
                  "</ul>"+
              "</div>")
  for(var i=0;i<data.cam2.length;i++){

    try {
      var cleanedtime = moment(data.cam2[i].DateTime).format("HH:mm")
      $('#videoDates').append("<li class='list-group-item'>"+cleanedtime+"</li>")
      
    } catch (error) {
      console.log(error)
    }

  }
  

  }
  if(data.cam3.length>0){
    $('#videoListGrid').append("<div class='col-sm'>"+
    "<div id='videoPlayer3'></div>"+
    "<h3>Camera 3</h3>"+
      "<ul class='list-group list-group-flush' id='ulCam3'>"+
      "</ul>"+
  "</div>")
  for(var i=0;i<data.cam3.length;i++){
 
    try {
      var cleanedtime = moment(data.cam3[i].DateTime).format("HH:mm")
      $('#ulCam3').append("<li class='list-group-item'>"+cleanedtime+"</li>")
    } catch (error) {
      console.log(error)
    }
  
    
  }
  }



  $('#ulCam1').html(dailyVidsItemsLIcam1)

 

var i = 0; // define i

var videoCount = videoSource.length;


function videoPlay(videoNum) {
    document.getElementById("myVideo").setAttribute("src", videoSource[videoNum]);
    document.getElementById("myVideo").load();
    document.getElementById("myVideo").play();
}
document.getElementById('myVideo').addEventListener('ended', myHandler, false);
//videoPlay(0); // play the video

function myHandler() {
    i++;
    if (i == (videoCount - 1)) {
        i = 0;
        videoPlay(i);
    } else {
        videoPlay(i);
    }
}
})

      // if element represents date from either previous or next month
      if (isPrevMonth || isNextMonth) {
        // if previous month
        if (isPrevMonth) {
          // switch calendar to month before
          this.prevMonth();
        // if next
        } else {
          // switch calendar to month after
          this.nextMonth();
        }
        // select date element from currently rendered month
        $target = this.$container.querySelector(`[data-date="${this.selectedDate.toLocaleDateString()}"]`);
      // if element represents currently rendered month
      } else {
        let $activeItem = this.$container.querySelector('.wc-calendar__days-list__item--active');
        // if there already is element with active class
        if ($activeItem) {
          // remove active class from element
          $activeItem.classList.remove('wc-calendar__days-list__item--active');
          // if custom active class was specified - remove this class
          this.activeDateClass && $activeItem.classList.remove(this.activeDateClass);
        }
      }
      // add default and custom active classes to selected date element
      $target.classList.add('wc-calendar__days-list__item--active');
      this.activeDateClass && $target.classList.add(this.activeDateClass);
    }
  }
  /**
   * Generate initial calendar markup
   * @function generateMarkup
   */
  generateMarkup() {
    // if container query wasn't specified
    if (!this.$container) {
      // create new container element
      let fragment = document.createDocumentFragment(),
          calendarContainer = document.createElement('div');
      fragment.appendChild(calendarContainer);
      // append container to body
      document.body.appendChild(calendarContainer);
      // save new container reference
      this.$container = calendarContainer;
    }
    // add default class for container
    this.$container.classList.add('wc-calendar');
    // form calendar markup
    this.$container.innerHTML = `
<div class="wc-calendar__header">
  <button class="wc-calendar__btn wc-calendar__btn--prev">Prev</button>
  <div class="wc-calendar__header__date">${this.getFormattedDate(this.currentMonth)}</div>
  <button class="wc-calendar__btn wc-calendar__btn--next">Next</button>
</div>
<div class="wc-calendar__body">
  <ul class="wc-calendar__days-names">
    <li class="wc-calendar__days-names__item">Mon</li>
    <li class="wc-calendar__days-names__item">Tue</li>
    <li class="wc-calendar__days-names__item">Wed</li>
    <li class="wc-calendar__days-names__item">Thu</li>
    <li class="wc-calendar__days-names__item">Fri</li>
    <li class="wc-calendar__days-names__item">Sat</li>
    <li class="wc-calendar__days-names__item">Sun</li>
  </ul>
  <ul class="wc-calendar__days-list">
    ${this.generateDaysMarkup()}
  </ul>
</div>
`;
  }
  /**
   * Bootstrap calendar specific events
   * @function bootstrapEvents
   */
  bootstrapEvents() {
    // prev month button event handler
    this.$container.querySelector('.wc-calendar__btn--prev')
                .addEventListener('click', this.prevMonth.bind(this));
    // next month button event handler
    this.$container.querySelector('.wc-calendar__btn--next')
                .addEventListener('click', this.nextMonth.bind(this));
    // select day item delegated to days-list event handler
    this.$container.querySelector('.wc-calendar__days-list')
                .addEventListener('click', this.selectDay.bind(this));
  }
}

// Testing part. Contains calendar initialization and calendar testing form
// handler
var calendar = new Calendar({
  container: '.calendar'
});

function changeCalendarOptions(event) {
  event.preventDefault();

  var classValue = $('#class-input').value;
  var dateValue = $('#date-input').value;

  classValue.trim() && calendar.update('activeDateClass', classValue);
  dateValue.trim() && calendar.update('selectedDate', dateValue);
}




        







})
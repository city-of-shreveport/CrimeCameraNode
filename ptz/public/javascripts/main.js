var buttons = "<div class='container'>"+
  "<div class='row'>"+
    "<div class='col'>"+
        "<div class='container'>"+
           
            "<div class='btn-toolbar mb-3' role='toolbar' aria-label='Toolbar with button groups'>"+
            "<h4>Position</h4>"+
            "<div class='btn-group mr-2' role='group' aria-label='First group'>"+
              
            "</div>"+

        "</div>"+
    "</div>"+
    
  "</div>"+
"</div>"

var soundLEFT = 0;
var soundCENTER = 0;
var soundRIGHT = 0;
var soundBack = 0;
var soundLEFTDiff = 0;
var soundCENTERDiff = 0;
var soundRIGHTDiff = 0;
var soundBackDiff = 0;
var panspeed = 4;
const Http = new XMLHttpRequest();
var socket = io();
var mainServer = io('//192.168.196.89:3000/');
//
var mainLayOutHTML = "<div class='container mainContainer'>"+
                        "<div class='row'>"+
                          "<div class='col-5 col-md-5 customBox topRow'><h1>Shreveport LA Crime Camera</h1></div>"+
                          "<div class='col-5 col-md-6 customBox  topRow'>Shreveport LA Crime Camera</div>"+
                        "</div>"+
                        "<div class='row'>"+
                          "<div class='col-md-8 customBox videoBox'>"+
                            "<img id='liveVideo' src='http://192.168.196.89:8081/'></img>"+
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
                      "</div>"+
                      "<div class='modal'  id='myModal'>"+
  "<div class='modal-dialog modal-xl modal-dialog-centered'>"+
    "<div class='modal-content'>"+
      "<div class='modal-header'>"+
        "<h5 class='modal-title'>Video Player</h5>"+
        "<button type='button' class='close' data-dismiss='modal' aria-label='Close'>"+
          "<span aria-hidden='true'>&times;</span>"+
        "</button>"+
      "</div>"+
      "<div class='modal-body' id='videoPlayer'>"+
      "</div>"+
    "</div>"+
  "</div>"+
"</div>"+
 "</div>"
$(function() {
    $('#mainDIV').html(mainLayOutHTML)
    var ctx = document.getElementById('soundLevel').getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ['LEFT', 'CENTER', 'RIGHT', 'REAR'],
          datasets: [{
              label: 'Sound Level',
              data: [0, 0, 0, 0],
              backgroundColor: [
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
                  'rgba(54, 162, 235, 0.2)',
              ],
              borderColor: [
                  'rgba(54, 162, 235, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(54, 162, 235, 1)',
                  'rgba(54, 162, 235, 1)',
              ],
              borderWidth: 1
          }]
      },
      plugins: [{
        afterInit: function(chart, options) {
          mainServer.emit('status','sendData')
        }
    }],
    options: {
      legend: {
        display: false,
    },
    scales: {
      yAxes: [{
          ticks: {
              display: false,
              min: 200,
              max: 1024,
          }
      }]
    }
  }
    })
    function addData(chart, label, data) {
      myChart.data.datasets.forEach((dataset) => {
          dataset.data = data;
      });
      myChart.update();
    }
    $("#panSpeed").change(function(){ 
      panspeed = $("#panSpeed").val()
      mainServer.emit('panSpeed',panspeed)
  });
          $( ".up" ).mousedown(function() {
            mainServer.emit('Cameraaction','up')
            console.log("UP")
          });
          $( ".up" ).mouseup(function() {
            mainServer.emit('Cameraaction','upStop')
          });
          $( ".down" ).mousedown(function() {
            mainServer.emit('Cameraaction','down')
          });
          $( ".down" ).mouseup(function() {
            mainServer.emit('Cameraaction','downStop')
          });
          $( ".left" ).mousedown(function() {
            mainServer.emit('Cameraaction','left')
          });
          $( ".left" ).mouseup(function() {
            mainServer.emit('Cameraaction','leftStop')
          });
          $( ".right" ).mousedown(function() {
            mainServer.emit('Cameraaction','right')
          });
          $( ".right" ).mouseup(function() {
            mainServer.emit('Cameraaction','rightStop')
          });
          $( ".pos1" ).mouseup(function() {
            mainServer.emit('Cameraaction','pos1')
          });
          $( ".pos2" ).mouseup(function() {
            mainServer.emit('Cameraaction','pos2')
          });
          $( ".pos3" ).mouseup(function() {
            mainServer.emit('Cameraaction','pos3')
          });
          $( ".pos4" ).mouseup(function() {
            mainServer.emit('Cameraaction','pos4')
          });
          $( ".pos5" ).mouseup(function() {
            mainServer.emit('Cameraaction','pos5')
          });
          $( ".startTour" ).mouseup(function() {
            mainServer.emit('Cameraaction','startTour')
          });
          $( ".zoomin" ).mousedown(function() {
            mainServer.emit('Cameraaction','zoomIN')
          });
          $( ".zoomout" ).mousedown(function() {
            mainServer.emit('Cameraaction','zoomOUT')
          });
          $( ".zoomin" ).mouseup(function() {
            mainServer.emit('Cameraaction','zoomINStop')
          });
          $( ".zoomout" ).mouseup(function() {
            mainServer.emit('Cameraaction','zoomOUTStop')
          });
          $( ".scanon" ).mouseup(function() {
            mainServer.emit('Cameraaction','scanON')
          });
          $( ".scanoff" ).mouseup(function() {
            mainServer.emit('Cameraaction','scanOff')
          });
          $( ".recordon" ).mousedown(function() {
            mainServer.emit('recording','start')
          });
          $( ".recordoff" ).mousedown(function() {
            mainServer.emit('recording','stop')
            mainServer.emit('getVideos','start')
          });
         //  io.on("connection", function(socket) {
          setInterval(() => {
            mainServer.emit('getVideos','start')
          }, 30000);
         mainServer.on('audioLevels', function(data) {
           console.log(data)
           soundLEFTDiff = soundLEFT - data[0] ;
           soundCENTERDiff = soundCENTER - data[1];
           soundRIGHTDiff = soundRIGHT - data[2];
           soundBackDiff = soundBack - data[3];
           /*if(soundLEFTDiff < 0){
            soundLEFTDiff = 0;
          }
           if(soundCENTERDiff<0){
            soundCENTERDiff = 0;
          }
           if(soundRIGHTDiff<0){
            soundRIGHTDiff = 0;
          }
          if(soundBackDiff<0){
            soundBackDiff = 0;
          }*/
              soundLEFT = data[0];
              soundCENTER = data[1];
              soundRIGHT = data[2];
              soundBack = data[3]
              var dataDiff = [soundLEFT,soundCENTER,soundRIGHT, soundBack]
          var label = ['LEFT','CENTER','RIGHT', 'REAR']
          addData('myChart', label, dataDiff)
         })
 var clickedVideo        
         $("#filterVideos").on("keyup", function() {
          var value = $(this).val().toLowerCase();
          $("#videoDates li").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
          });
        });
        mainServer.on('videoFile', function(data){
          $('#videoDates').html("")
              console.log(data)
              for(i=0;i<data.length;i++){
                var li = "<li class='list-group-item' value='"+ data[i]  +"'>"+ data[i] +"</li>"
                $('#videoDates').append(li)
              }
              $("li").click(function ()
              {       
              var a = $(this).attr("value");
              clickedVideo = a
              console.log(a);//here the clicked value is showing in the console
              mainServer.emit('getVideoInfo',a)
              });
        })
        mainServer.emit('getVideos','start')
        mainServer.on('videoInfo', function(data){
          var li = ""
          console.log(data)
          console.log(data.streams[0].height)
            console.log(data.streams[0].width)
              console.log(data.format.duration)
                console.log(data.format.size)
                li += "<li class='list-group-item' value='"+ data.streams[0].width  +"'>Width: "+ data.streams[0].width +"</li>"
                li += "<li class='list-group-item' value='"+ data.streams[0].height  +"'>Height: "+ data.streams[0].height +"</li>"
                li += "<li class='list-group-item' value='"+ data.format.duration  +"'>Length: "+ data.format.duration +" Seconds</li>"
                li += "<li class='list-group-item' value='"+ data.format.size  +"'>Size: "+ data.format.size +" Bytes</li>"
                $('#videoInfo').html(li)
                $('#videoPlayer').html("<video width='1024' height='600' controls>"+
                        "<source src='http://192.168.196.113:3000/videos/" +clickedVideo + "' type='video/mp4'>"+
                            "Your browser does not support the video tag."+
                          "</video>")
                          $('#myModal').modal('toggle')
        })
    })
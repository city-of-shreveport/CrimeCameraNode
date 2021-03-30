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
var soundLEFTDiff = 0;
var soundCENTERDiff = 0;
var soundRIGHTDiff = 0;
var panspeed = 4;
const Http = new XMLHttpRequest();
var socket = io();
var mainServer = io('//192.168.196.164:3000/');






var mainLayOutHTML = "<div class='container mainContainer'>"+
                        "<div class='row'>"+
                          "<div class='col-15 col-md-15 customBox topRow'><h1>Shreveport LA Crime Camera</h1></div>"+
          
                        "</div>"+
                        "<div class='row'>"+
                          "<div class='col-md-6 customBox videoBox'>"+
                            "<canvas id='canvas'></canvas>"+
                          "</div>"+
                          "<div class='col-md-6 customBox videoBox'>"+
                          "<canvas id='canvas2'></canvas>"+
                          "</div>"+
                          "<div class='col-md-6 customBox videoBox'>"+
                          "<canvas id='canvas3'></canvas>"+
                        "</div>"+
                        "</div>"+
                        "<div class='row vidData'>"+
                          "<div class='col-12 col-md-4 customBox'>"+
                          "<div class='card border-dark mb-4' style='max-width: 100%;'>"+
                                "<div class='card-header actionHeader'>Videos by Date</div>"+
                                "<div class='card-body text-dark cardVIdeosDate'>"+ 
                                "<input class='form-control' id='filterVideos' type='text' placeholder='Search..'></input>"+
                                  "<ul class='list-group list-group-flush' id='videoDates'>"+
                                    
                                   
                                  "</ul>"+


                                  


                                "</div>"+
                              "</div>"+
                          "</div>"+


                          "<div class='col-12 col-md-4 customBox'>"+ 
                              "<div class='card border-dark mb-4' style='max-width: 100%;'>"+
                                "<div class='card-header actionHeader'>Video Info</div>"+
                                "<div class='card-body text-dark'>"+ 
                                "<ul class='list-group list-group' id='videoInfo'>"+
                                    
                                   
                                  "</ul>"+
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

/*

*/



$(function() {

 
  


    $('#mainDIV').html(mainLayOutHTML)
    //$('#mainDIV').html("<img id='canvas' src='http://192.168.196.75:8081/' width='1000' height='600'></img>")
   
    //document.body.style.backgroundImage = "url('http://192.168.196.75:8081/')";
   
         //  io.on("connection", function(socket) {
          setInterval(() => {
           // mainServer.emit('getVideos','start')
          }, 30000);
         
          
            

          

      
 var clickedVideo        
         $("#filterVideos").on("keyup", function() {
          var value = $(this).val().toLowerCase();
          $("#videoDates li").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
          });
        });
        mainServer.on('videoFiles', function(data){
          $('#videoDates').html("")
              //console.log(data)
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
                        "<source src='https://192.168.196.164:3000/videos/" +clickedVideo + "' type='video/mp4'>"+
 
                            "Your browser does not support the video tag."+
                          "</video>")
                          $('#myModal').modal('toggle')

        })
        //<a href="myfile.pdf" download=" myfile.pdf">Click to Download</a>
        player = new JSMpeg.Player('ws://192.168.196.12:9999', {
            canvas: document.getElementById('canvas') // Canvas should be a canvas DOM element
          })	
          player2 = new JSMpeg.Player('ws://192.168.196.12:9998', {
            canvas: document.getElementById('canvas2') // Canvas should be a canvas DOM element
          })
          player3 = new JSMpeg.Player('ws://192.168.196.12:9997', {
            canvas: document.getElementById('canvas3') // Canvas should be a canvas DOM element
          })	 
    })
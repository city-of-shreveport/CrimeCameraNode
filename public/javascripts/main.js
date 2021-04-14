
var socket = io();
var cameraPi = io('//192.168.86.22:3000/');

var camForm = `
<div class="card text-center">
  <div class="card-header">
    Crime Camera Setup
  </div>
  <div class="card-body">
    <h5 class="card-title"></h5>
    <div class="row">
      <div class="col-sm-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">System Settings</h5>
            <div class="row">
              <div class="col">
                <input type="text" class="form-control" placeholder="Host Name" aria-label="Host Name">
              </div>
              <div class="col">
                <input type="text" class="form-control" placeholder="Host IP" aria-label="IP">
              </div>
            </div>
            </br>
            <div class="row g-3">
              <div class="col">
                <input type="text" class="form-control" placeholder="Location LAT" aria-label="GPS LAT">
              </div>
              <div class="col">
                <input type="text" class="form-control" placeholder="Location LON" aria-label="GPS LON">
              </div>
            </div>
            </br>
            <div class="col">
              <select class="form-select form-select-lg mb-3" aria-label="Video Drive">
                <option selected>Choose Videro Storage Drive</option>
                <option value="1">sda1</option>
                <option value="2">sba1</option>
                <option value="3">sda1</option>
              </select>
            </div>
            </br> 
            <div class="col">
              <input type="text" class="form-control" placeholder="Zero Tier Network ID" aria-label="ZeroTier">
            </div>
            <div class="col">
              <input type="text" class="form-control" placeholder="Server IP" aria-label="serverIP">
            </div>
     
            <div class="col">
              <input type="text" class="form-control" placeholder="Number of Cameras" aria-label="numOfCams">
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Camera Settings</h5>
            <div class="container">
              <div class="row">
                <div class="col-sm">
                  <div class="card" style="width: 14rem;">
                    <div id='video1'>
                      <video width=240' height='auto'  controls autoplay>
                        <source src='' type='video/mp4'>
                        "Your browser does not support the video tag.
                      </video>
                    </div>
                    <div class="card-body">
                      <h5 class="card-title">Camera 1</h5>
                    </div>
                  </div>
                </div>
                <div class="col-sm">
                  <div class="card" style="width: 14rem;">
                    <div id='video2'>
                      <video width=240' height='auto'  controls autoplay>
                        <source src='' type='video/mp4'>
                        "Your browser does not support the video tag.
                      </video>
                    </div>
                    <div class="card-body">
                      <h5 class="card-title">Camera 2</h5>
                    </div>
                  </div>
                </div>
                <div class="col-sm">
                  <div class="card" style="width: 14rem;">
                    <div id='video3'>
                      <video width=240' height='auto'  controls autoplay>
                        <source src='' type='video/mp4'>
                        "Your browser does not support the video tag.
                      </video>
                    </div>
                    <div class="card-body">
                      <h5 class="card-title">Camera 3</h5>
                      <form>
                        <div class="mb-3">
                          <select class="form-select" aria-label="Default select example">
                              <option selected>IP address</option>
                              <option value="1">10.10.5.2</option>
                              <option value="2">10.10.5.3</option>
                              <option value="3">10.10.5.4</option>
                          </select>
                        </div>
                        </br>
                        <div class="mb-3">
                          <select class="form-select" aria-label="cameraType">
                              <option selected>Choose Type of Cam</option>
                              <option value="1">PTZ</option>
                              <option value="2">Stationary</option>
                          </select>
                        </div>
                        <div class="mb-3">
                          <label for="formGroupExampleInput2" class="form-label">Direction</label>
                          <input type="number" class="form-control" id="formGroupExampleInput2" placeholder="">
                        </div>
                        <div class="mb-3">
                          <label for="exampleInputPassword1" class="form-label">User Name</label>
                          <input type="password" class="form-control" id="exampleInputPassword1">
                        </div>
                        <div class="mb-3">
                          <label for="exampleInputPassword1" class="form-label">Password</label>
                          <input type="password" class="form-control" id="exampleInputPassword1">
                        </div>
                      </form>  
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`

$(function() {
    $('#mainDIV').html(camForm)
})
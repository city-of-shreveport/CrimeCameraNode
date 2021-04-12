const Stream = require('./node-rtsp-stream');
const streamUrl = 'rtsp://admin:UUnv9njxg123@10.10.5.2:554/cam/realmonitor?channel=1&subtype=0';

stream = new Stream({
  name: 'foscam_stream',
  streamUrl: streamUrl,
  wsPort: 9999,
  width: 1280,
  height: 720
});

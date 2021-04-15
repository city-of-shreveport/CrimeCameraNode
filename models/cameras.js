const mongoose = require('mongoose');
const schema = mongoose.Schema({
  nodeName: String,
  id: String,
  location: {
    lat: Number,
    lng: Number,
  },
  ip: String,
  numOfCams: Number,
  lastCheckIn: Date,
  cameras: [
    {
      ip: String,
      direction: Number,
      username: String,
      password: String,
      camType: String,
    },
  ],
  sysInfo: {
    memLayout: [
      {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    ],
    fsSize: [
      {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    ],
    diskLayout: [
      {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    ],
    cpu: { type: Map, of: mongoose.Schema.Types.Mixed },
    osInfo: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
});

module.exports = mongoose.model('Cameras', schema);

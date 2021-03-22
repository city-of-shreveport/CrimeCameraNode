
//
const mongoose = require("mongoose")
const schema = mongoose.Schema({
    'nodeName':String,
    'id': String,
    'location':{'lat': Number, 'lng': Number},
    'ip': String,
    'numOfCams': Number,
    'systemType': String,
    'lastCheckIn': Date,
    'sysInfo':{
        'memLayout': [{ 
            'type': Map,
                'of': mongoose.Schema.Types.Mixed
            }],   
            'fsSize': { 
                'fs': {
                    'type': Map,
                    'of': mongoose.Schema.Types.Mixed
                }
            },
             'diskLayout': { 
                'fs': {'type': Map,
                'of': mongoose.Schema.Types.Mixed 
                }
            },
             'cpu':
              { 'type': Map,
              'of': mongoose.Schema.Types.Mixed 
            },
             'osInfo':
              { 'type': Map,
              'of': mongoose.Schema.Types.Mixed 
             },
        

    }
  })

  module.exports = mongoose.model("Cameras", schema)



  
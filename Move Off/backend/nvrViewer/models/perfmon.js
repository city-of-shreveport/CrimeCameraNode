const mongoose = require("mongoose")
const schema = mongoose.Schema({
    'camera':String,
'upDated': { type: Date, default: Date.now },
'currentLoad':{ 
	'avgLoad': Number,
        'currentLoad': Number,
        'currentLoadUser': Number,
        'currentLoadSystem': Number
	},
    'cpus': {
    	'type': Map,
    	'of': String
  	},
'mem':
      { 'total': Number,
        'free': Number,
        'used': Number,
        'available': Number
 	},
'cpuTemperature':
      { 'main': Number
	}
  })

  module.exports = mongoose.model("PerfMon", schema)



  
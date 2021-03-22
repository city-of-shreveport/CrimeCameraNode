//
const express = require("express")
const perfmon = require("../models/perfmon") 

const router = express.Router()
var moment = require('moment-timezone');
router.get("/haha", async (req, res) => {
    
    console.log("HAHA:")
	res.end("HAHAHA")
})
// Get all posts

router.get("/getPerfDataNode/:node", async (req,res) => {
    const nodeName = req.params.node
    perfmon.find({camera:nodeName}).sort([['DateTime', 1]]).exec(function(err, docs) { 
          
    if (err){ 
        console.log(err); 
    } 
    else{
        res.send(docs)
    }




})
})

router.post("/adddata/:node", async (req, res) => {
	const perf = new perfmon(req)
        perf.camera = req.body.node
       
	await perf.save()
	res.send(perf)
})
module.exports = router
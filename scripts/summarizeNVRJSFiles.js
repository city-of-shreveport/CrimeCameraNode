// usage: node scripts/summarizeNVRJSFiles [n]
//        n is an integer number of minutes to bucket data into. default = 15, min = 5, max = 60

const fs=require('fs').promises;

async function scanCamera(path) {
  var dir=await fs.readdir(path);
  dir=dir.map(f=>{
    var ts=new Date((+f.match(/^[0-9]+/)[0])*1000)
    if(f.includes('.mp4'))return {date:ts,type:"video",file:f}
    if(f.includes('placeholder'))return {date:ts,type:"placeholder",file:f}
    if(f.includes('.json'))return {date:ts,type:"metadata",file:f}
    return {date:ts,type:"unknown",file:f}
  })

  dir.sort((a,b)=>a.date-b.date);

  if(!dir.length)return null;
  return {camera:path.split('/').pop(),files:dir,oldest:dir[0].date,newest:dir[dir.length-1].date}
}

async function scanRoot(path) {
  var cams=await fs.readdir(path,{withFileTypes:true})
    cams=cams.filter(f=>f.isDirectory());
    var dat=[]
    for(var cam of cams)
      dat.push(await scanCamera(`${path}/${cam.name}`))
  return dat.filter(o=>o)
}

async function main(minutes) {
  minutes=+minutes;
  if(isNaN(minutes) || minutes < 5)minutes=15;
  if(minutes > 60)minutes=60;
  var dat=[];
  dat=dat.concat(await scanRoot('/home/pi/videos/NVRJS_SYSTEM'))
  try {
    var dir=await fs.readdir('/home/pi/remote_backups/BACKUP',{withFileTypes:true})
    dir=dir.filter(f=>f.isDirectory());
    for(var dir of dirs)
      dat=dat.concat(await scanRoot(`/home/pi/remote_backups/BACKUP/${dir.name}`))
  }
  catch(e){}

  var oldest=dat[0].oldest;
  var newest=dat[0].newest;
  for(var i=1;i<dat.length;++i) {
    if(dat[i].oldest < oldest)oldest=dat[i].oldest;
    if(dat[i].newest > newest)newest=dat[i].newest;
  }


  var o=new Date(oldest);
  // clear
  o.setMinutes(o.getMinutes()-o.getMinutes()%minutes);
  o.setSeconds(0);
  o.setMilliseconds(0); // align to hour

  o/=1;

  var table=[]
  for(var i=o;i<newest;i+=minutes*60*1000) {
    var t_start=new Date(i);

    var t_end=new Date(i+minutes*60*1000);
    var slice={
      start:t_start.toISOString().replace(/:00.000Z/,'').replace(/T/,' '),
      end:t_end.toISOString().replace(/:00.000Z/,'').replace(/T/,' '),
    }
    for(var c of dat) {
      var cam=c.camera;
      var ind=c.files.findIndex(o=>o.date > t_end);
      if(ind == -1 )ind=c.files.length;
      var data=c.files.splice(0,ind)
      if(data.length==0)
        slice[cam]='\x1b[31mno data\x1b[0m'
      else if(data.filter(o=>o.type=='placeholder').length)
        slice[cam]='\x1b[33mplaceholders\x1b[0m'
      else if(!data.filter(o=>o.type=='metadata').length)
        slice[cam]='\x1b[35mno metadata\x1b[0m'
      else {
        slice[cam]='\x1b[32mok\x1b[0m'
      }
    }
    table.push(slice)
  }

  var header={start:"Start Time (UTC)",end:"End Time (UTC)"}
  for(var c of dat) {
    header[c.camera]=`\x1b[36m${c.camera}\x1b[0m`
  }
  table.unshift(header);

  var lens={}
  for(var i in table[0])
    lens[i]=Math.max(...table.map(l=>(l[i]||'').length))

  for(var i=0;i<table.length;++i) {
    var dat=Object.entries(table[i]);
    for(var x in dat) {
        dat[x]=dat[x][1].padEnd(lens[dat[x][0]])
    }
    console.log(dat.join(' | '))
  }
}

main(process.argv[2]||'15')

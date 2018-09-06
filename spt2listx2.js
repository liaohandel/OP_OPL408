console.log("[opf403 ] start spt2list 20180523x1 ...");

var path = require('path');
var fs = require('fs');
var os = require('os');

//var handelbuff = require('./handel_buffv03');
const express = require('express')
const app = express()

var Client = require('node-rest-client').Client;
var client = new Client();

var co = require('co');
var thunkify = require("thunkify");

var util = require('util');

//link gateway pam 
var seturl = ""
var chkurl = ""
var setport = 3001
var linkchkcount = 0

var ddsnurl = "http://106.104.112.56/Cloud/API/linkbox.php"
var vdsnurl = "http://106.104.112.56/Cloud/API/videobox.php"
var devloadurl = "http://106.104.112.56/Cloud/API/DeviceUpdate.php"
var typeloadurl = "http://106.104.112.56/Cloud/API/TypeUpdate.php"
var typechannelurl = "http://106.104.112.56/Cloud/API/TypeChannelsUpdate.php"

var dev85statusurl="http://106.104.112.56/Cloud/API/DeviceStatus.php"
var dev105statusurl="http://106.104.112.56/Cloud/API/ContainerStatus.php"

var offdev85statusurl="http://192.168.5.220/API/DeviceStatus.php"
var offdev105statusurl="http://192.168.5.220/API/ContainerStatus.php"
var offdevloadurl = "http://192.168.5.220/API/DeviceUpdate.php"
var offtypeloadurl = "http://192.168.5.220/API/TypeUpdate.php"
var offtypechannelurl = "http://192.168.5.220/API/TypeChannelsUpdate.php"


var setdeviceip = 'https://c4915760.ngrok.io'
var setdeviceport = '0000'
var setuuid = '1234567890abcdefghijk'
var activekeyurl = "http://106.104.112.56/Cloud/API/DeviceStatus.php"  //no use

var setddsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&UUID='+setuuid
var setvdsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&DevicePOS='+setdeviceport+'&UUID='+setuuid
var setdevouturl = devloadurl+"?UUID="+setuuid+"&result="+"{}"

//=== JSPT.txt to jsptpd ===
var filename_spt = "JSPT.txt"
var filepath_spt = path.join(__dirname, ("/script_doc/" + filename_spt));
var jsptpd = {} //tree upload buffer

var sptall = [
	"temp1.spt","temp2.spt",
	"rh1.spt","rh2.spt","rh3.spt",
	"watertemp.spt",
	"co21.spt","co22.spt"
	]
	
//var jsptobj ={}


//=== syspub function ===
function jobjcopy(jobj){
	return JSON.parse(JSON.stringify(jobj));	
}

function eventcall(callmask){
	event.emit(callmask);
}

//=== spt tool

//===================================
function jsptpd_load(callback){
    fs.readFile(filepath_spt, function(err, content) {
		if(err){			
			console.log("open JSPT.txt err! ")
			throw err;
		}
        let treescandata = content.toString();
		//console.log("jscan",treescandata);
        //let jobj = JSON.parse(uuiddata);
		jsptpd = jobjcopy(JSON.parse(treescandata));//jobjcopy(jobj)
		console.log("jscan=",jsptpd.sptver);
		
		exports.jsptpd = jsptpd //#####
        callback();		
	});	
}

function jsptpd_update(callback){	
	let treescandata = JSON.stringify(jsptpd);			
	
	fs.writeFile(filepath_spt,treescandata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('JSPT.txt update ERR ! ');
		}		
		callback();
	});
}


function sspt_load(fspt,callback){

    fs.readFile("./script_doc/"+fspt, function(err, content) {
		if(err){
			console.log("open "+fspt+" err! ");
			throw err;
		}
		//console.log("open "+fspt+" ok! ");
        let fdata = content.toString();
		//console.log("jdata",treedatadata);
        //let jobj = JSON.parse(uuiddata);
		//jkeypd = jobjcopy(JSON.parse(keypddata));
		//console.log("KETPD ver=",jkeypd.KEYVER);		
		//exports.jkeypd = jkeypd//#####		
        callback(fdata,fspt);
	});	
	
}

function sspt_update(callback){	
	let keypddata = JSON.stringify(jkeypd);		
	
	fs.writeFile(filepath_spt,keypddata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('KEYPD.txt update ERR ! ');
		}		
		callback();
	});	
}

function script_linkrun(subcall){
	console.log(JSON.stringify(subcall));

	
}


function script_callrun(jsobj){
	let ss,cc,lss
	
	for(cc in jsobj){
		//ss = jsobj[cc]
		//lss = ss.split(" ")
		//console.log("=>",lss)
		console.log("		SETP RUN =======> ",jsobj[cc])
	}
	
	//console.log("add1==>"+JSON.stringify(jsobj))
	
}

function script_run(){
	let jsobj ={}
	let ss
	
	for(ss in jsptpd.SPTCMD){
			console.log("run => "+ss);
			jsptpd.SPTCMD[ss]['chkflag'] ={}
			for(ss2 in jsptpd.SPTCMD[ss]){
				if((ss2.valueOf()!= "MAIN") && (ss2.valueOf()!='chkflag')){
					//console.log("add==>"+JSON.stringify(jsptpd.SPTCMD[ss]))
					jsptpd.SPTCMD[ss]['chkflag'][ss2]=1
					console.log("	call ====> "+ss2);
					jsobj = jobjcopy(jsptpd.SPTCMD[ss][ss2]);
					script_callrun(jsobj);
					console.log("	add2==>"+JSON.stringify(jsptpd.SPTCMD[ss]['chkflag']))	
				}	
						
			}
			for(ss3 in jsptpd.SPTCMD[ss]["MAIN"]){
				console.log("	MAIN=> "+jsptpd.SPTCMD[ss]["MAIN"][ss3]);
			}
	}
}



var cmdchk = {
	"RELAY":{
		"03":{"op":"0","pos":"0000","Action":"ON"}
	},
	"SENSOR":{
		"06":{"op":"0","pos":"0000","devtype":"data","pamtype":"tm","Action":"ON"}
	},
	"ALARM":{
		"03":{"op":"0","chkcall":"0000","docall":"0000"}
	},
	"TIME":{
		"04":{"op":"0","tmmode":"0000","pos":"0000","timepam":0}
	}
}

var sptfun =["FUNC"]
var sptcmd =["RELAY","SENSOR","ALARM","TIME"]

var f1=[]
//=======================================

app.get('/', function (req, res) {
  //console.log(req.body)
  console.log(req.query.pin);
  jj = "Hello World OPF403SPT X 1 20180524 !"+
  "  http://127.0.0.1:3001/SPTLOAD"+
  "  http://127.0.0.1:3001/UPDATA2FILE"+
  "  http://127.0.0.1:3001/SHOWBUFFER"+
  "  http://127.0.0.1:3001/RUN"
  res.send(jj);
  
});


app.get('/SPTLOAD', function (req, res) {
  //console.log(req.body)
  console.log(req.query.pin);
  res.send('LODA OPF403SPT X 1 20180524 !');
  
	//jsptpd_load(()=>{
	//	console.log("jsptpd load ok !");
		jsptpd.SPTCMD={} //clear all spt wait for LOAD 
		
		for(jj in sptall){
			sspt_load(sptall[jj],(ss,fname)=>{
				f1=ss.split(/[\r\n]/);
				for(ii in f1)console.log(f1[ii])
				ff=fname.split(".")
				sptkey=ff[0];
				console.log(">>"+sptkey)
				jsptpd.SPTCMD[sptkey]={}
				jsptpd.SPTCMD[sptkey]["MAIN"]=[]
				let vkey ="00"
				for(kk in f1){
					pss = f1[kk]
					if(pss.length > 4){						
						lpss=pss.split(" ");
						ckss=lpss[0].substring(0,1)
						//console.log("[0]="+lpss[0]+"&&"+ckss.charCodeAt(0));
						xx =ckss.charCodeAt(0)
						switch(xx){
							case 9:
								if(vkey=="00")break;
								//console.log("%%"+pss)
								sss = pss.replace('\t','')
								sss = sss.replace('\r','')
								jsptpd.SPTCMD[sptkey][vkey].push(sss);
								break;
							case 70:
								ss2= lpss[1]
								//console.log("$$"+ss2)
								if( ss2.length >=3 )vkey=lpss[1]
								jsptpd.SPTCMD[sptkey][vkey] = []
								break;
							case 47:
								break;
							default:
								//console.log("%%"+pss)
								sss = pss.replace('\t','')
								sss = sss.replace('\r','')
								jsptpd.SPTCMD[sptkey]["MAIN"].push(sss);
								//if(lpss[0] in sptcmd)jsptpd.SPTCMD[sptkey]["MAIN"].push(sss);
								break;
						}
					}
				}					
				console.log("files = "+ff[0]);
				//for(ii in f1)console.log(f1[ii],f1[ii].length,"item="+lpss.length);
				console.log("=======================");
				
			});
		}
	//});

});

app.get('/UPDATA2FILE', function (req, res) {
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Hello World OPF403SPT X 1 20180524 !');
	jsptpd_update(()=>{});
	
});

app.get('/SHOWBUFFER', function (req, res) {
	//console.log(req.body)
	console.log(req.query.pin);
	//res.send('Hello World OPF403SPT X 1 20180524 !');
	ss = JSON.stringify(jsptpd.SPTCMD);
	console.log("##SHOW SPT=>"+ss);
	res.json(jsptpd.SPTCMD);
	
});

app.get('/RUN', function (req, res) {
	console.log(req.query);
	script_run();
	res.json("ok!");
});

app.listen(setport, function () {    
	console.log("SCRIPT server RUN http://127.0.0.1:3001 ...");
	
	jsptpd_load(()=>{
		console.log("jsptpd load ok !");
	});
});



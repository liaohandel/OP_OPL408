console.log("[linkgateway ] start Container gx7 20180331x1 ...");

var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 

const express = require('express')
const app = express()

var bodyParser = require('body-parser');  //no use
var ngrok = require('ngrok');

var Client = require('node-rest-client').Client;
var client = new Client();
 
var path = require('path');
var fs = require('fs');
var os = require('os');

var util = require('util');

var pdbuffer  = require('./pdbuffer_v02.js');
var cmdcode = require("./handelrs485");

//OPF403  treeapi ###
//path => ./gotest5_opf403/tree/treeapi.js
var treeRoutes = require('./treeapi.js');

//OPF403  regcmdapi ###
//path => ./gotest5_opf403/regcmd/regcmd_gx8.js
var regcmdRoutes = require('./regcmd_gx8.js');

//var ch1com = require('./utx7x1')// rec oxfa and 0xfc command 
//var ch1com = require('./utx5x2')
//var ch3com = require('./utx5x3')
//var ch4com = require('./utx5x4')

//link gateway pam 
var seturl = ""
var chkurl = ""
var setport = 3000
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

//load startup paramemt for uuid
//var filename = "uuiddata.txt"
var filename = "PDDATA.txt"
var filepath = path.join(__dirname, ("/public/" + filename));
//var pdjobj ={}

//["C602","CA01","CA02","C101","C104","C107","C102","C103"],	//6
//["CA03","CA04","CA05","C105","C106"],	//7
var sbcount = 0;
var sbcountmax =13;
var sensorbuff = [
	["C602"],["CA01"],	//0,1
	["CA02"],["C101"],	//2,3
	["C104"],["C107"],	//4,5
	["C102"],["C103"],	//6,7
	["CA03"],["CA04"],	//8,9
	["CA05"],["C105"],	//10,11
	["C106"]			//12
]

//=== syspub function ===
function jobjcopy(jobj){
	return JSON.parse(JSON.stringify(jobj));	
}

//===========================

//=========================================================
// local device command 
//=========================================================
function devlinkscan(mode){//####1:cube device 2:linkbox 3:Container
	let poscount = 0
	switch(mode){
		case 1:	
			return 0;//cube can not be sacn device add
			break 
			ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
			for(pos in pdbuffer.pdjobj.PDDATA.Devtab){		
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
				pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				console.log(">>>"+ttbuf.toString('hex'))		
				pdbuffer.totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}	
			return poscount;
			break
		case 2:				
			//scan by devadd define for linkbox only
			ttbuf = Buffer.from(cmdcode.rs485v040.s70cmd,'hex');
			for(pos in pdbuffer.pdjobj.PDDATA.Devtab){
				pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP>9)pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP=0
			}
			for(sadd in pdbuffer.pdjobj.addposmap){	
				pos = pdbuffer.pdjobj.addposmap.sadd;
				ttbuf[1]= Number("0x"+sadd);
				//if(pos in pdjobj.PDDATA.Devtab)pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				console.log(">>>"+ttbuf.toString('hex'))		
				pdbuffer.totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}	
			return poscount;
			break
		case 3:				
			//scan by devadd define for Container only by scangroup(<16 by 3min)
			return 0;//cube can not be sacn device add
			ttbuf = Buffer.from(cmdcode.rs485v040.s70cmd,'hex');
			for(pos in pdbuffer.pdjobj.PDDATA.Devtab){
				pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP>9)pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP=0
			}
			for(sadd in pdbuffer.pdjobj.addposmap){	
				pos = pdbuffer.pdjobj.addposmap.sadd;
				ttbuf[1]= Number("0x"+sadd);
				//if(pos in pdjobj.PDDATA.Devtab)pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				console.log(">>>"+ttbuf.toString('hex'))		
				pdbuffer.totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}
			return poscount;
			break
		default:
			return 0
	}
	return poscount;
}

function devloadscan(spos){//pos , LOAD save to buffer
	let poscount = 0
	if(spos in pdbuffer.pdjobj.PDDATA.Devtab){		
		sdevadd = pdbuffer.pdjobj.PDDATA.Devtab[spos].STATU.devadd;
		//ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
		for(cmd in pdbuffer.pdjobj.PDDATA.Devtab[spos]){			
			if(cmd == "STATU"){
				console.log("Pass the STATU cmd ...");
			}else{				
				txtype = cmdcode.subcmdtype[cmd];
				ttbuf = Buffer.from(cmdcode.rs485v040[txtype],'hex');		
				ttbuf[1]= sdevadd;
				ttbuf[4]= 2;		
				console.log(">>>"+ttbuf.toString('hex'))		
				pdbuffer.totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}
		}		
	}
	return poscount;
}

//channel check devloadscn ### 20180322
function devchannelscan(spos){
	let poscount = 0
	if(spos in pdbuffer.pdjobj.PDDATA.Devtab){		
		sdevadd = pdbuffer.pdjobj.PDDATA.Devtab[spos].STATU.devadd;
		//ttbuf = Buffer.from(cmdcode.rs485v029.ackcmd,'hex');
		
		for(cmd in pdbuffer.pdjobj.PDDATA.Devtab[spos]){	
			if(cmd == "STATUxxx"){
				console.log("Pass the STATU cmd ...");
			}else{				
				if("chtab" in pdbuffer.pdjobj.PDDATA.Devtab[spos][cmd]){
					//then this cmd have channel table in Json
					for(chcode in pdbuffer.pdjobj.PDDATA.Devtab[spos][cmd]["chtab"]){					
						txtype = cmdcode.subcmdtype[cmd];
						ttbuf = Buffer.from(cmdcode.rs485v029[txtype],'hex');//###		
						ttbuf[1]= sdevadd;
						ttbuf[4]= 2;//load subcmd		
						ttbuf[5]= parseInt(chcode,16);//Number(chcode);//### load stu by channel
						console.log("chtab load cmd>>>"+ttbuf.toString('hex'))		
						pdbuffer.totxbuff(ttbuf);//query to tx buffer 
						poscount++;							
					}
				}else{			
					txtype = cmdcode.subcmdtype[cmd];
					ttbuf = Buffer.from(cmdcode.rs485v029[txtype],'hex');//###		
					ttbuf[1]= sdevadd;
					ttbuf[4]= 2;// standy load no channel so stu=00		
					console.log(">>>"+ttbuf.toString('hex'))		
					pdbuffer.totxbuff(ttbuf);//query to tx buffer 
					poscount++;			
				}			
			}
		}		
	}
	return poscount;
}


function devloadlinkweb(ldevarr){
	dobj={"POSTab":"D011","GROUP":0,"Status":1};
	jload = {};
	jload.success="true";
	jload.UUID=setuuid;
	jload.result=[]
	if(ldevarr.length > 0){
		//reload the ldevarr item 
		for(ii in ldevarr){
			if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.LINK == 1){
				dobj.POSTab=ii;
				dobj.GROUP=pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP;
				dobj.Status=pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.LINK;
				jload.result.push(jobjcopy(dobj));			
			}
		}	
	}else{
		//reload all device
		for(ii in pdbuffer.pdjobj.PDDATA.Devtab){
			if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.LINK == 1){
				dobj.POSTab=ii;
				dobj.GROUP=pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP;
				dobj.Status=pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.LINK;
				jload.result.push(jobjcopy(dobj));			
			}
		}		
	}
	if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){	
		setdevloadurl = offdevloadurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);		
	}else{
		setdevloadurl = devloadurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);
	}
	console.log(setdevloadurl)
	client.get(setdevloadurl, function (data, response) {console.log("reload devtab web link !"+data.toString())});	
}

var cmdtab={
	"C71":"LED",
	"C72":"PUMP",
	"C73":"AIRFAN",
	"C74":"GROUP",
	"C75":"UV",
	"C76":"CO2",
	"C77":"TEMPERATURE",
	"C78":"RH",
	"C79":"WATERLEVEL",
	"C7A":"ELECTRONS",
	"C7B":"PH",
	"C7C":"PWM",
	"C7D":"SETTIME",
	"C7E":"AUTO"
}

function typeloadlinkweb(lpos){
	if(lpos in pdbuffer.pdjobj.PDDATA.Devtab ){		
		lljob=pdbuffer.pdjobj.PDDATA.Devtab[lpos]
		cmdobj={"CMD":"LED","sub":1,"stu":0,"Data":0};
		jload = {};
		jload.success="true";
		jload.UUID=setuuid;
		jload.POSTab=lpos;
		jload.GROUP=lljob.STATU.GROUP;
		jload.Status=lljob.STATU.LINK;
		jload.MACADD=lljob.STATU.MACADD;
		jload.result=[];
		for(ii in lljob){
			if(ii in cmdtab){
				//if(!("chtab" in lljob[ii]) ){						
				cmdobj.CMD = cmdtab[ii];
				cmdobj.sub = lljob[ii].sub;
				cmdobj.stu = lljob[ii].stu;
				cmdobj.Data = lljob[ii].Data;	
				jload.result.push(jobjcopy(cmdobj));		
				//}		
			}
		}		
		if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){	
			settypeloadurl = offtypeloadurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);
		}else{
			settypeloadurl = typeloadurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);			
		}			
		console.log(settypeloadurl)
		client.get(settypeloadurl, function (data, response) {console.log("reload devtab pos to web link !"+data.toString())});	
	}
}

function typechannellinkweb(chpos){	
	if(chpos in pdbuffer.pdjobj.PDDATA.Devtab ){
		ccjob=pdbuffer.pdjobj.PDDATA.Devtab[chpos];
		cmdobj={"CMD":"LED","sub":1,"stu":0,"Data":0};
		jload = {};
		jload.success="true";
		jload.UUID=setuuid;
		jload.POSTab=chpos;
		jload.result=[];
		for(ii in ccjob){
			if(ii in cmdtab){
				if("chtab" in ccjob[ii]){		
					for(cc in ccjob[ii]["chtab"] ){						
						cmdobj.CMD = cmdtab[ii];
						cmdobj.sub = ccjob[ii]["chtab"][cc].sub;
						cmdobj.stu = ccjob[ii]["chtab"][cc].stu;
						cmdobj.Data = ccjob[ii]["chtab"][cc].Data;
						jload.result.push(jobjcopy(cmdobj));	
					}	
				}		
			}
		}
		if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){	
			settypechannelurl = offtypechannelurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);		
		}else{
			settypechannelurl = typechannelurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);	
		}	
		console.log(settypechannelurl)
		client.get(settypechannelurl, function (data, response) {console.log("reload devtab pos to web link !"+data.toString())});			
		
		
	}
}

var sensorcmdtab={
	"C76":"CO2",
	"C77":"TEMPERATURE",
	"C78":"RH",
	"C79":"WATERLEVEL",
	"C7A":"ELECTRONS",
	"C7B":"PH"
}

function device_stulinkweb(ldevarr){
	console.log("### sensor link ...")
	let dobj={"DevicePOS":0,"Status":0,"Value":0};
	if(ldevarr.length > 0){
		//reload the ldevarr item 
		for(ii in ldevarr){
			spos = ldevarr[ii]
			lljob=pdbuffer.pdjobj.PDDATA.Devtab[spos]
			console.log(">>link pos = "+spos)			
			for(jj in lljob){
				if(jj in sensorcmdtab){	
					dobj.DevicePOS = spos;
					dobj.Status= cmdtab[jj];
					dobj.Value = lljob[jj].stu;
					if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){	
						setdevloadurl = offdev85statusurl+'?UUID='+setuuid+'&DevicePOS='+dobj.DevicePOS+"&Status="+dobj.Status+"&Value="+dobj.Value ;	
					}else{
						setdevloadurl = dev85statusurl+'?UUID='+setuuid+'&DevicePOS='+dobj.DevicePOS+"&Status="+dobj.Status+"&Value="+dobj.Value ;	
					}	
					console.log(setdevloadurl)
					client.get(setdevloadurl, function (data, response) {console.log("reload devtab web link !"+data.toString())});								
				}
			}
		}	
	}	
}

function container_stulinkweb(ldevarr){
	console.log("### sensor link ..."+JSON.stringify(ldevarr));	
	let dobj={"DevicePOS":0,"Status":0,"Value":0};
	if(ldevarr.length > 0){
		//reload the ldevarr item 
		for(ii in ldevarr){
			spos = ldevarr[ii]
			lljob=pdbuffer.pdjobj.PDDATA.Devtab[spos]
			console.log(">>link pos = "+spos)
			for(jj in lljob){
				if(jj in sensorcmdtab){		
					dobj.DevicePOS = spos;
					dobj.Status= cmdtab[jj];
					dobj.Value = lljob[jj].stu;	
					if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){	
						setdevloadurl = offdev105statusurl+'?UUID='+setuuid+'&DevicePOS='+dobj.DevicePOS+"&Status="+dobj.Status+"&Value="+dobj.Value ;	
					}else{
						setdevloadurl = dev105statusurl+'?UUID='+setuuid+'&DevicePOS='+dobj.DevicePOS+"&Status="+dobj.Status+"&Value="+dobj.Value ;	
					}
					console.log(setdevloadurl)
					client.get(setdevloadurl, function (data, response) {console.log("reload devtab web link !"+data.toString())});		
				}
			}
		}	
	}
}


//=== /DeviceList return to Restful API ===
// app.get('/DeviceList', function (req, res) {	
	// event.on('devallscan_event', function() {		
		// function devalldatalink(){//###000,load		
			// function todevoutbuff(jdev)
				// event.on('senddevlist_event', function() { 
		
		
// app.get('/DeviceList', function (req, res) {	
	// event.on('devposload_event', function(spos) { //pos on	
		// function devposloaddata(spos){//pos , load
			// function todevoutbuff(jdev)
				// event.on('senddevlist_event', function() { 
//==========================================
var devoutbuff = [];//devloadurl 

function todevoutbuff(jdev){
	devoutbuff.push(JSON.stringify(jdev))	
	if(devoutbuff.length==1){			
		setTimeout(function(){event.emit('senddevlist_event')},10);	
	}
}

event.on('senddevlist_event', function() { 
	if(devoutbuff.length>0){	
	        sdev = devoutbuff.shift();
			console.log("type ="+typeof(sdev)+" data="+sdev);
			setdevouturl = devloadurl+"?success=true&UUID="+setuuid+"&result="+sdev;       
			console.log("url="+setdevouturl);
            client.get(setdevouturl, function (data, response) {});
			setTimeout(function(){event.emit('senddevlist_event')},10);		
	}
});

function ondevlinkbuff(callback){//### check all devtab link status by pos 
	let jload = []
	jpos={"POSTab":"0000","GROUP":0,"Status":"0"}	
	//jdevout = { "UUID" : setuuid ,"devlist":jload} //
	//jload.push({"success":"true","UUID" : setuuid  });
	for(pos in pdbuffer.pdjobj.PDDATA.Devtab){				
		if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){
			jpos.POSTab = pos;
			jpos.GROUP =  Number(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP)%10;
			if( typeof(jpos.GROUP) == 'object' )jpos.GROUP = 0;
			jpos.Status = pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK;
			//console.log("###1jpos = "+JSON.stringify(jpos));
			jload.push(jobjcopy(jpos));
		}
	}
	console.log("devlist="+JSON.stringify(jload));
	callback(jload)
	return
}

function ondevposbuff(spos,callback){//###	
	let jload = []
	if((spos in pdbuffer.pdjobj.PDDATA.Devtab)== false)callback(jload);
	//jpos={"POSTab":spos,"group":"0"}
	console.log("sop="+spos)
	jdev={"CMD":0,"sub":0,"stu":0,"Data":0}
	for(scmd in  pdbuffer.pdjobj.PDDATA.Devtab[spos]){
		if(scmd != "STATU"){			
			vkey = cmdcode.apicmdtype[scmd]
			jdev.CMD = vkey
			jdev.sub = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].sub
			jdev.stu = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].stu
			jdev.Data = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].Data
			//console.log("key="+vkey)
			//console.log("data="+ pdjobj.PDDATA.Devtab[spos][scmd].sub)
			jload.push(jobjcopy(jdev));
		}
	}
	callback(jload);
	return
}

function devalldatalink(){//###000,load
	let jload = []
	jpos={"POSTab":"0000","GROUP":0,"Status":0}	
	//jdevout = { "UUID" : setuuid ,"devlist":jload} //
	//jload.push({"success":"true","UUID" : setuuid  });
	for(pos in pdbuffer.pdjobj.PDDATA.Devtab){				
		if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){
			jpos.POSTab = pos;
			jpos.GROUP =  Number(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP)%10;
			if( typeof(jpos.GROUP) == 'object' )jpos.GROUP = 0;
			jpos.Status = pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK;
			//console.log("###2jpos = "+JSON.stringify(jpos)+"##"+jpos.GROUP);			
			jload.push(jobjcopy(jpos));
		}
	}
	console.log("devlist="+JSON.stringify(jload));
	todevoutbuff(jload);//link to device report Restfulapi		
}

event.on('devallscan_event', function() { 
	devalldatalink();
});

function devposloaddata(spos){//pos , load
	if((spos in pdbuffer.pdjobj.PDDATA.Devtab)== false)return
	let jload = []
	//jpos={"POSTab":spos,"group":"0"}
	console.log("sop="+spos)
	jdev={"CMD":0,"sub":0,"stu":0,"Data":0}
	for(scmd in  pdbuffer.pdjobj.PDDATA.Devtab[spos]){
		if(scmd != "STATU"){			
			vkey = cmdcode.apicmdtype[scmd]
			jdev.CMD = vkey
			jdev.sub = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].sub
			jdev.stu = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].stu
			jdev.Data = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].Data
			//console.log("key="+vkey)
			//console.log("data="+ pdjobj.PDDATA.Devtab[spos][scmd].sub)
			jload.push(jobjcopy(jdev));
		}
	}
	
	jpos={"POSTab":"0000","GROUP":0,"Status":0,"result":0}	
	jpos.GROUP =  Number(pdbuffer.pdjobj.PDDATA.Devtab[spos].STATU.GROUP);
	jpos.POSTab = spos
	jpos.Status = pdbuffer.pdjobj.PDDATA.Devtab[spos].STATU.LINK;
	jpos.result = jload
	todevoutbuff(jpos);		
}

event.on('devposload_event', function(spos) { //pos on
	devposloaddata(spos);
});



//=== web sever Route ==================
// WEB COMMAMD LIST
//======================================
app.get('/', function (req, res) {
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Hello World!')
});

//===============================================
//System API Command 
//===============================================
app.get('/connectcheck', function (req, res) {
    //console.log(req.body)
    console.log(req.query.pin);
    res.send("ready");		
	//ct = devlinkscan(1);//1:cube device 2:linkbox
});

app.get('/loadcheck', function (req, res) {
    //console.log(req.body)
    console.log(req.query.pin);
    res.send("ready");
	//ct = devlinkscan(1);//1:cube device 2:linkbox
	//let devarr=[];
	//devloadlink(devarr);
	//typeloadlink("A001");
    //for(ii in pdjobj.PDDATA.Devtab)typeloadlink(ii);
});

app.get('/typecheck', function (req, res) {
    //console.log(req.body)
    //console.log(req.query.pin);
    res.send("ready web typwchk");		
	//ct = devlinkscan(1);//1:cube device 2:linkbox  3:Container 
	//let devarr=[];
	//devloadlinkweb(devarr);
	//typeloadlinkweb("A001");typechannellinkweb
    //for(ii in pdjobj.PDDATA.Devtab)typeloadlinkweb(ii);
	//for(pp in typeloadset){
	//	ct = devloadscan(typeloadset[pp]);	//load pos data to buffer 10min
	//}
	//sbcount=0
	//for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
  	//for(ii in typeloadset)typeloadlinkweb(typeloadset[ii]);
  	//for(ii in typechannelset)typechannellinkweb(typechannelset[ii]);
				console.log(">>LOCAL server 192.268.5.220 Link Mode !");
				container_stulinkweb(sensorbuff[sbcount]);
				for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
				sbcount++;
				if(sbcount>=sbcountmax)sbcount=0;				
				for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min		
	
	
});

app.get('/PDINFO', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = req.query.GROUP
	let cstu = req.query.STU	
	console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	//if(typeof(group) == "undefined" )console.log("group Fail ...");
	if((typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined") ){		
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	if((uuid != setuuid) && (uuid != "OPFARM0921836780")){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}	
	//=== pdinfo command =================
	jobj = {  "success" : "true"  }; 
	console.log(JSON.stringify(jobj));
	if(group in pdbuffer.pdjobj.PDDATA ){
		if(group == "Devtab" ){		
			let posarr=pos.split(":");
			let poslength = posarr.length;
			let ssarry = cstu.split('\\');
			let cstu2 = ""
			for (c in ssarry){
				cstu2 = cstu2 + ssarry[c];
			}
			console.log("stu ="+cstu2);
			let jstu = JSON.parse(cstu2);
			switch(cmd){
				case "ON":
					//update to File
					pdbuffer.sysupdate(function(){
						if(error){ //如果有錯誤，把訊息顯示並離開程式
							console.log('PDDATA.txt update ERR ! ');							
							jobj = { "success" : "false" };  
						}else{
							console.log('PDDATA.txt update OK ! ');
							jobj = {  "success" : "true"  }; 							
						}
					});
					break
				case "LOAD":
					if(poslength == 2){						
						jstu = pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]][posarr[1]];
					}else{	
						console.log("devkey ="+posarr[0]);					
						jstu = pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]];
					}
					jobj.GROUP =  group;
					jobj.STU = jstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="LOAD"
					break	
				case "SET":
					if(poslength == 2){		
						pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]][posarr[1]] = jstu;
					}
					if(poslength == 1){							
						pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]] = jstu;
					}
					jobj.GROUP =  group;
					jobj.STU = jstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="SET"
					break
				default:
					return 		
			}				
		}else{	
			switch(cmd){
				case "ON":
					//update to File
					pdbuffer.sysupdate(function(){
						if(error){ //如果有錯誤，把訊息顯示並離開程式
							console.log('PDDATA.txt update ERR ! ');							
							jobj = { "success" : "false" };  
						}else{
							console.log('PDDATA.txt update OK ! ');
							jobj = {  "success" : "true"  }; 							
						}
					});
					break
				case "LOAD":
					cstu = pdbuffer.pdjobj.PDDATA[group];
					jobj.GROUP =  group;
					jobj.STU = cstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="LOAD"
					break	
				case "SET":
					pdbuffer.pdjobj.PDDATA[group]= cstu;
					ddsnurl = pdbuffer.pdjobj.PDDATA.dsnurl;
					vdsnurl = pdbuffer.pdjobj.PDDATA.videodsnurl;
					devloadurl =  pdbuffer.pdjobj.PDDATA.devloadurl;
					setuuid =  pdbuffer.pdjobj.PDDATA.UUID;
					
					jobj.GROUP =  group;
					jobj.STU = cstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="SET"
					break
				default:
					return 		
			}
		}
	}else if(group == "addposmap" ){
		switch(cmd){
			case "ON":
				//update to File 
				pdbuffer.sysupdate(function(){
					if(error){ //如果有錯誤，把訊息顯示並離開程式
						console.log('PDDATA.txt update ERR ! ');							
						jobj = { "success" : "false" };  
					}else{
						console.log('PDDATA.txt update OK ! ');
						jobj = {  "success" : "true"  }; 							
					}
				});
				break
			case "LOAD":
				if(pos=="00"){
					cstu = pdbuffer.pdjobj.addposmap
				}else{					
					cstu = pdbuffer.pdjobj.addposmap[pos];
				}
				jobj.GROUP =  group;
				jobj.STU = cstu
				jobj.UUID= uuid
				jobj.POS= pos
				jobj.Action="LOAD"
				break	
			case "SET":
				if(pos=="00"){
					pdbuffer.pdjobj.addposmap = JSON.parse(cstu);
				}else{					
					pdbuffer.pdjobj.addposmap[pos] = cstu;
				}						
				jobj.GROUP =  group;
				jobj.STU = cstu
				jobj.UUID= uuid
				jobj.POS= pos
				jobj.Action="SET"
				break
			default:
				return 		
		}
	}else{
		jobj = { "success" : "false" };  
		console.log("PDDATA JSON KEY Value Fail !");
		res.json(jobj);
		return;
	}
   
	res.json(jobj);
});

//===============================================
// DEVTAB Drive API Command 
//===============================================


//===============================================
// OFP403 TREE NET API Command  after /TREE/cmd ()
//===============================================
app.use('/TREE', treeRoutes);

//===============================================
// OFP403 REG API Command  after /TREE/cmd (LED,PUMP,AIRFAN,PH,ELECTRONS,RH)
//===============================================
app.use('/REGCMD', regcmdRoutes);



app.get('/LED', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	//if(typeof(group) == "undefined" )console.log("group Fail ...");
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined") ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
  
	//scmd = rs485v040.s71cmd  
	cmdindex=0
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	nstu = Number('0x'+cstu)
	let ttbuf = ""
	if(group==0){
		//dev active
		//ttbuf = Buffer.from(cmdcode.rs485v040.s71cmd,'hex'); //"[f5][00][04][71][00][00][00][71]""f500047100000071"
		ttbuf = Buffer.from(cmdcode.rs485v040.s71chcmd,'hex'); //"[ 0][ 1][ 2][ 3][ 4][ 5][ 6][ 7]""f500047100000071"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
			let cmdindex = pdbuffer.pdjobj.subcmd[cmd]
			ledch = cstu.substring(0,2);//ch
			ledlev = cstu.substring(2,4);//lev
			//console.log("sop="+JSON.stringify(pdbuffer.pdjobj.PDDATA.Devtab[pos][cmd]);
			//kss='chtab'
			//if( kss  in pdbuffer.pdjobj.PDDATA.Devtab[pos][cmd]){
			//	pdbuffer.pdjobj.PDDATA.Devtab[pos][cmd][kss][ledch].sub=cmdindex;	
			//	pdbuffer.pdjobj.PDDATA.Devtab[pos][cmd][kss][ledch].stu=cstu;	
			//}else{				
				pdbuffer.pdjobj.PDDATA.Devtab[pos].C71.sub=cmdindex;		
				pdbuffer.pdjobj.PDDATA.Devtab[pos].C71.stu=cstu;
			//}
		}else{
		   ttbuf[4]=0x55
		   return;
		}
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]= Number('0x'+cstu.substring(0,2));//ch		Number('0x'+cstu.substring(0,2))	
				ttbuf[6]= Number('0x'+cstu.substring(2,4));//level   Number('0x'+cstu.substring(2,4))	
				break
			case "ON":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=Number('0x'+cstu.substring(0,2));//ch		Number('0x'+cstu.substring(0,2))		
				ttbuf[6]=Number('0x'+cstu.substring(2,4));//level   Number('0x'+cstu.substring(2,4))	
				break
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
	}else if(group <20 ){
	   //group LED Control command "s96chcmd" :  "f5,fe,05,96,00,00,00,00,96",
	   ttbuf = Buffer.from(cmdcode.rs485v040.s96chcmd,'hex'); 		    
	   if(cmd in pdbuffer.pdjobj.subcmd){
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[5]=Number('0x'+cstu.substring(0,2));//ch
			ttbuf[6]=Number('0x'+cstu.substring(2,4));//level
			ttbuf[7]=group
			//group Control update to josn buffer
			//for(ii in pdbuffer.pdjobj.PDDATA.Devtab){				
			//	if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
			//		if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
			//			pdbuffer.pdjobj.PDDATA.Devtab[ii].C71.sub=cmdindex;
			//		}else{   
			//			if(ii.substring(0,1) == pos.substring(0,1)){
			//				pdbuffer.pdjobj.PDDATA.Devtab[ii].C71.sub=cmdindex;
			//			}
			//		}
			//	}				
			//}
	   }else{
		   ttbuf[4]=0x55
		   return;
	   }   
	}else{
	   //group is err
		return;
	}

	//========================================
	//set2dev(ttbuf);
	pdbuffer.totxbuff(ttbuf);
   
	//res.send('Hello pwm!')
})

//=======================================================
app.get('/PUMP', function (req, res) {
  console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  res.json(jobj);
  
  //scmd = rs485v040.s72cmd  "s72cmd" :  "[f5][00][04][72][00][00][72]"
	cmdindex=0
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	nstu = Number('0x'+cstu)
	let ttbuf = ""
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s72cmd,'hex'); 
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos].C72.sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos].C72.stu=0;
		}else{
		   ttbuf[4]=0x55
		   return;
		}		
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x72	//### S72auto data to stu array
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
   }else if(group <10 ){
	   //group Control command "s97cmd" :  "[f5][fe][05][97][00][00][00][97]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.s97cmd,'hex'); 		    
	   if(cmd in pdbuffer.pdjobj.subcmd){
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdbuffer.pdjobj.PDDATA.Devtab){				
				if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
						pdbuffer.pdjobj.PDDATA.Devtab[ii].C72.sub=cmdindex;
					}else{   
						if(ii.substring(0,1) == pos.substring(0,1)){
							pdbuffer.pdjobj.PDDATA.Devtab[ii].C72.sub=cmdindex;
						}
					}
				}				
		   }
	   }else{
		   ttbuf[4]=0x55
		   return;
	   }   
   }else{
	   //group is err
		return;
   }	   
   //============================
   //set2dev(ttbuf);   
   pdbuffer.totxbuff(ttbuf);
  //res.send('Hello pump!')
})
//=====================================================
app.get('/AIRFAN', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number(req.query.GROUP)
  let cstu = String(req.query.STU) // add the airfan 2ch control (0:100%,1:75%,2:50$,3:25%)
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  res.json(jobj);
  
  //scmd = rs485v040.s73cmd  
  //scmd = rs485v040.s72cmd  "s72cmd" :  "[f5][00][04][72][00][00][72]",
	cmdindex=0   
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	let ttbuf = ""
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s73cmd,'hex'); 
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		   //update to josn buffer 
		    pdbuffer.pdjobj.PDDATA.Devtab[pos].C73.sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos].C73.stu=nstu ;
		}else{
		   ttbuf[4]=0x55
		   return;
		}		
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x73			
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
   }else if(group <10 ){
	   //group Control command "s97cmd" :  "[f5][fe][05][97][00][00][00][97]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.s98cmd,'hex'); 		    
	   if(cmd in pdbuffer.pdjobj.subcmd){
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdbuffer.pdjobj.PDDATA.Devtab){				
				if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
						pdbuffer.pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
					}else{   
						if(ii.substring(0,1) == pos.substring(0,1)){
							pdbuffer.pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
						}
					}
				}				
		   }
	   }else{
		   ttbuf[4]=0x55
		   return;
	   }   
   }else{
	   //group is err
		return;
   }	   
   
   //==================================
   //set2dev(ttbuf);   
   pdbuffer.totxbuff(ttbuf);
   
})
//=====================================================
app.get('/GROUP', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number(req.query.GROUP)
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  res.json(jobj);
  
   cmdindex=0
   if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
   let ttbuf = Buffer.from(cmdcode.rs485v040.s74cmd,'hex');
   //console.log("group cmd = "+cmd+" "+pos+" "+typeof(group))
   //"s74cmd" :  "[f5][00][04][74][00][00][74]"   
   switch(cmd){
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			if(group <10 ){
				ttbuf[5]= group;
				pdbuffer.totxbuff(ttbuf);
			}
			break
		case "SET":			
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			if(group < 10 ){
				ttbuf[5]= group
				pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP = group
				pdbuffer.totxbuff(ttbuf);
			}else{
				return
			}
			break
		default:
			return 		
   }
   //==================================
   //set2dev(ttbuf);	
   //pdbuffer.totxbuff(ttbuf);
})

//=====================================================
app.get('/UV', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")|| (typeof(cstu) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
  
	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	let ttbuf = ""
   //let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s75cmd,'hex'); 
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		    pdbuffer.pdjobj.PDDATA.Devtab[pos].C75.sub=cmdindex;			
		    pdbuffer.pdjobj.PDDATA.Devtab[pos].C75.stu=nstu ;
		}else{
		   ttbuf[4]=0x55
		   return;
		}		
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x75		
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
   }else if(group <10 ){
	   //group Control command "sa0cmd" :  "[f5][fe][05][a0][00][00][00][a0]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.sa0cmd,'hex'); 		    
	   if(cmd in pdbuffer.pdjobj.subcmd){
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdbuffer.pdjobj.PDDATA.Devtab){				
				if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
						pdbuffer.pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
					}else{   
						if(ii.substring(0,1) == pos.substring(0,1)){
							pdbuffer.pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
						}
					}
				}				
		   }
	   }else{
		   ttbuf[4]=0x55
		   return;
	   }   
   }else{
	   //group is err
		return;
   }	   
   
   //==================================
   /* UV no Group control for Cube and Linkbox
   	ttbuf = Buffer.from(cmdcode.rs485v040.s75cmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C75.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C75.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "OFF":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "ON":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break	
		case "AUTO":
			//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
			ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
			ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
			ttbuf[3]= 0x75	
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
			}else {ssdatabuf = Buffer.from("000000000000",'hex');}
			for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
			break	
		case "LOW":
			return 		
			break	
		case "HI":
			return 	
			break
		default:
			return 		
	}  */
	//set2dev(ttbuf);=================	
	pdbuffer.totxbuff(ttbuf);   
})

//=====================================================
app.get('/CO2', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
  
	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s76cmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C76.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C76.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		//case "OFF":
		//	ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
		//	ttbuf[5]=nstu;
		//	break
		//case "ON":
		//	ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
		//	ttbuf[5]=nstu;
		//	break
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break
		case "SET":		//### 20180310 add set system Co2 value
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "LOW":		//### 20180310 add set system Co2 value by  alarm low
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "HI":		//### 20180310 add set system Co2 value by alarm high
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   pdbuffer.totxbuff(ttbuf);
})

//=====================================================
app.get('/TEMPERATURE', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);

	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	//let ttbuf = Buffer.from(cmdcode.rs485v040.s77cmd,'hex');
	//==================================
	ttbuf = Buffer.from(cmdcode.rs485v040.s77cmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C77.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C77.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system TEMPERATURE value by  alarm low
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system TEMPERATURE value by alarm high
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   pdbuffer.totxbuff(ttbuf);
})
//=====================================================
app.get('/RH', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
	jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
  
	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
   //let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s78cmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C78.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C78.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system RH value by  alarm low
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system RH value by alarm high
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   pdbuffer.totxbuff(ttbuf);
})
//=====================================================
app.get('/WATERLEVEL', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number(req.query.GROUP)
  let cstu = String(req.query.STU) // add the airfan 2ch control 
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  res.json(jobj);
  
   cmdindex=0
   nstu = Number('0x'+cstu)
   if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
   let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s79cmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C79.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C79.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system WATERLEVEL value by  alarm low
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system WATERLEVEL value by alarm high
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   pdbuffer.totxbuff(ttbuf);
})
//=====================================================
app.get('/ELECTRONS', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number(req.query.GROUP)
  let cstu = String(req.query.STU) // add the airfan 2ch control 
  console.log("EC group="+typeof(group)+"="+group)
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  res.json(jobj);
  
   cmdindex=0
   nstu = Number('0x'+cstu)
   if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
   //let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s7acmd,'hex');// "f500057a0000007a",
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C7A.sub=cmdindex;			
		//pdbuffer.pdjobj.PDDATA.Devtab[pos].C7A.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "ON":		
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			console.log("EC on c505 = ["+cstu+"]")
			if(cstu.length >= 4){	
				ttbuf[3]=Number('0x81');		
				ttbuf[7]=Number('0x81');		
				ttbuf[5]=Number('0x'+cstu.substring(0,2));
				ttbuf[6]=Number('0x'+cstu.substring(2,4));
			}
			break
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system ELECTRONS value by  alarm low
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system ELECTRONS value by alarm high
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   pdbuffer.totxbuff(ttbuf);
})
//=====================================================
app.get('/PH', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number(req.query.GROUP)
  let cstu = String(req.query.STU) // add the airfan 2ch control 
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  res.json(jobj);
  
   cmdindex=0
   nstu = Number('0x'+cstu)
   if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
   let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s7bcmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C7B.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C7B.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system PH value by  alarm low
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system PH value by alarm high
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   pdbuffer.totxbuff(ttbuf);
})
//=====================================================
app.get('/DeviceList', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number(req.query.GROUP)
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  if(cmd != "ON")res.json(jobj);
  
   //==================================   
   let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   if(pos == "0000"){
		if(cmd == "LOAD"){		  
			return; //Container no Load 0x70 for POS link stutas
			ct = devlinkscan(3);//1:cube device 2:linkbox 3:Container
			setTimeout(function() { 
				event.emit('devallscan_event'); 
			}, ct * 1520);		
		}else{		   
			//devalldatalink();
			j3obj={}
			j3obj.success="true"
			j3obj.UUID=setuuid;
			ondevlinkbuff(function(jj){
				j3obj.result = jj
				res.json(j3obj);
			});			
			return;
		}
   }else if(pos in pdbuffer.pdjobj.PDDATA.Devtab ){
		//if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){	
			if(cmd == "LOAD"){	   
				ct = devloadscan(pos);			
				setTimeout(function() { 
					event.emit('devposload_event',(pos)); 
				}, ct * 1520);//#### delay wait 	
			}else{
				//devposloaddata(pos);
				j3obj={}
				j3obj.success="true";
				j3obj.UUID=setuuid;		
				j3obj.POSTab = pos;
				//j3obj.GROUP=pdbuffer.pdjobj.PDDATA.Devtab[pos].C74.stu;
				j3obj.GROUP=pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP;
				j3obj.Status=pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK;
				ondevposbuff(pos,function(jj){		
					j3obj.result = jj;
					res.json(j3obj);
				});				
				return;
			}
		//}else{	
		//	console.log("no link="+pos+"#"+pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK)
		//	if(cmd == "ON")res.json(jobj);
		//	return;			
		//}
   }else{
		if(cmd == "ON")res.json(jobj);		
		return	   
   }
   //set2dev(ttbuf);
})


//=====================================================
app.get('/PWM', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj); 
	//=== command send ===
	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.s7ccmd,'hex');
	//use 0x7c pwm command by the linkbox device to sleep mode
	
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s7ccmd,'hex'); 
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		   //let cmdindex = pdbuffer.pdjobj.subcmd[cmd]
		   //ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
		   //ttbuf[5]=nstu;
		   //update to josn buffer 
			pdbuffer.pdjobj.PDDATA.Devtab[pos].C7C.sub=cmdindex;		
			pdbuffer.pdjobj.PDDATA.Devtab[pos].C7C.stu=0;
		}else{
		   //ttbuf[4]=0x55 no effect subcmd 
		   return;
		}
				
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x75		
				ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
	}else if(group < 10 ){
	   //group Control command "s9bcmd" :  "[f5][fe][05][9b][00][00][00][9b]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.s9bcmd,'hex'); //0x9b PWM group control 		    
	   if(cmd in pdbuffer.pdjobj.subcmd){
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[5]=nstu;
			ttbuf[6]=group;
			//group Control update to josn buffer
			for(ii in pdbuffer.pdjobj.PDDATA.Devtab){				
				if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='D' && ii.substring(0,0)=='D'){
						pdbuffer.pdjobj.PDDATA.Devtab[ii].C7C.sub=cmdindex;
					}
				}				
		   }
	   }else{
		   //ttbuf[4]=0x55
		   return;
	   }   
   }else{
	   //group is err
		return;
   }
	//==================================   
	//set2dev(ttbuf);	
	pdbuffer.totxbuff(ttbuf);
});

//=====================================================
app.get('/SETTIME', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
	let cstu = req.query.STU
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);

	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.s7dcmd,'hex');
	//==================================
   	//ttbuf = Buffer.from(cmdcode.rs485v040.s7dcmd,'hex'); 
	if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C7D.sub=cmdindex;			
		pdbuffer.pdjobj.PDDATA.Devtab[pos].C7D.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdbuffer.pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);//nstu = "hhmm" 
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
	//set2dev(ttbuf);	
	pdbuffer.totxbuff(ttbuf);
})
//=====================================================
app.get('/AUTO', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number(req.query.GROUP)
    let cstu = req.query.STU
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
  
	cmdindex=0
	nstu = Number('0x'+cstu)
	if(cmd in pdbuffer.pdjobj.subcmd)cmdindex = pdbuffer.pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.s7ecmd,'hex');
	//==================================
	
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s7ecmd,'hex'); 
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdbuffer.pdjobj.subcmd){ //check subcmd is working
		   //update to josn buffer 
			pdbuffer.pdjobj.PDDATA.Devtab[pos].C7E.sub=cmdindex;		
			pdbuffer.pdjobj.PDDATA.Devtab[pos].C7E.stu=nstu;
		}else{
		   ttbuf[4]=0x55 //no effect subcmd 
		   return;
		}				
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break				
			default:
				return 		
		}	
		
	}else if(group < 10 ){
		//group Control command "s97cmd" :  "[f5][fe][05][97][00][00][00][97]"
		ttbuf = Buffer.from(cmdcode.rs485v040.s9acmd,'hex'); //0x9a auto group control 		    
		if(cmd in pdbuffer.pdjobj.subcmd){
			ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
			ttbuf[5]=nstu;
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdbuffer.pdjobj.PDDATA.Devtab){				
				if(pdbuffer.pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='D' && ii.substring(0,0)=='D'){
						pdbuffer.pdjobj.PDDATA.Devtab[ii].C7E.sub=cmdindex;
					//}else{   
					//	if(ii.substring(0,1) == pos.substring(0,1)){
					//		pdbuffer.pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
					//	}
					}
				}				
			}
		}else{
			//ttbuf[4]=0x55
			return;
		}   
	}else{
		//group is err
		return;
	}
	
	//set2dev(ttbuf);	
	pdbuffer.totxbuff(ttbuf);
})


//=====================================================
//Linke gateway Start UP and login DDNS
//=====================================================
app.listen(setport, function () {    
	
	pdbuffer.sysload(function(){
		ddsnurl = pdbuffer.pdjobj.PDDATA.dsnurl;
		vdsnurl = pdbuffer.pdjobj.PDDATA.videodsnurl;
		devloadurl =  pdbuffer.pdjobj.PDDATA.devloadurl;		
		typeloadurl = pdbuffer.pdjobj.PDDATA.typeloadurl;

		setuuid =  pdbuffer.pdjobj.PDDATA.UUID;

		console.log("uuids = ", setuuid);
		console.log("dsnurl = ", ddsnurl);
		console.log("videodsnurl = ",vdsnurl);//devloadur
		console.log("devloadur = ", devloadurl)

		//res.send(req.query.appfile + ' ' + req.query.index);
		//res.send(webstr); 

		setInterval(function(){			
			//console.log("0xfc command check 0..."+global.arxokflag)
			if(global.arxokflag == true){
				//console.log("0xfc command check 1..."+global.arxokflag)
				pdbuffer.eventcall('arxbuff_event'); 
				global.arxokflag=false;
			}
		},150);

		setInterval(function(){			
			//console.log("0xfc command check 2..."+ch1com.rxokflag)
			if(global.rxokflag == true){
				//console.log("0xfc command check 3..."+global.rxokflag)
				pdbuffer.eventcall('rxbuff_event'); 
				global.rxokflag=false;
			}
		},160);

		if(pdbuffer.pdjobj.PDDATA.linkoffmode == 0){//ext web mode
			ngrok.connect(setport,function (err, url) {
				seturl = url
				chkurl = seturl+"/connectcheck"
				console.log("link=>"+seturl)
				setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
				client.get(setddsnurl, function (data, response) {
					// parsed response body as js object
					console.log("get ok...") 
					//console.log(data.toString());
					//raw response 
					//console.log(response.query);
					setInterval(function(){
					  //console.log('test link ...');
						chkurl = seturl+"/connectcheck"
						client.get(chkurl, function (data, response) {                        
							//console.log("linkchk ...")                        
							//console.log(data.toString());
							let chkstr = data.toString();
							if(chkstr === "ready"){                       
								console.log("linkchk ok ...",linkchkcount)
								linkchkcount=0;
								
								container_stulinkweb(sensorbuff[sbcount]);
								for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);				
								sbcount++;
								if(sbcount>=sbcountmax)sbcount=0;				
								for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min	
								
							} else {							                       
								console.log("linkchk fail ...",linkchkcount) 
								linkchkcount++;
								//relink DDNS for ngrok 
								if(((typeof seturl) == "undefined" ) || (linkchkcount >=3) ){
									console.log("get x11...") 
									reload105ddsn();
								}				
							}
							
						});
					}, 3 * 60 * 1000);
				});
			});
		}else if(pdbuffer.pdjobj.PDDATA.linkoffmode == 1){//off link mode
			console.log(">>OFF Link Mode !");
			setInterval(function(){				
				console.log(">>LOCAL server 192.268.5.220 Link Mode !");
				
				//device_stulinkweb(sensorbuff[sbcount]);
				//for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
				sbcount++;
				if(sbcount>=3)sbcount=0;				
				for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min					
			}, 3 * 60 * 1000);
			
		}else if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){//by 220 mode
			console.log(">>LOCAL server 192.268.5.220 Link Mode !");
			setInterval(function(){				
				console.log(">>LOCAL server 192.268.5.220 Link Mode !");
				container_stulinkweb(sensorbuff[sbcount]);
				for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
				sbcount++;
				if(sbcount>=3)sbcount=0;				
				for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min	
			}, 3 * 60 * 1000);			
			
		}
		console.log('Example app listening on port 3000!');	
	});
	 

});


function reload75ddsn(){	
    console.log('recall ngrok ...');
	ngrok.connect('192.168.5.75:3000',function (err, url) {
		seturl = url
        chkurl = seturl+"/connectcheck"
		console.log("link linkbox75C=>"+seturl);
        setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
		client.get(setddsnurl, function (data, response) {
			console.log("get ok...") 				
		});			
	});
}

function reload85ddsn(){	
    console.log('recall ngrok ...');
	ngrok.connect('192.168.5.85:3000',function (err, url) {
		seturl = url
        chkurl = seturl+"/connectcheck"
		console.log("link Cube85C=>"+seturl);
        setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
		client.get(setddsnurl, function (data, response) {
			console.log("get ok...") 				
		});			
	});
}

function reload105ddsn(){	
    console.log('recall ngrok ...');
	ngrok.connect('192.168.5.105:3000',function (err, url) {
		seturl = url
        chkurl = seturl+"/connectcheck"
		console.log("link container OPL002=>"+seturl);
        setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
		client.get(setddsnurl, function (data, response) {
			console.log("get ok...") 				
		});			
	});
}
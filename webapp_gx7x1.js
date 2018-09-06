console.log("[linkgateway ] start Container gx7 20180331x1 ...");

var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 

const express = require('express')
const app = express()

var bodyParser = require('body-parser');
var ngrok = require('ngrok');

var Client = require('node-rest-client').Client;
var client = new Client();
 
var path = require('path');
var fs = require('fs');
var os = require('os');

var util = require('util');

var cmdcode = require("./handelrs485");
var ch1com = require('./utx7x1')// rec oxfa and 0xfc command 
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
var activekeyurl = "http://106.104.112.56/Cloud/API/DeviceStatus.php"

var setddsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&UUID='+setuuid
var setvdsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&DevicePOS='+setdeviceport+'&UUID='+setuuid
var setdevouturl = devloadurl+"?UUID="+setuuid+"&result="+"{}"
//load startup paramemt for uuid
//var filename = "uuiddata.txt"
var filename = "PDDATA.txt"
var filepath = path.join(__dirname, ("/public/" + filename));
var pdjobj ={}

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

//=== alarm key event ===
var alarmbuff = [];
var alarmloadurl = "http://127.0.0.1:3001/alarm"

function toalarmoutbuff(kdev){
	alarmbuff.push(JSON.stringify(kdev))	
	if(alarmbuff.length==1){			
		setTimeout(function(){event.emit('sendalarm_event')},10);	
	}	
}

event.on('sendalarm_event', function() { 
	if(alarmbuff.length>0){	
	        sdev = alarmbuff.shift();
			console.log("type ="+typeof(sdev)+" data="+sdev);
			//setdevouturl = key105loadurl+"?KEY="+"&STATE="+"&EVENT=";       
			console.log("url="+setdevouturl);
            //client.get(setdevouturl, function (data, response) {				
			//});
			setTimeout(function(){event.emit('sendalarm_event')},10);		
	}
});


var keypadbuff =[];
var key105loadurl =  "http://127.0.0.1:3001/keypad"  //localhost:3001/keypad?KEY=94&STATE=00&EVENT=2

function tokeypadoutbuff(kdev){
	keypadbuff.push(JSON.stringify(kdev))	
	if(keypadbuff.length==1){			
		setTimeout(function(){event.emit('sendkeypad_event')},10);	
	}	
}

event.on('sendkeypad_event', function() { //FCC10681019E010281
	if(keypadbuff.length>0){	
		sdev = keypadbuff.shift();
		sdevkey = sdev.substring(11,13);
		sdevstu = sdev.substring(13,15);
		sdevevent = sdev.substring(15,17);
		console.log("type ="+typeof(sdev)+" data="+sdev);
		setdevouturl = key105loadurl+"?KEY="+sdevkey+"&STATE="+sdevstu+"&EVENT="+sdevevent;       
		console.log("url="+setdevouturl);
        client.get(setdevouturl, function (data, response) {});
		setTimeout(function(){event.emit('sendkeypad_event')},10);		
	}
});



//=== DeviceList return to Restful API ===
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
	for(pos in pdjobj.PDDATA.Devtab){				
		if(pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){
			jpos.POSTab = pos;
			jpos.GROUP =  Number(pdjobj.PDDATA.Devtab[pos].STATU.GROUP)%10;
			if( typeof(jpos.GROUP) == 'object' )jpos.GROUP = 0;
			jpos.Status = pdjobj.PDDATA.Devtab[pos].STATU.LINK;
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
	if((spos in pdjobj.PDDATA.Devtab)== false)callback(jload);
	//jpos={"POSTab":spos,"group":"0"}
	console.log("sop="+spos)
	jdev={"CMD":0,"sub":0,"stu":0,"Data":0}
	for(scmd in  pdjobj.PDDATA.Devtab[spos]){
		if(scmd != "STATU"){			
			vkey = cmdcode.apicmdtype[scmd]
			jdev.CMD = vkey
			jdev.sub = pdjobj.PDDATA.Devtab[spos][scmd].sub
			jdev.stu = pdjobj.PDDATA.Devtab[spos][scmd].stu
			jdev.Data = pdjobj.PDDATA.Devtab[spos][scmd].Data
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
	for(pos in pdjobj.PDDATA.Devtab){				
		if(pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){
			jpos.POSTab = pos;
			jpos.GROUP =  Number(pdjobj.PDDATA.Devtab[pos].STATU.GROUP)%10;
			if( typeof(jpos.GROUP) == 'object' )jpos.GROUP = 0;
			jpos.Status = pdjobj.PDDATA.Devtab[pos].STATU.LINK;
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
	if((spos in pdjobj.PDDATA.Devtab)== false)return
	let jload = []
	//jpos={"POSTab":spos,"group":"0"}
	console.log("sop="+spos)
	jdev={"CMD":0,"sub":0,"stu":0,"Data":0}
	for(scmd in  pdjobj.PDDATA.Devtab[spos]){
		if(scmd != "STATU"){			
			vkey = cmdcode.apicmdtype[scmd]
			jdev.CMD = vkey
			jdev.sub = pdjobj.PDDATA.Devtab[spos][scmd].sub
			jdev.stu = pdjobj.PDDATA.Devtab[spos][scmd].stu
			jdev.Data = pdjobj.PDDATA.Devtab[spos][scmd].Data
			//console.log("key="+vkey)
			//console.log("data="+ pdjobj.PDDATA.Devtab[spos][scmd].sub)
			jload.push(jobjcopy(jdev));
		}
	}
	
	jpos={"POSTab":"0000","GROUP":0,"Status":0,"result":0}	
	jpos.GROUP =  Number(pdjobj.PDDATA.Devtab[spos].STATU.GROUP);
	jpos.POSTab = spos
	jpos.Status = pdjobj.PDDATA.Devtab[spos].STATU.LINK;
	jpos.result = jload
	todevoutbuff(jpos);		
}

event.on('devposload_event', function(spos) { //pos on
	devposloaddata(spos);
});

function devloadtobuff(sub02cmd){	
	console.log("check 02 rxcmd = "+sub02cmd)
	sdevadd = sub02cmd.substring(2,4);//get devadd map to pos
	sdevpos = pdjobj.addposmap[sdevadd];
	sdevcmd = "C"+sub02cmd.substring(6,8);//get devadd map to cmd
	switch(sdevcmd){
		case "C70":
			sdevgroup = sub02cmd.substring(13,14);//Group <10	FA270570D017C057
			pdjobj.PDDATA.Devtab[sdevpos].STATU.GROUP = Number(sdevgroup);			
			break
		case "C71"://LED data STU=0100
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevstau   = sub02cmd.substring(10,12);
			pdjobj.PDDATA.Devtab[sdevpos].C71.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C71.stu = Number(sdevstau)			
			break
		case "C72"://PUMP
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevstau   = sub02cmd.substring(10,12);
			pdjobj.PDDATA.Devtab[sdevpos].C72.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C72.stu = Number(sdevstau)			
			break
		case "C73"://FAN
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevstau   = sub02cmd.substring(10,12);
			pdjobj.PDDATA.Devtab[sdevpos].C73.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C73.stu = Number(sdevstau)			
			break
		case "C74"://GROUP
			sdevsubcmd = sub02cmd.substring(8,10);//FA250474000377
			sdevgroup  = sub02cmd.substring(11,12);//Group <10	
			pdjobj.PDDATA.Devtab[sdevpos].C74.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C74.stu = parseInt(sdevgroup,16);
			pdjobj.PDDATA.Devtab[sdevpos].STATU.GROUP = parseInt(sdevgroup,16);
			break
		case "C75"://UV
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevstau   = sub02cmd.substring(10,12);//1 byte
			if(sdevsubcmd =="02" ){				
				pdjobj.PDDATA.Devtab[sdevpos].C75.sub = Number(sdevstau)	
			}else{			
				pdjobj.PDDATA.Devtab[sdevpos].C75.sub = Number(sdevsubcmd)
				pdjobj.PDDATA.Devtab[sdevpos].C75.stu = Number(sdevstau)	
			}
			break
		case "C76"://Co2
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data
			pdjobj.PDDATA.Devtab[sdevpos].C76.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C76.stu = parseInt(sdevdata,16);
			break
		case "C77"://TM
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data
			pdjobj.PDDATA.Devtab[sdevpos].C77.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C77.stu =  parseInt(sdevdata,16);	
			break
		case "C78"://RH
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data fa67057802021978
			console.log("pos="+sdevpos+"sdata ="+sdevdata)
			pdjobj.PDDATA.Devtab[sdevpos].C78.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C78.stu = parseInt(sdevdata,16);	
			break
		case "C79":
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data
			pdjobj.PDDATA.Devtab[sdevpos].C79.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C79.stu =  parseInt(sdevdata,16);	
			break
		case "C7A":
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data
			pdjobj.PDDATA.Devtab[sdevpos].C7A.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C7A.stu =  parseInt(sdevdata,16);	
			break
		case "C7B":
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data
			pdjobj.PDDATA.Devtab[sdevpos].C7B.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C7B.stu =  parseInt(sdevdata,16);	
			break
		case "C7C":
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata   = sub02cmd.substring(10,14);//2 byte data
			pdjobj.PDDATA.Devtab[sdevpos].C7C.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C7C.stu = sdevdata	
			break	
		case "C7E":
			sdevsubcmd = sub02cmd.substring(8,10);
			sdevdata1   = sub02cmd.substring(10,12);//2 byte data			
			sdevdata2   = sub02cmd.substring(12,14);//2 byte data
			hh =  parseInt(sdevdata1,16);	
			mm =  parseInt(sdevdata2,16);	
			pdjobj.PDDATA.Devtab[sdevpos].C7E.sub = Number(sdevsubcmd)
			pdjobj.PDDATA.Devtab[sdevpos].C7E.stu = hh.toString()+mm.toString()
			break
		default:
			return 
	}
		
}

function devalarmbuff(alarmcmd){//fcc10681019f010381
	//check pos onlink
	sdevadd = alarmcmd.substring(2,4);
	sdevcmd = alarmcmd.substring(6,8);
	
	if(sdevadd == "C1" && sdevcmd == "81"){
		tokeypadoutbuff(alarmcmd);
		
	}else{
		alarmbuff.push(alarmcmd);
	}
	//if()
	
}

//=== buffer tx loop 1 by 1 ====
var sstxbuff=[];
function totxbuff(ttbuf){
	let scmd = ttbuf.toString('hex')
	sstxbuff.push(scmd)
	if (sstxbuff.length == 1){
		//event.emit('txbuff_event'); 
		console.log("start tx run ... ")
		setTimeout(function() { 
			event.emit('txbuff_event'); 
		}, 30);	
	}
}
event.on('txbuff_event', function() { 
	if(sstxbuff.length > 0){
	   scmd = sstxbuff.shift();
	   ch1com.qqsendcmd(scmd,function(){	   
		   console.log(">>> rxbuff timeout check ...")
			//setTimeout(function() { 
			//	event.emit('rxbuff_event'); 
			//}, 1500); //#### tx bufffer dealy 1300ms ???
	   });			
	}
});

//0xF5,addr,0x02,0x50,0x50
//F5,addr,0x05,0x70,[pos1][pos2],[gorup],0x70 
event.on('rxbuff_event', function() { //####
	if(ch1com.qrxcmd.length > 0){
		console.log("rxleng="+ch1com.qrxcmd.length );
		//ss = ch1com.qrxcmd.shift()
		ssbuf = ch1com.qrxcmdshift();
		ss = ssbuf.toUpperCase();
		console.log("<<< show cmd rx: " + ss)
		//check pos onlink
		startkey = ss.substring(0,2);//0xfa or 0xfc
		sdevadd = ss.substring(2,4);
		sdevcmd = ss.substring(6,8);
		if(startkey == "FC"){
			devalarmbuff(ss);//add to alarmbuff[]
		}else{			
			if(sdevcmd == "70"){
				sdevpos = ss.substring(8,12); 
				sdevgroup = ss.substring(13,14);
				//pdjobj.addposmap[sdevadd] = sdevpos //### only use in linkbox
				if(sdevpos in pdjobj.PDDATA.Devtab){//update the devtab pos
					pdjobj.PDDATA.Devtab[sdevpos].STATU.devadd = Number("0x"+sdevadd);		
					pdjobj.PDDATA.Devtab[sdevpos].STATU.LINK = 1;
					pdjobj.PDDATA.Devtab[sdevpos].STATU.GROUP =  Number(sdevgroup)%10;
				}else{//add a new pos to devtab
					if(sdevpos in cmdcode.devtablib){//###
						posdata = cmdcode.devtablib[sdevpos]
						//console.log("show pos ,dev  "+sdevpos+" "+sdevadd)
						pdjobj.PDDATA.Devtab[sdevpos]=jobjcopy(posdata);
						pdjobj.PDDATA.Devtab[sdevpos].STATU.devadd = Number("0x"+sdevadd);		
						pdjobj.PDDATA.Devtab[sdevpos].STATU.LINK = 1;
						pdjobj.PDDATA.Devtab[sdevpos].STATU.GROUP = Number(sdevgroup)%10;
					}
				}
			}else{// ask cmd 0x50				
				sdevpos = pdjobj.addposmap[sdevadd];
				console.log("show pos ,dev  "+sdevpos+" "+sdevadd)
				if(sdevpos in pdjobj.PDDATA.Devtab)pdjobj.PDDATA.Devtab[sdevpos].STATU.LINK = 1;
				//check load subcmd			
				//when suncmd == 02 is load pos status 
				sdevsubcmd = ss.substring(8,10);	
				console.log("rx subcmd chek = "+sdevsubcmd)
				if(sdevsubcmd == '02')devloadtobuff(ss);//when load command will to setup buffer
			}	
		}
	}else{		
		console.log("<<< show cmd rx timeOut Fail rxleng="+ch1com.qrxcmd.length );
	}
	if(sstxbuff.length > 0){	
		setTimeout(function() { 
			event.emit('txbuff_event'); 
		}, 30);	
		//event.emit('txbuff_event'); 
	}	
})

event.on('devallposchk_event', function() {
	
});

//===========================
//0xF5,addr,0x02,0x50,0x50
//F5,addr,0x05,0x70,[pos1][pos2],[gorup],0x70 
event.on('arxbuff_event', function() { //####
	if(ch1com.aqrxcmd.length > 0){
		console.log("rxleng="+ch1com.aqrxcmd.length );
		//ss = ch1com.qrxcmd.shift()
		ssbuf = ch1com.aqrxcmdshift();
		ss = ssbuf.toUpperCase();
		console.log("<<< show cmd rx: " + ss)
		//check pos onlink
		startkey = ss.substring(0,2);//0xfa or 0xfc
		sdevadd = ss.substring(2,4);
		sdevcmd = ss.substring(6,8);
		if(startkey == "FC"){
			devalarmbuff(ss);//add to alarmbuff[]
		}
	}else{		
		console.log("<<< show cmd rx timeOut Fail rxleng="+ch1com.aqrxcmd.length );
	}
})


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
			for(pos in pdjobj.PDDATA.Devtab){		
				ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
				pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				console.log(">>>"+ttbuf.toString('hex'))		
				totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}	
			return poscount;
			break
		case 2:				
			//scan by devadd define for linkbox only
			ttbuf = Buffer.from(cmdcode.rs485v040.s70cmd,'hex');
			for(pos in pdjobj.PDDATA.Devtab){
				pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				if(pdjobj.PDDATA.Devtab[pos].STATU.GROUP>9)pdjobj.PDDATA.Devtab[pos].STATU.GROUP=0
			}
			for(sadd in pdjobj.addposmap){	
				pos = pdjobj.addposmap.sadd;
				ttbuf[1]= Number("0x"+sadd);
				//if(pos in pdjobj.PDDATA.Devtab)pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				console.log(">>>"+ttbuf.toString('hex'))		
				totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}	
			return poscount;
			break
		case 3:				
			//scan by devadd define for Container only by scangroup(<16 by 3min)
			return 0;//cube can not be sacn device add
			ttbuf = Buffer.from(cmdcode.rs485v040.s70cmd,'hex');
			for(pos in pdjobj.PDDATA.Devtab){
				pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				if(pdjobj.PDDATA.Devtab[pos].STATU.GROUP>9)pdjobj.PDDATA.Devtab[pos].STATU.GROUP=0
			}
			for(sadd in pdjobj.addposmap){	
				pos = pdjobj.addposmap.sadd;
				ttbuf[1]= Number("0x"+sadd);
				//if(pos in pdjobj.PDDATA.Devtab)pdjobj.PDDATA.Devtab[pos].STATU.LINK = 0;
				console.log(">>>"+ttbuf.toString('hex'))		
				totxbuff(ttbuf);//query to tx buffer 
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
	if(spos in pdjobj.PDDATA.Devtab){		
		sdevadd = pdjobj.PDDATA.Devtab[spos].STATU.devadd;
		//ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
		for(cmd in pdjobj.PDDATA.Devtab[spos]){			
			if(cmd == "STATU"){
				console.log("Pass the STATU cmd ...");
			}else{				
				txtype = cmdcode.subcmdtype[cmd];
				ttbuf = Buffer.from(cmdcode.rs485v040[txtype],'hex');		
				ttbuf[1]= sdevadd;
				ttbuf[4]= 2;		
				console.log(">>>"+ttbuf.toString('hex'))		
				totxbuff(ttbuf);//query to tx buffer 
				poscount++;
			}
		}		
	}
	return poscount;
}

//channel check devloadscn ### 20180322
function devchannelscan(spos){
	let poscount = 0
	if(spos in pdjobj.PDDATA.Devtab){		
		sdevadd = pdjobj.PDDATA.Devtab[spos].STATU.devadd;
		//ttbuf = Buffer.from(cmdcode.rs485v029.ackcmd,'hex');
		
		for(cmd in pdjobj.PDDATA.Devtab[spos]){	
			if(cmd == "STATUxxx"){
				console.log("Pass the STATU cmd ...");
			}else{				
				if("chtab" in pdjobj.PDDATA.Devtab[spos][cmd]){
					//then this cmd have channel table in Json
					for(chcode in pdjobj.PDDATA.Devtab[spos][cmd]["chtab"]){					
						txtype = cmdcode.subcmdtype[cmd];
						ttbuf = Buffer.from(cmdcode.rs485v029[txtype],'hex');		
						ttbuf[1]= sdevadd;
						ttbuf[4]= 2;//load subcmd		
						ttbuf[5]= parseInt(chcode,16);//Number(chcode);//### load stu by channel
						console.log("chtab load cmd>>>"+ttbuf.toString('hex'))		
						totxbuff(ttbuf);//query to tx buffer 
						poscount++;							
					}
				}else{			
					txtype = cmdcode.subcmdtype[cmd];
					ttbuf = Buffer.from(cmdcode.rs485v029[txtype],'hex');		
					ttbuf[1]= sdevadd;
					ttbuf[4]= 2;// standy load no channel so stu=00		
					console.log(">>>"+ttbuf.toString('hex'))		
					totxbuff(ttbuf);//query to tx buffer 
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
			if(pdjobj.PDDATA.Devtab[ii].STATU.LINK == 1){
				dobj.POSTab=ii;
				dobj.GROUP=pdjobj.PDDATA.Devtab[ii].STATU.GROUP;
				dobj.Status=pdjobj.PDDATA.Devtab[ii].STATU.LINK;
				jload.result.push(jobjcopy(dobj));			
			}
		}	
	}else{
		//reload all device
		for(ii in pdjobj.PDDATA.Devtab){
			if(pdjobj.PDDATA.Devtab[ii].STATU.LINK == 1){
				dobj.POSTab=ii;
				dobj.GROUP=pdjobj.PDDATA.Devtab[ii].STATU.GROUP;
				dobj.Status=pdjobj.PDDATA.Devtab[ii].STATU.LINK;
				jload.result.push(jobjcopy(dobj));			
			}
		}		
	}
	if(pdjobj.PDDATA.linkoffmode == 2){	
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
	if(lpos in pdjobj.PDDATA.Devtab ){		
		lljob=pdjobj.PDDATA.Devtab[lpos]
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
		if(pdjobj.PDDATA.linkoffmode == 2){	
			settypeloadurl = offtypeloadurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);
		}else{
			settypeloadurl = typeloadurl+'?UUID='+setuuid+'&DerviceType='+JSON.stringify(jload);			
		}			
		console.log(settypeloadurl)
		client.get(settypeloadurl, function (data, response) {console.log("reload devtab pos to web link !"+data.toString())});	
	}
}

function typechannellinkweb(chpos){	
	if(chpos in pdjobj.PDDATA.Devtab ){
		ccjob=pdjobj.PDDATA.Devtab[chpos];
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
		if(pdjobj.PDDATA.linkoffmode == 2){	
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
			lljob=pdjobj.PDDATA.Devtab[spos]
			console.log(">>link pos = "+spos)			
			for(jj in lljob){
				if(jj in sensorcmdtab){	
					dobj.DevicePOS = spos;
					dobj.Status= cmdtab[jj];
					dobj.Value = lljob[jj].stu;
					if(pdjobj.PDDATA.linkoffmode == 2){	
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
			lljob=pdjobj.PDDATA.Devtab[spos]
			console.log(">>link pos = "+spos)
			for(jj in lljob){
				if(jj in sensorcmdtab){		
					dobj.DevicePOS = spos;
					dobj.Status= cmdtab[jj];
					dobj.Value = lljob[jj].stu;	
					if(pdjobj.PDDATA.linkoffmode == 2){	
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
	//setTimeout(function() { 
	//			event.emit('devallposchk_event'); 
	//		}, ct * 550);
});

app.get('/loadcheck', function (req, res) {
    //console.log(req.body)
    console.log(req.query.pin);
    res.send("ready");
	//ct = devlinkscan(1);//1:cube device 2:linkbox
	//setTimeout(function() { 
	//		event.emit('devallposchk_event'); 
	//}, ct * 550);
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
	//setTimeout(function() { 
	//			event.emit('devallposchk_event'); 
	//		}, ct * 550);
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
	if(group in pdjobj.PDDATA ){
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
					let uuiddata = JSON.stringify(pdjobj);					
					fs.writeFile(filepath,uuiddata,function(error){
						if(error){ //如果有錯誤，把訊息顯示並離開程式
							console.log('PDDATA.txt update ERR ! ');							
							jobj = { "success" : "false" };  
						}
					});
					break
				case "LOAD":
					if(poslength == 2){						
						jstu = pdjobj.PDDATA.Devtab[posarr[0]][posarr[1]];
					}else{	
						console.log("devkey ="+posarr[0]);					
						jstu = pdjobj.PDDATA.Devtab[posarr[0]];
					}
					jobj.GROUP =  group;
					jobj.STU = jstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="LOAD"
					break	
				case "SET":
					if(poslength == 2){		
						pdjobj.PDDATA.Devtab[posarr[0]][posarr[1]] = jstu;
					}
					if(poslength == 1){							
						pdjobj.PDDATA.Devtab[posarr[0]] = jstu;
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
					let uuiddata = JSON.stringify(pdjobj);					
					fs.writeFile(filepath,uuiddata,function(error){
						if(error){ //如果有錯誤，把訊息顯示並離開程式
							console.log('PDDATA.txt DEVtab update ERR ! ');							
							jobj = { "success" : "false" };  
						}
					});
					break
				case "LOAD":
					cstu = pdjobj.PDDATA[group];
					jobj.GROUP =  group;
					jobj.STU = cstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="LOAD"
					break	
				case "SET":
					pdjobj.PDDATA[group]= cstu;
					ddsnurl = pdjobj.PDDATA.dsnurl;
					vdsnurl = pdjobj.PDDATA.videodsnurl;
					devloadurl =  pdjobj.PDDATA.devloadurl;
					setuuid =  pdjobj.PDDATA.UUID;
					
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
				let uuiddata = JSON.stringify(pdjobj);					
				fs.writeFile(filepath,uuiddata,function(error){
					if(error){ //如果有錯誤，把訊息顯示並離開程式
						console.log('PDDATA.txt DEVtab update ERR ! ');							
						jobj = { "success" : "false" };  
					}
				});
				break
			case "LOAD":
				if(pos=="00"){
					cstu = pdjobj.addposmap
				}else{					
					cstu = pdjobj.addposmap[pos];
				}
				jobj.GROUP =  group;
				jobj.STU = cstu
				jobj.UUID= uuid
				jobj.POS= pos
				jobj.Action="LOAD"
				break	
			case "SET":
				if(pos=="00"){
					pdjobj.addposmap = JSON.parse(cstu);
				}else{					
					pdjobj.addposmap[pos] = cstu;
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	nstu = Number('0x'+cstu)
	let ttbuf = ""
	if(group==0){
		//dev active
		//ttbuf = Buffer.from(cmdcode.rs485v040.s71cmd,'hex'); //"[f5][00][04][71][00][00][00][71]""f500047100000071"
		ttbuf = Buffer.from(cmdcode.rs485v040.s71chcmd,'hex'); //"[ 0][ 1][ 2][ 3][ 4][ 5][ 6][ 7]""f500047100000071"
		if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdjobj.subcmd){ //check subcmd is working
			let cmdindex = pdjobj.subcmd[cmd]
			ledch = cstu.substring(0,2);//ch
			ledlev = cstu.substring(2,4);//lev
			//console.log("sop="+JSON.stringify(pdjobj.PDDATA.Devtab[pos][cmd]);
			//kss='chtab'
			//if( kss  in pdjobj.PDDATA.Devtab[pos][cmd]){
			//	pdjobj.PDDATA.Devtab[pos][cmd][kss][ledch].sub=cmdindex;	
			//	pdjobj.PDDATA.Devtab[pos][cmd][kss][ledch].stu=cstu;	
			//}else{				
				pdjobj.PDDATA.Devtab[pos].C71.sub=cmdindex;		
				pdjobj.PDDATA.Devtab[pos].C71.stu=cstu;
			//}
		}else{
		   ttbuf[4]=0x55
		   return;
		}
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]= Number('0x'+cstu.substring(0,2));//ch		Number('0x'+cstu.substring(0,2))	
				ttbuf[6]= Number('0x'+cstu.substring(2,4));//level   Number('0x'+cstu.substring(2,4))	
				break
			case "ON":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=Number('0x'+cstu.substring(0,2));//ch		Number('0x'+cstu.substring(0,2))		
				ttbuf[6]=Number('0x'+cstu.substring(2,4));//level   Number('0x'+cstu.substring(2,4))	
				break
			case "LOAD":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
	}else if(group <20 ){
	   //group LED Control command "s96chcmd" :  "f5,fe,05,96,00,00,00,00,96",
	   ttbuf = Buffer.from(cmdcode.rs485v040.s96chcmd,'hex'); 		    
	   if(cmd in pdjobj.subcmd){
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[5]=Number('0x'+cstu.substring(0,2));//ch
			ttbuf[6]=Number('0x'+cstu.substring(2,4));//level
			ttbuf[7]=group
			//group Control update to josn buffer
			//for(ii in pdjobj.PDDATA.Devtab){				
			//	if(pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
			//		if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
			//			pdjobj.PDDATA.Devtab[ii].C71.sub=cmdindex;
			//		}else{   
			//			if(ii.substring(0,1) == pos.substring(0,1)){
			//				pdjobj.PDDATA.Devtab[ii].C71.sub=cmdindex;
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
	totxbuff(ttbuf);
   
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	nstu = Number('0x'+cstu)
	let ttbuf = ""
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s72cmd,'hex'); 
		if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdjobj.subcmd){ //check subcmd is working
		    pdjobj.PDDATA.Devtab[pos].C72.sub=cmdindex;			
		    pdjobj.PDDATA.Devtab[pos].C72.stu=0;
		}else{
		   ttbuf[4]=0x55
		   return;
		}		
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x72	//### S72auto data to stu array
				ttbuf[4]= pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
   }else if(group <10 ){
	   //group Control command "s97cmd" :  "[f5][fe][05][97][00][00][00][97]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.s97cmd,'hex'); 		    
	   if(cmd in pdjobj.subcmd){
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdjobj.PDDATA.Devtab){				
				if(pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
						pdjobj.PDDATA.Devtab[ii].C72.sub=cmdindex;
					}else{   
						if(ii.substring(0,1) == pos.substring(0,1)){
							pdjobj.PDDATA.Devtab[ii].C72.sub=cmdindex;
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
   totxbuff(ttbuf);
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	let ttbuf = ""
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s73cmd,'hex'); 
		if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdjobj.subcmd){ //check subcmd is working
		   //update to josn buffer 
		    pdjobj.PDDATA.Devtab[pos].C73.sub=cmdindex;			
		    pdjobj.PDDATA.Devtab[pos].C73.stu=nstu ;
		}else{
		   ttbuf[4]=0x55
		   return;
		}		
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x73			
				ttbuf[4]= pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
   }else if(group <10 ){
	   //group Control command "s97cmd" :  "[f5][fe][05][97][00][00][00][97]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.s98cmd,'hex'); 		    
	   if(cmd in pdjobj.subcmd){
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdjobj.PDDATA.Devtab){				
				if(pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
						pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
					}else{   
						if(ii.substring(0,1) == pos.substring(0,1)){
							pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
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
   totxbuff(ttbuf);
   
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
   if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
   let ttbuf = Buffer.from(cmdcode.rs485v040.s74cmd,'hex');
   //console.log("group cmd = "+cmd+" "+pos+" "+typeof(group))
   //"s74cmd" :  "[f5][00][04][74][00][00][74]"   
   switch(cmd){
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			if(group <10 ){
				ttbuf[5]= group;
				totxbuff(ttbuf);
			}
			break
		case "SET":			
			ttbuf[4]= pdjobj.subcmd[cmd];
			ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			if(group < 10 ){
				ttbuf[5]= group
				pdjobj.PDDATA.Devtab[pos].STATU.GROUP = group
				totxbuff(ttbuf);
			}else{
				return
			}
			break
		default:
			return 		
   }
   //==================================
   //set2dev(ttbuf);	
   //totxbuff(ttbuf);
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	let ttbuf = ""
   //let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s75cmd,'hex'); 
		if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdjobj.subcmd){ //check subcmd is working
		    pdjobj.PDDATA.Devtab[pos].C75.sub=cmdindex;			
		    pdjobj.PDDATA.Devtab[pos].C75.stu=nstu ;
		}else{
		   ttbuf[4]=0x55
		   return;
		}		
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x75		
				ttbuf[4]= pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
   }else if(group <10 ){
	   //group Control command "sa0cmd" :  "[f5][fe][05][a0][00][00][00][a0]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.sa0cmd,'hex'); 		    
	   if(cmd in pdjobj.subcmd){
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdjobj.PDDATA.Devtab){				
				if(pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='A' && ii.substring(0,0)=='A'){
						pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
					}else{   
						if(ii.substring(0,1) == pos.substring(0,1)){
							pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
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
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C75.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C75.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "OFF":
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "ON":
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break	
		case "AUTO":
			//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
			ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
			ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
			ttbuf[3]= 0x75	
			ttbuf[4]= pdjobj.subcmd[cmd];				
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
	totxbuff(ttbuf);   
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s76cmd,'hex'); 
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C76.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C76.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		//case "OFF":
		//	ttbuf[4]=pdjobj.subcmd[cmd];				
		//	ttbuf[5]=nstu;
		//	break
		//case "ON":
		//	ttbuf[4]=pdjobj.subcmd[cmd];				
		//	ttbuf[5]=nstu;
		//	break
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break
		case "SET":		//### 20180310 add set system Co2 value
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "LOW":		//### 20180310 add set system Co2 value by  alarm low
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		case "HI":		//### 20180310 add set system Co2 value by alarm high
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]=nstu;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   totxbuff(ttbuf);
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	//let ttbuf = Buffer.from(cmdcode.rs485v040.s77cmd,'hex');
	//==================================
	ttbuf = Buffer.from(cmdcode.rs485v040.s77cmd,'hex'); 
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C77.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C77.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system TEMPERATURE value by  alarm low
			ttbuf[4]=pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system TEMPERATURE value by alarm high
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   totxbuff(ttbuf);
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
   //let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s78cmd,'hex'); 
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C78.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C78.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system RH value by  alarm low
			ttbuf[4]=pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system RH value by alarm high
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   totxbuff(ttbuf);
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
   if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
   let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s79cmd,'hex'); 
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C79.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C79.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system WATERLEVEL value by  alarm low
			ttbuf[4]=pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system WATERLEVEL value by alarm high
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   totxbuff(ttbuf);
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
   if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
   //let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s7acmd,'hex');// "f500057a0000007a",
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C7A.sub=cmdindex;			
		//pdjobj.PDDATA.Devtab[pos].C7A.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "ON":		
			ttbuf[4]=pdjobj.subcmd[cmd];
			console.log("EC on c505 = ["+cstu+"]")
			if(cstu.length >= 4){	
				ttbuf[3]=Number('0x81');		
				ttbuf[7]=Number('0x81');		
				ttbuf[5]=Number('0x'+cstu.substring(0,2));
				ttbuf[6]=Number('0x'+cstu.substring(2,4));
			}
			break
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system ELECTRONS value by  alarm low
			ttbuf[4]=pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system ELECTRONS value by alarm high
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   totxbuff(ttbuf);
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
   if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
   let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   //==================================
   	ttbuf = Buffer.from(cmdcode.rs485v040.s7bcmd,'hex'); 
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C7B.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C7B.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "LOW":		//### 20180313 add set system PH value by  alarm low
			ttbuf[4]=pdjobj.subcmd[cmd];					
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		case "HI":		//### 20180313 add set system PH value by alarm high
			ttbuf[4]=pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);		
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
   //set2dev(ttbuf);	
   totxbuff(ttbuf);
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
   }else if(pos in pdjobj.PDDATA.Devtab ){
		//if(pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){	
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
				//j3obj.GROUP=pdjobj.PDDATA.Devtab[pos].C74.stu;
				j3obj.GROUP=pdjobj.PDDATA.Devtab[pos].STATU.GROUP;
				j3obj.Status=pdjobj.PDDATA.Devtab[pos].STATU.LINK;
				ondevposbuff(pos,function(jj){		
					j3obj.result = jj;
					res.json(j3obj);
				});				
				return;
			}
		//}else{	
		//	console.log("no link="+pos+"#"+pdjobj.PDDATA.Devtab[pos].STATU.LINK)
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.s7ccmd,'hex');
	//use 0x7c pwm command by the linkbox device to sleep mode
	
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s7ccmd,'hex'); 
		if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdjobj.subcmd){ //check subcmd is working
		   //let cmdindex = pdjobj.subcmd[cmd]
		   //ttbuf[4]=pdjobj.subcmd[cmd];
		   //ttbuf[5]=nstu;
		   //update to josn buffer 
			pdjobj.PDDATA.Devtab[pos].C7C.sub=cmdindex;		
			pdjobj.PDDATA.Devtab[pos].C7C.stu=0;
		}else{
		   //ttbuf[4]=0x55 no effect subcmd 
		   return;
		}
				
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "AUTO":
				//F5,aa,09,71,03,d0,d1,d2,d3,d4,d5,71
				ttbuf = Buffer.from(cmdcode.rs485v040.s71autocmd,'hex');
				ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;	
				ttbuf[3]= 0x75		
				ttbuf[4]= pdjobj.subcmd[cmd];				
				if(cstu.length==12){ssdatabuf = Buffer.from(cstu,'hex');
				}else {ssdatabuf = Buffer.from("000000000000",'hex');}
				for(i=0;i<6;i++)ttbuf[i+5]=ssdatabuf[i];			
				break	
			case "LOW":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break	
			case "HI":	
				ttbuf[4]=pdjobj.subcmd[cmd];		
				break
			default:
				return 		
		}
	}else if(group < 10 ){
	   //group Control command "s9bcmd" :  "[f5][fe][05][9b][00][00][00][9b]"
	   ttbuf = Buffer.from(cmdcode.rs485v040.s9bcmd,'hex'); //0x9b PWM group control 		    
	   if(cmd in pdjobj.subcmd){
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[5]=nstu;
			ttbuf[6]=group;
			//group Control update to josn buffer
			for(ii in pdjobj.PDDATA.Devtab){				
				if(pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='D' && ii.substring(0,0)=='D'){
						pdjobj.PDDATA.Devtab[ii].C7C.sub=cmdindex;
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
	totxbuff(ttbuf);
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.s7dcmd,'hex');
	//==================================
   	//ttbuf = Buffer.from(cmdcode.rs485v040.s7dcmd,'hex'); 
	if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
	   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
	}else{			
	   return;
	} 
	if(cmd in pdjobj.subcmd){ //check subcmd is working
		pdjobj.PDDATA.Devtab[pos].C7D.sub=cmdindex;			
		pdjobj.PDDATA.Devtab[pos].C7D.stu=nstu ;
	}else{
	   ttbuf[4]=0x55
	   return;
	}		
	switch(cmd){
		case "LOAD":
			ttbuf[4]=pdjobj.subcmd[cmd];
			break		
		case "SET":
			ttbuf[4]= pdjobj.subcmd[cmd];				
			ttbuf[5]= Math.floor(nstu/100);//nstu = "hhmm" 
			ttbuf[6]= nstu%100;
			break
		default:
			return 		
	}
	//set2dev(ttbuf);	
	totxbuff(ttbuf);
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
	if(cmd in pdjobj.subcmd)cmdindex = pdjobj.subcmd[cmd]
	let ttbuf = Buffer.from(cmdcode.rs485v040.s7ecmd,'hex');
	//==================================
	
	if(group==0){
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v040.s7ecmd,'hex'); 
		if(pos in pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{			
		   return;
		} 
		if(cmd in pdjobj.subcmd){ //check subcmd is working
		   //update to josn buffer 
			pdjobj.PDDATA.Devtab[pos].C7E.sub=cmdindex;		
			pdjobj.PDDATA.Devtab[pos].C7E.stu=nstu;
		}else{
		   ttbuf[4]=0x55 //no effect subcmd 
		   return;
		}				
		switch(cmd){
			case "OFF":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "ON":
				ttbuf[4]=pdjobj.subcmd[cmd];				
				ttbuf[5]=nstu;
				break
			case "LOAD":
				ttbuf[4]=pdjobj.subcmd[cmd];
				break				
			default:
				return 		
		}	
		
	}else if(group < 10 ){
		//group Control command "s97cmd" :  "[f5][fe][05][97][00][00][00][97]"
		ttbuf = Buffer.from(cmdcode.rs485v040.s9acmd,'hex'); //0x9a auto group control 		    
		if(cmd in pdjobj.subcmd){
			ttbuf[4]=pdjobj.subcmd[cmd];
			ttbuf[5]=nstu;
			ttbuf[6]=group
			//group Control update to josn buffer
			for(ii in pdjobj.PDDATA.Devtab){				
				if(pdjobj.PDDATA.Devtab[ii].STATU.GROUP == group){
					if(pos.substring(0,0)=='D' && ii.substring(0,0)=='D'){
						pdjobj.PDDATA.Devtab[ii].C7E.sub=cmdindex;
					//}else{   
					//	if(ii.substring(0,1) == pos.substring(0,1)){
					//		pdjobj.PDDATA.Devtab[ii].C73.sub=cmdindex;
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
	totxbuff(ttbuf);
})


//=====================================================
//Linke gateway Start UP and login DDNS
//=====================================================
app.listen(setport, function () {    
    fs.readFile(filepath, function(err, content) {
        //res.writeHead(200, { 'Content-Type': 'text/plain' });
        let uuiddata = content.toString();
        //let jobj = JSON.parse(uuiddata);
		pdjobj= JSON.parse(uuiddata);
        //var jpam = jobj[0];
        //console.log(" txt find ok ! ... \n", uuiddata);
        //console.log("uuids = ", jobj.uuid);
        //console.log("dsnurl = ", jobj.dsnurl);
        //console.log("uuids = ", pdjobj.PDDATA.UUID);
        //console.log("dsnurl = ", pdjobj.PDDATA.dsnurl);
        //console.log("videodsnurl = ", pdjobj.PDDATA.videodsnurl);//devloadur
        //console.log("devloadur = ", pdjobj.PDDATA.devloadur);
		
        ddsnurl = pdjobj.PDDATA.dsnurl;
        vdsnurl = pdjobj.PDDATA.videodsnurl;
		devloadurl =  pdjobj.PDDATA.devloadurl;		
		typeloadurl = pdjobj.PDDATA.typeloadurl;
		
        setuuid =  pdjobj.PDDATA.UUID;
		
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
				event.emit('arxbuff_event'); 
				global.arxokflag=false;
			}
		},150);
		
		setInterval(function(){			
			//console.log("0xfc command check 2..."+ch1com.rxokflag)
			if(global.rxokflag == true){
				//console.log("0xfc command check 3..."+global.rxokflag)
				event.emit('rxbuff_event'); 
				global.rxokflag=false;
			}
		},160);
		
		if(pdjobj.PDDATA.linkoffmode == 0){//ext web mode
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
		}else if(pdjobj.PDDATA.linkoffmode == 1){//off link mode
			console.log(">>OFF Link Mode !");
			setInterval(function(){				
				console.log(">>LOCAL server 192.268.5.220 Link Mode !");
				
				//device_stulinkweb(sensorbuff[sbcount]);
				//for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
				sbcount++;
				if(sbcount>=3)sbcount=0;				
				for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min					
			}, 3 * 60 * 1000);
			
		}else if(pdjobj.PDDATA.linkoffmode == 2){//by 220 mode
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
    });   

    console.log('Example app listening on port 3000!')
})


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
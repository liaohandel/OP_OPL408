console.log("pdbuff v2.0 20180516 ... XD");

var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 

var Client = require('node-rest-client').Client;
var client = new Client();

var path = require('path');
var fs = require('fs');
var os = require('os');

var util = require('util');

//=== UART comport module 
var ch1com = require('./utx7xipccom0')// IPC com port 0 RS232
//var ch1com = require('./utx7xipccom1')// IPC com port 1 RS232
//var ch1com = require('./utx7x1')// rec oxfa and 0xfc command 
//var ch1com = require('./utx5x2')
//var ch3com = require('./utx5x3')
//var ch4com = require('./utx5x4')

//=== web server link url ===
var ddsnurl = "http://106.104.112.56/Cloud/API/linkbox.php"
var vdsnurl = "http://106.104.112.56/Cloud/API/videobox.php"
var devloadurl = "http://106.104.112.56/Cloud/API/DeviceUpdate.php"
var typeloadurl = "http://106.104.112.56/Cloud/API/TypeUpdate.php" //
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
//var activekeyurl = "http://106.104.112.56/Cloud/API/DeviceStatus.php"
var linkoffmode = 1;

var setddsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&UUID='+setuuid
var setvdsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&DevicePOS='+setdeviceport+'&UUID='+setuuid
var setdevouturl = devloadurl+"?UUID="+setuuid+"&result="+"{}"

//=== POS RS422 command lib
var cmdcode = require("./handelrs485x2.js");

//=== PDDATA.txt to pdjobj
var filename = "PDDATA.txt"
var filepath = path.join(__dirname, ("/public/" + filename));
var xpdjobj ={} //pd buffer 

//=== treescan.txt to jtreescan
var filename_treescan = "treescan.txt"
var filepath_treescan = path.join(__dirname, ("/public/" + filename_treescan));
var jtreescan = {} //treescan buffer 
//global.jtreescan = {} //treescan buffer 

//=== treedata.txt to jtreedata
var filename_treedate = "treedata.txt"
var filepath_treedata = path.join(__dirname, ("/public/" + filename_treedate));
var jtreedata = {} //tree upload buffer
//global.jtreedata = {} //tree upload buffer

//=== JAUTOCMD.txt to jautocmd === 
var filename_jautocmd = "JAUTOCMD.txt"
var filepath_jautocmd = path.join(__dirname, ("/public/" + filename_jautocmd));
var jautocmd = {} //tree upload buffer

//=== KEYPD.txt to jkeypd ===
var filename_keypd = "KEYPD.txt"
var filepath_keypd = path.join(__dirname, ("/public/" + filename_keypd));
var jkeypd = {} //tree upload buffer
var keypadpushbuffer =[];


//=== syspub function ===
function jobjcopy(jobj){
	return JSON.parse(JSON.stringify(jobj));	
}

function eventcall(callmask){
	event.emit(callmask);
}

//===================================
function sysload(callback){	
    fs.readFile(filepath, function(err, content) {
		if(err){throw err;}
		
        //res.writeHead(200, { 'Content-Type': 'text/plain' });
        let uuiddata = content.toString();
        //let jobj = JSON.parse(uuiddata);
		xpdjobj= JSON.parse(uuiddata);
		
        //var jpam = jobj[0];
        //console.log(" txt find ok ! ... \n", uuiddata);
        //console.log("uuids = ", jobj.uuid);
        //console.log("dsnurl = ", jobj.dsnurl);
        //console.log("uuids = ", pdjobj.PDDATA.UUID);
        //console.log("dsnurl = ", pdjobj.PDDATA.dsnurl);
        //console.log("videodsnurl = ", pdjobj.PDDATA.videodsnurl);//devloadur
        //console.log("devloadur = ", pdjobj.PDDATA.devloadur);
		
        ddsnurl = xpdjobj.PDDATA.dsnurl;
        vdsnurl = xpdjobj.PDDATA.videodsnurl;
		devloadurl =  xpdjobj.PDDATA.devloadurl;		
		typeloadurl = xpdjobj.PDDATA.typeloadurl;
		typechannelurl = xpdjobj.PDDATA.typechannelurl;
		
        setuuid =  xpdjobj.PDDATA.UUID;
		
		dev85statusurl = xpdjobj.PDDATA.dev85statusurl
		dev105statusurl = xpdjobj.PDDATA.dev105statusurl
		linkoffmode = xpdjobj.PDDATA.linkoffmode;		
		
		exports.pdjobj = xpdjobj; //#####
		exports.linkoffmode = linkoffmode
		exports.setuuid = setuuid

		exports.ddsnurl = ddsnurl
		exports.vdsnurl = vdsnurl
		exports.devloadurl = devloadurl
		exports.typeloadurl = typeloadurl
		exports.typechannelurl = typechannelurl //

		exports.dev85statusurl = dev85statusurl
		exports.dev105statusurl = dev105statusurl

		exports.offdev85statusurl = offdev85statusurl
		exports.offdev105statusurl = offdev105statusurl
		exports.offdevloadurl = offdevloadurl
		exports.offtypeloadurl = offtypeloadurl
		exports.offtypechannelurl = offtypechannelurl

		exports.setdeviceip = setdeviceip
		exports.setdeviceport = setdeviceport

		exports.setddsnurl = setddsnurl
		exports.setvdsnurl = setvdsnurl
		exports.setdevouturl = setdevouturl
        callback();
		
        //res.send(req.query.appfile + ' ' + req.query.index);
        //res.send(webstr); 
	});
}

function sysupdate(callback){	

	let uuiddata = JSON.stringify(xpdjobj);					
	fs.writeFile(filepath,uuiddata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('PDDATA.txt update ERR ! ');
			
		}		
		callback(err);
	});
}


//===================================
function treescan_load(callback){
    fs.readFile(filepath_treescan, function(err, content) {
		if(err){			
			console.log("open treedata err! ")
			throw err;
		}
        let treescandata = content.toString();
		//console.log("jscan",treescandata);
        //let jobj = JSON.parse(uuiddata);
		jtreescan = jobjcopy(JSON.parse(treescandata));//jobjcopy(jobj)
		console.log("jscan=",jtreescan.treever);
		
		exports.jtreescan = jtreescan //#####
        callback();		
	});	
}

function treescan_update(callback){	
	let treescandata = JSON.stringify(jtreescan);					
	fs.writeFile(filepath_treescan,treescandata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('treescan.txt update ERR ! ');
		}		
		callback();
	});
}

//===================================
function treedata_load(callback){
    fs.readFile(filepath_treedata, function(err, content) {
		if(err){
			console.log("open treedata err! ")
			throw err;
		}
        let treedatadata = content.toString();
		//console.log("jdata",treedatadata);
        //let jobj = JSON.parse(uuiddata);
		jtreedata = jobjcopy(JSON.parse(treedatadata));
		console.log("jdata=",jtreedata.treever);		
		exports.jtreedata = jtreedata//#####		
        callback();	
	});	
}

function treedata_update(callback){	
	let treedatadata = JSON.stringify(jtreedata);					
	fs.writeFile(filepath_treedata,treedatadata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('treedata.txt update ERR ! ');
		}		
		callback();
	});	
}

//===================================
function jautocmd_load(callback){
    fs.readFile(filepath_jautocmd, function(err, content) {
		if(err){
			console.log("open jautocmd err! ")
			throw err;
		}
        let jautocmddata = content.toString();
		//console.log("jdata",treedatadata);
        //let jobj = JSON.parse(uuiddata);
		jautocmd = jobjcopy(JSON.parse(jautocmddata));
		//console.log("jautocmd ver =",jautocmd.AUTOSN);		
		exports.jautocmd = jautocmd//#####		
        callback();	
	});	
}

function jautocmd_update(callback){	
	let jautocmddata = JSON.stringify(jautocmd);					
	fs.writeFile(filepath_jautocmd,jautocmddata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('JAUTOCMD.txt update ERR ! ');
		}		
		callback();
	});	
}

//===================================
function jkeypd_load(callback){
    fs.readFile(filepath_keypd, function(err, content) {
		if(err){
			console.log("open KEYPD.txt err! ")
			throw err;
		}
        let keypddata = content.toString();
		//console.log("jdata",treedatadata);
        //let jobj = JSON.parse(uuiddata);
		jkeypd = jobjcopy(JSON.parse(keypddata));
		//console.log("KETPD ver=",jkeypd.KEYVER);		
		exports.jkeypd = jkeypd//#####		
        callback();	
	});	
}

function jkeypd_update(callback){	
	let keypddata = JSON.stringify(jkeypd);					
	fs.writeFile(filepath_keypd,keypddata,function(error){
		if(error){ //如果有錯誤，把訊息顯示並離開程式
			console.log('KEYPD.txt update ERR ! ');
		}		
		callback();
	});	
}

//=============================
//=== uart sub funciton lib ===
//=============================

//=== uart buffer tx loop 1 by 1 and rxbuff ====
//###=== rx buffer tx buffer sunfunciton ======
function devloadtobuff(sub02cmd){	
	console.log("check 02 rxcmd = "+sub02cmd)	
	sdevadd = sub02cmd.substring(2,4);  	//get devadd map to pos
	ss = sub02cmd
	sdevreg = ss.substring(10,12);			//reg type	
	nsdevadd = Number("0x"+sdevadd);	
	//let dcnt=""
	
	if(nsdevadd > 0xf0){
		if(nsdevadd == 0xf1)return
		if(nsdevadd == 0xfd){
			if(sdevreg == "E1")sdevadd = sub02cmd.substring(14,16);  //get devadd map to pos
			if(sdevreg == "01")sdevadd = "20" // is OPL002 TREE SCAN only
		}
		if(sdevadd in xpdjobj.addposmap){
			sdevpos = xpdjobj.addposmap[sdevadd];	//relaod POS 
		}else{
			sdevpos = "ESCAN"
			xpdjobj.PDDATA.Devtab[sdevpos].STATU.devadd = Number("0x"+sdevadd);
			console.log("ESCAN macadd scan ipadd = 0x"+sdevadd);
			return
		}
	}else{		
		if(sdevadd in xpdjobj.addposmap){
			sdevpos = xpdjobj.addposmap[sdevadd];	//relaod POS
		}else{
			sdevpos = "ESCAN"
			return
		}
	}
	
	sdevsubcmd = ss.substring(8,10);	//subcmd
	sdevreg = ss.substring(10,12);		//reg type	
	console.log("check 02 rxcmd = "+sub02cmd+" reg="+sdevreg);
	
	//device out status  load check 
	switch(sdevreg.substring(0,1)){
		case "2":	//LED #reg 21..2f		
			if(sdevreg == "20"){
				sdevstau21 = ss.substring(12,16);			//reg21 type	
				xpdjobj.PDDATA.Devtab[sdevpos]["C71"]["chtab"]["21"].stu = Number("0x"+sdevstau);
				
				sdevstau22 = ss.substring(16,20);			//reg22 type	
				xpdjobj.PDDATA.Devtab[sdevpos]["C71"]["chtab"]["22"].stu = Number("0x"+sdevstau);
				
				sdevstau23 = ss.substring(20,24);			//reg23 type	
				xpdjobj.PDDATA.Devtab[sdevpos]["C71"]["chtab"]["23"].stu = Number("0x"+sdevstau);				
				
			}else{
				sdevstau = ss.substring(12,16);			//reg type	
				//xpdjobj.PDDATA.Devtab[sdevpos]["C71"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
				xpdjobj.PDDATA.Devtab[sdevpos]["C71"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);

			}
			break
		case "3":	//AIRFAN reg 31..3f
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C73"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C73"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			break		
		case "4":	//PUMP reg 41..4f is basic pump address maping 
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C72"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C72"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			break		
		case "5":	//PUMP reg 51..5f is extern pump address maping 
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C72"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C72"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			break
		case "6":	//WATERLEVEL(C79) reg61 .. 6f basic maping
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			break
		case "7":	//WATERLEVEL(C79) reg71 .. 7f extern maping 
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			break
		
		case "A":	//TEMPERATURE(C77)_regA1 .. AF
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C77"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C77"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			break
		default:
			break 
	};
	
	//sensor load check 
	switch(sdevreg){
		case "91":	//CO2(C76)	#reg71
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C76"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C76"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			break
		case "92":	//RH(C78)	#reg72
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C78"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C78"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			break
		case "93":	//PH(C7B)   #reg73
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C7B"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C7B"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			break
		case "94":	//ELECTRONS(C7A)#reg74
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C7A"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C7A"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			break
		case "81":	//PWM(C7C) #reg81
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C7C"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C7C"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			break
			
		case "1F":	//GROUP(C74) #reg1f
			sdevstau = ss.substring(12,16);			//reg type	
			//xpdjobj.PDDATA.Devtab[sdevpos]["C74"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C74"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			break	
			
		case "E0":	//MACADD #rege0
			//sdevadd = ss.substring(12,24);
			sdevmac = ss.substring(12,24);
			sdevmactype = ss.substring(12,14);
			console.log("pos="+sdevpos+" macadd="+sdevmac+" mactype="+sdevmactype);
			xpdjobj.PDDATA.Devtab[sdevpos]["STATU"]["MACADD"] = sdevmac;//6 byte			
			xpdjobj.PDDATA.Devtab[sdevpos]["STATU"]["MTYPE"] = sdevmactype;//1 byte			
			break	
			
		case "E1":	//IPADD #rege1
			//sdevmac = ss.substring(12,24);
			//sdevmactype = ss.substring(12,14);.
			break
			
		case "E2":	//FW_ver #rege2		
			xpdjobj.PDDATA.Devtab[sdevpos].STATU.FWVER = ss.substring(12,16);//2 byte	
			break	
			
		case "E3":	//HW_ver #rege3		
			xpdjobj.PDDATA.Devtab[sdevpos].STATU.HWVER = ss.substring(12,16);//2 byte	
			break	
			
		case "01":	//treescan #reg 01
			//xpdjobj.PDDATA.Devtab[sdevpos]["C70"]["chtab"][sdevreg].sub = 0x01 //ON 
			xpdjobj.PDDATA.Devtab[sdevpos]["C70"]["chtab"][sdevreg].stu = 0x01 //ON ok 0x00 is SCAN wait			
			break	
			
		case "02":	//treelistdata #reg 02
			treedata = ss.substr(12,24);//FA 20 10 00 02 02 020103F1840000000103003173  
			treeindex = ss.substr(12,2);
			inx = Number("0x"+treeindex);
			if(inx == 0)jtreescan.SCANLIST=[];//when load tree root the clear tree 
			jtreescan.SCANLIST[inx]=treedata;
			console.log("inx="+inx+" data =["+treedata+"]");
			
			if(inx >= (jtreescan.SCANCOUNT-1)){
				treescan_update(()=>{
					console.log("treescan data save ok !")
		    	});
			}
			break			
		case "03":	//treecount #reg 03
			sdevtreecount = ss.substr(12,4);//2 byte
			//xpdjobj.PDDATA.Devtab[sdevpos]["C70"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)//LOAD
			xpdjobj.PDDATA.Devtab[sdevpos]["C70"]["chtab"][sdevreg].stu = Number("0x"+sdevtreecount)//Count 		
			jtreescan.SCANCOUNT = Number("0x"+sdevtreecount)//Count
			console.log("tree count = "+jtreescan.SCANCOUNT);
			break	
			
		case "04":	//Device TRIG event list #reg 04
		    dinx =  ss.substring(12,4);//2 byte
		    ndinx = Number("0x"+dinx);//2 byte
			devndata =  ss.substring(16,36);//10 byte
			
			jkeypd.DEVLIB.DEVMODE.MODEORGLIST[ndinx]=devndata;
			break	
		case "05":	//Device TRIG count  #reg 05
			dcnt =  ss.substring(12,16);//2 byte
		    ndcnt = Number("0x"+dcnt);//2 byte
			
			jkeypd.DEVLIB.DEVMODE.DLCOUNT=ndcnt;		
			break	
			
		case "06":	//Device TRIG event list #reg 06
		    dinx =  ss.substring(12,16);//2 byte
		    ndinx = Number("0x"+dinx);//2 byte
			devndata =  ss.substring(16,36);//10 byte
			
			jkeypd.DEVLIB.DEVEVENTLIST.EVENTORGLIST[ndinx]=devndata;
			break	
		case "07":	//Device TRIG event count #reg 07
			dcnt =  ss.substring(12,16);//2 byte
		    ndcnt = Number("0x"+dcnt);//2 byte
			
			jkeypd.DEVLIB.DEVEVENTLIST.IDCOUNT=ndcnt;	
			break	
			
		case "0F":	//Key ver load message #reg 0f
			kinx =  ss.substring(12,16);//2 byte
			nkinx = Number("0x"+kinx);	//2 byte
			kvar = ss.substring(16,32);	//8 byte
			if(nkinx == 1)jkeypd.KEYLIB.KEYPAD1.STATU.ver =kvar;
			if(nkinx == 2)jkeypd.KEYLIB.KEYPAD2.STATU.ver =kvar;
			if(nkinx == 3)jkeypd.KEYLIB.KEYPAD3.STATU.ver =kvar;
			break
			
		case "10":	//key1 or key3 event list #reg 10
			kinx =  ss.substring(12,16);//2 byte
			nkinx = Number("0x"+kinx);//2 byte
			kevndata =  ss.substring(16,36);//10 byte
			
			if(nsdevadd == 0x20){
				jkeypd.KEYLIB.KEYPAD1.STATU.korglist[nkinx]=kevndata
			}else if(nsdevadd == 0x21){
				jkeypd.KEYLIB.KEYPAD3.STATU.korglist[nkinx]=kevndata			
			}		
			break
			
		case "11":	//key1 or key3 event count #reg 11
			kcnt =  ss.substring(12,16);//2 byte
			nkcnt = Number("0x"+kcnt);//2 byte
			if(nsdevadd == 0x20){
				jkeypd.KEYLIB.KEYPAD1.STATU.evncount=nkcnt
			}else if(nsdevadd == 0x21){
				jkeypd.KEYLIB.KEYPAD3.STATU.evncount=nkcnt			
			}		
			break	
			
		case "12":	//key2 event list #reg 12
			kinx =  ss.substring(12,16);//2 byte
			nkinx = Number("0x"+kinx);//2 byte
			kevndata =  ss.substring(16,36);//10 byte
			
			if(nsdevadd == 0x20){
				jkeypd.KEYLIB.KEYPAD2.STATU.korglist[nkinx]=kevndata
			}else if(nsdevadd == 0x21){
				//jkeypd.KEYLIB.KEYPAD3.STATU.korglist[nkinx]=kevndata			
			}
			break	

		case "13":	//key2 event count #reg 13
			kcnt =  ss.substring(12,16);//2 byte
			nkcnt = Number("0x"+kcnt);//2 byte
			if(nsdevadd == 0x20){
				jkeypd.KEYLIB.KEYPAD2.STATU.evncount=nkcnt
			}else if(nsdevadd == 0x21){
				//jkeypd.KEYLIB.KEYPAD3.STATU.evncount=nkcnt			
			}		
			break
			
		default:
			return 
			
	}
}

ERRMSG_CODE={
	"01":"CMD_RE_ER_TIMEOVER",
	"02":"CMD_RE_ER_FORMAT",
	"03":"CMD_RE_ER_UNDEV",
	"04":"CMD_RE_ER_UNLEN",
	"05":"CMD_RE_ER_UNCMD",
	"06":"CMD_RE_ER_UNREG",
	"07":"CMD_RE_ER_CHECK",
	"08":"CMD_RE_ER_NOIP",
	"09":"CMD_RE_ER_NOSRC",
	"0A":"CMD_RE_ER_CRT_MEM",
	"0B":"CMD_RE_ER_PARAM_OV",
	"0C":"CMD_RE_ER_PARAM_ER",
	"0D":"CMD_RE_ER_BUF_OV",
	"0E":"CMD_RE_ER_BUSY",
	"0F":"CMD_RE_ER_NODAT"
}

//  ERR message send to webserver or IPC webUI
function deverrbuff(errcmd){//fcc10681019f010381
	//check pos onlink
	sdevadd = errcmd.substring(2,4);		//add
	sdevcmd = errcmd.substring(8,10);     	//subcmd
	sdevreg = ss.substring(10,12);			//reg type	
	let errcode = ss.substring(12,16);		//err code 	
	let errkey = ss.substring(14,16);		//err code 	
	nsdevadd = Number("0x"+sdevadd);
	
	console.log(">>> Err code ["+errcode+"]="+ERRMSG_CODE[errkey]);
	//0xFC,[ipadd],[len],[00],[0x07 alarm], [reg] , [dataH][dataL],chk
	//  01  23       45   67   89           01       23     45     67 
	//0xfa,add,len,0x00,0x0a,reg,[errcode_H],[errcode_L],chksum==> ERR code callback  0x0a ERR subcmd 
	
}

var sstxbuff=[];//txbuffer list
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
		sdevcmd = ss.substring(8,10);
		sdevreg = ss.substring(10,12);
		if(startkey == "FC"){
			devalarmbuff(ss);//add to alarmbuff[]
		}else{			
			sdevsubcmd = ss.substring(8,10);	
			console.log("rx subcmd chek = "+sdevsubcmd)
			if(sdevsubcmd == '02')devloadtobuff(ss);//when load command will to setup buffer
			if(sdevsubcmd == '52')deverrbuff(ss);   //when Err Code Message buffer send to server 
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
		startkey = ss.substring(0,2);//0xfa or 0xfc[0][1][2][3][4:cmd][5:reg][6,7:value],[8,9:group],[10]
		//sdevadd = ss.substring(2,4); //[01 23 45 67 89 01 23 45 67 89 01]
		//sdevcmd = ss.substring(8,10);
		//sdevreg = ss.substring(10,12);
		if(startkey == "FC"){
			devalarmbuff(ss);//add to alarmbuff[]
		}else{
			console.log("Fxx rxcomm = "+ss);
		}
	}else{		
		console.log("<<< show cmd rx timeOut Fail rxleng="+ch1com.aqrxcmd.length );
	}
})

//=== container IPC  105url for  alarm event ===
var alarmbuff = [];
var alarmloadurl = "http://127.0.0.1:3001/alarm"

function toalarmoutbuff(kdev){  //### no use 
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

//=== container IPC 105url for keypad event ===
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

//0xFC alarm 主動回報 警告處置 KeyPAD 觸發 主動回報處置
function devalarmbuff(alarmcmd){//fcc10681019f010381
	//check pos onlink
	sdevadd = alarmcmd.substring(2,4);		//add
	sdevcmd = alarmcmd.substring(8,10);     //subcmd
	sdevreg = alarmcmd.substring(10,12);			//reg type	
	nsdevadd = Number("0x"+sdevadd);
	
	//0xFC,[ipadd],[len],[00],[0x07 alarm], [reg] , [dataH][dataL],chk
	//  01  23       45   67   89           01       23     45     67 
	
	//=== check ipadd is use in PDDATA db 
	if(nsdevadd > 0xf0){
		if(nsdevadd == 0xf1)return //GROUP CONTROL 
		//0xFC,0xFD ==> is new MACADD deviec install active alarm 
		if(nsdevadd == 0xfd){      //macadd command ipadd nodefine 
			sdevmac = alarmcmd.substring(12,24); 	//macadd
			sdevpadd = alarmcmd.substring(26,28); 	//parint ipadd 
			console.log("find a new macadd =["+sdevmac+"] paradd ="+sdevpadd);
			return
		}
		if(sdevadd in xpdjobj.addposmap){
			sdevpos = xpdjobj.addposmap[sdevadd];	//relaod POS 
		}else{
			sdevpos = "ESCAN"  //undefined sop use ESCAN backup data Value 
			xpdjobj.PDDATA.Devtab[sdevpos].STATU.devadd = Number("0x"+sdevadd);
			console.log("ESCAN macadd scan ipadd = 0x"+sdevadd);
			return
		}
	}else{		
		if(sdevadd in xpdjobj.addposmap){
			sdevpos = xpdjobj.addposmap[sdevadd];	//relaod POS
		}else{
			sdevpos = "ESCAN"
			xpdjobj.PDDATA.Devtab[sdevpos].STATU.devadd = Number("0x"+sdevadd);
			console.log("ESCAN macadd scan ipadd = 0x"+sdevadd);
		}
	}
	
	ss = alarmcmd
	//keypad push alarm broadcast to server ### 20180610 update hadnel 
	if(nsdevadd == 0x20){// keypad1 and keypad2 maping in E001 0x20 reg:10 , 12
		if(sdevreg == "10"){  //keypad1 8 keycode:  0x91 .. 0x98
			//keypad1
			let skeyinx = ss.substr(12,2);	
			let skeystu = ss.substr(14,2);
			let kkss = "01"+skeyinx+skeystu;
			if(keypadpushbuffer.length > 32)keypadpushbuffer=[];//buffer mac 32 item 
			keypadpushbuffer.push(kkss);
			
			// let stpt = Number("0x"+skeystu);
			// let jketbuff={};
			// let jkeypush ={};
			// let keycmask ="ON";
			// ksop = "K0"+skeyinx
			// console.log("key="+ksop)
			// if(ksop in jkeypd.KEYLIB.KEYPAD1){
				// jketbuff = jkeypd.KEYLIB.KEYPAD1[ksop];
				// if(stpt < jketbuff.STATUS.stcnt){
					// keycmask = jketbuff.STATUS.stmask[stpt];
					// jkeypush = jketbuff.EVENT[keycmask];
					// for(jkk in jkeypush ){
						// console.log("keyapi>>"+jkeypush[jkk]);
					// }
				// }else{
					// console.log("keystu="+stpt+"no define in "+ksop);
				// }
			// }else{
				// console.log("key="+ksop+"no define in keypad1")
			// }
			
			//jkeypd.KEYLIB.KEYPAD1[ksop]["STATUS"]["stcnt"]= Number("0x"+skeystu);
			return
		}else if(sdevreg == "12"){	//keypad2  68 keycode: 0x21 .. 0x6b
			//keypad2
			let skeyinx = ss.substr(12,2);	
			let skeystu = ss.substr(14,2);
			let kkss = "02"+skeyinx+skeystu;
			if(keypadpushbuffer.length > 32)keypadpushbuffer=[];//buffer mac 32 item 
			keypadpushbuffer.push(kkss);
			
			// let stpt = Number("0x"+skeystu);
			// let jketbuff={};
			// let jkeypush ={};
			// let keycmask ="ON";
			// ksop = "K0"+skeyinx
			// console.log("key="+ksop)
			// if(ksop in jkeypd.KEYLIB.KEYPAD2){
				// jketbuff = jkeypd.KEYLIB.KEYPAD2[ksop];
				// if(stpt < jketbuff.STATUS.stcnt){
					// keycmask = jketbuff.STATUS.stmask[stpt];
					// jkeypush = jketbuff.EVENT[keycmask];
					// for(jkk in jkeypush ){
						// console.log("keyapi>>"+jkeypush[jkk]);
					// }
				// }else{
					// console.log("keystu="+stpt+"no define in "+ksop);
				// }
			// }else{
				// console.log("key="+ksop+"no define in keypad2")
			// }
			//jkeypd.KEYLIB.KEYPAD2[ksop]["STATUS"]["stcnt"]= Number("0x"+skeystu);
			return
		}
	}
	if(nsdevadd == 0x21){
		if(sdevreg == "10"){  //keypad1 8 keycode:  0x91 .. 0x98
			//keypad3
			skeyinx = ss.substring(12,14);	
			skeystu = ss.substring(14,16);
			let kkss = "03"+skeyinx+skeystu;
			if(keypadpushbuffer.length > 32)keypadpushbuffer=[];//buffer mac 32 item 
			keypadpushbuffer.push(kkss);
			//jkeypd.KEYLIB.KEYPAD1[ksop]["STATUS"]["stcnt"]= Number("0x"+skeystu);
			return
		}else if(sdevreg == "12"){	//keypad2  68 keycode: 0x21 .. 0x6b
			//keypad4
			return
		}
	}
	
	//=== check sop & reg for sensor value save 
	switch(sdevreg.substring(0,1)){		
		case "5":	//TEMPERATURE(C77) reg 51..5f
			sdevstau = ss.substring(12,16);			//reg type	
			if(!(sdevreg in xpdjobj.PDDATA.Devtab[sdevpos]["C77"]["chtab"]))return
			xpdjobj.PDDATA.Devtab[sdevpos]["C77"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C77"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			//send alarm to webserver ....
			break
		case "6":	//WATERLEVEL(C79) reg61 .. 6f
			sdevstau = ss.substring(12,16);			//reg type	
			if(!(sdevreg in xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"]))return
			xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C79"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);
			//send alarm to webserver ....
			break
		default:
			break 
	};
	
	switch(sdevreg){
		case "71":	//CO2(C76)	#reg71
			sdevstau = ss.substring(12,16);			//reg type	
			if(!(sdevreg in xpdjobj.PDDATA.Devtab[sdevpos]["C76"]["chtab"]))return
			xpdjobj.PDDATA.Devtab[sdevpos]["C76"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C76"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);	
			//send alarm to webserver ....	
			break
		case "72":	//RH(C78)	#reg72
			sdevstau = ss.substring(12,16);			//reg type	
			if(!(sdevreg in xpdjobj.PDDATA.Devtab[sdevpos]["C78"]["chtab"]))return
			xpdjobj.PDDATA.Devtab[sdevpos]["C78"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C78"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);		
			//send alarm to webserver ....
			break
		case "73":	//PH(C7B)   #reg73
			sdevstau = ss.substring(12,16);			//reg type	
			if(!(sdevreg in xpdjobj.PDDATA.Devtab[sdevpos]["C7B"]["chtab"]))return
			xpdjobj.PDDATA.Devtab[sdevpos]["C7B"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C7B"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);	
			//send alarm to webserver ....	
			break
		case "74":	//ELECTRONS(C7A)#reg74
			sdevstau = ss.substring(12,16);			//reg type	
			if(!(sdevreg in xpdjobj.PDDATA.Devtab[sdevpos]["C7A"]["chtab"]))return
			xpdjobj.PDDATA.Devtab[sdevpos]["C7A"]["chtab"][sdevreg].sub = Number("0x"+sdevsubcmd)
			xpdjobj.PDDATA.Devtab[sdevpos]["C7A"]["chtab"][sdevreg].stu = Number("0x"+sdevstau);	
			//send alarm to webserver ....	
			break
		default:
			return 
			
	}
	
	
	
	// if(sdevadd == "C1" && sdevcmd == "81"){
		// tokeypadoutbuff(alarmcmd);		
	// }else{
	//alarmbuff.push(alarmcmd);  //to alarm buffer 
	// }
	//sensroe modeloop or modetrig active message
	//keypad active message 
	//
	
}


//=== system start up function call process 
sysload(function(){	
        console.log("dsnurl = ", ddsnurl);
        console.log("videodsnurl = ",vdsnurl);//devloadur
        console.log("devloadur = ", devloadurl)
        console.log("typeloadurl = ", typeloadurl)
        console.log("typechannelurl = ", typechannelurl)
        console.log("dev85statusurl = ", dev85statusurl)
        console.log("dev105statusurl = ", dev105statusurl)
        console.log("linkoffmode = ", linkoffmode)
		
        console.log("uuids = ", setuuid);		
});

treescan_load(function(){
        console.log("jtreescan ver = ", jtreescan.treever);			
});

treedata_load(function(){
        console.log("jtreedata ver = ", jtreedata.treever);			
});

jautocmd_load(function(){
		console.log("jautocmd ver =",jautocmd.AUTOSN);		
});

jkeypd_load(function(){
		console.log("KETPD ver=",jkeypd.KEYVER);		
});

//=== tree data
//exports.pdjobj = xpdjobj; //#####
//exports.jtreescan = jtreescan
//exports.jtreedata = jtreedata		
//exports.jautocmd = jautocmd//#####			
//exports.jkeypd = jkeypd//#####			

//rs422 command and subcmd 
exports.cmdcode = cmdcode

//=== bufff syspub lib	
exports.jobjcopy = jobjcopy
exports.eventcall = eventcall

exports.totxbuff = totxbuff



//PDDATA.txt		pdjobj
exports.sysload = sysload
exports.sysupdate = sysupdate

//treescan.txt    	jtreescan
exports.treescan_load = treescan_load
exports.treescan_update = treescan_update

//treedata.txt 		jtreedata
exports.treedata_load = treedata_load
exports.treedata_update = treedata_update

//JAUTOCMD.txt 		jautocmd
exports.jautocmd_load = jautocmd_load
exports.jautocmd_update = jautocmd_update

//KETPD.txt 		jkeypd
exports.jkeypd_load = jkeypd_load
exports.jkeypd_update = jkeypd_update
exports.keypadpushbuffer = keypadpushbuffer
























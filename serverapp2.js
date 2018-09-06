var express = require("express");

var app= express();
var treebuff  = require('./treebuff');

var pdbuffer  = require('./pdbuffer_v02.js');

//OPF403  treeapi ###
//path => ./gotest5_opf403/tree/treeapi.js
var treeRoutes = require('./treeapi.js');

//OPF403  regcmdapi ###
//path => ./gotest5_opf403/regcmd/regcmd_gx8.js
var regcmdRoutes = require('./regcmd_gx8.js');


//===============================================
// OFP403 TREE NET API Command  after /TREE/cmd ()
//===============================================
app.use('/TREE', treeRoutes);

//===============================================
// OFP403 REG API Command  after /TREE/cmd (LED,PUMP,AIRFAN,PH,ELECTRONS,RH)
//===============================================
app.use('/REGCMD', regcmdRoutes);


//===============================================
// OFP403 OPCMD API Command  after /TREE/cmd (LED,PUMP,AIRFAN,PH,ELECTRONS,RH)
//===============================================

app.get("/",function(reg,res){
    res.send("hi i am Handel , Welcome to my homework 1 !");
});

app.get("/speak",function(reg,res){
    res.send("speak page!");
});

app.get("/repeat",function(reg,res){
    res.send("repeat page!");

});


app.get('/showscan',function(req,res,next){
	//console.log(req.body)
	console.log(req.query.pin);
	//ss = pdbuffer.jtreescan.treever
	ss = pdbuffer.jtreescan.treever
	
	console.log("treescan = ", ss );
	//res.send('Hello tree check !',ss)
	res.send('Hello tree scan !' );
});


app.listen(3001,function(reg,res){
    console.log("Server is runing ...");
});
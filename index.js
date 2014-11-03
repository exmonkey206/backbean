/*jslint node: true */
"use strict";


var noble = require('noble');
var beanAPI = require('ble-bean');


var beanCounter = 0;

var connectedBean = new Array();
var connectedScratch;
var intervalId;

var beanData = new Array();



var saveData = function(id,objData){
	beanData[id].dataArray.push(objData);
	//console.log(id+" - "+objData.x);

	
}



var readyBean = function(id){
  console.log("array id = " + id);


	connectedBean[id].setColor(new Buffer([255,255,255]),
      function(){
        console.log("set led");
    });



  connectedBean[id].on("accell", function(x, y, z, valid){
    var status = valid ? "valid" : "invalid";
    
	    var now = new Date().getTime();
	    
	    var dataObj = {
    	't':now,
	   	 'x':x,
	  	  'y':y,
	  	  'z':z
	    };
    
    
  //  console.log("inside "+id+" - "+x);
    
    saveData(id,dataObj);

    //console.log("inside "+id+" - "+x+" time:"+now);
    //console.log("id = "+id + " - received " + status + " accell\tx:\t" + x + "\ty:\t" + y + "\tz:\t" + z );
  });


  
  
    intervalId = setInterval(function() {
	    
		    connectedBean[id].requestAccell(
		    	function(){
			    	//console.log("id = "+id + "requested accell");
			    	});

	},500);

};




var connect = function(err){
  if (err) throw err;
  process.on('SIGINT', exitHandler.bind({peripheral:this.peripheral}));



  this.peripheral.discoverServices([], setupService);
};


var setupService = function(err,services) {



  if (err) throw err;
  services.forEach(function(service){
    if(service.uuid === beanAPI.UUID){
    
   		var id = beanCounter;
      connectedBean[id] = new beanAPI.Bean(service);
      connectedBean[id].on('ready', function(){readyBean(id)});
      beanData[id] = {"beanID":id, "dataArray": new Array()}
      beanCounter++;
    }

  });

};



var discover = function(peripheral){
  console.log("(scan)found:" + peripheral.advertisement.localName);

  peripheral.connect(connect.bind({peripheral:peripheral}));
};




process.stdin.resume();//so the program will not close instantly

var exitHandler = function exitHandler() {
	console.log('disconnecting');
	
	//output all the data
	for(var i=0; i<beanData.length;i++){
		console.log('Bean ID: '+beanData[i].beanID);
		for(var j=0;j<beanData[i].dataArray.length; j++){
			console.log(beanData[i].dataArray[j]);
		}
	}
	
	
	
	for(var i=0;i<connectedBean.length;i++){
		connectedBean[i].setColor(new Buffer([0x00,0x00,0x00]));
	}	
	process.exit();
};

//Start the scanning!
console.log('Scanning');
noble.startScanning([beanAPI.UUID]);
noble.on('discover', discover);





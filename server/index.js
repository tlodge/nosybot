import express from 'express'
import bodyParser from 'body-parser'
import {SerialPort} from 'serialport'
import {deconstruct,reconstruct} from './GCODE/module.js'
import * as tf from '@tensorflow/tfjs'
import fs from 'fs'
import request  from 'superagent'
const app = express();
app.use(bodyParser.json({limit:'25mb'}))

const PORT = 8090;
let model;

const weights = 'http://127.0.0.1:8090/model.json';
const names = ['contacts', 'iphoto', 'isettings', 'imessage', 'whatsapp'];
let modelWidth, modelHeight;

console.log(tf.node);

tf.loadGraphModel(weights).then(m => {
    model=m;
    [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);
    console.log(modelWidth, modelHeight)
    
});


const predict =  async (buf,name)=>{
   

 
    const tfimage = tf.node.decodeImage(buf);
    
    const input = tf.tidy(() => {    
        return tf.image.resizeBilinear(tfimage, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });
  
    const res = await model.executeAsync(input)
    //.then(res => {
        const [boxes, scores, classes, valid_detections] = res;    
        const boxes_data = boxes.dataSync();
        const scores_data = scores.dataSync();
        const classes_data = classes.dataSync();
        const valid_detections_data = valid_detections.dataSync()[0];
        tf.dispose(res)
        return [valid_detections_data,boxes_data,scores_data,classes_data]; 
    //});
}

const COMMANDS = ["G90","G28 X0","G28 Y0","G28 Z0","G00 Z20 F20000","G0 X80 F20000"];
const HOME = ["G90","G28 X0","G28 Y0","G28 Z0"];
const PICTURE = ["G91","G0 X0 F5000", "G0 Y0 F20000", "G0 Z145 F20000", "G4 S1"];
//const NEWPICTURE = ["G1 Z139 F5000","G1 X1 F5000", "G1 Y1 F5000"];
const NEWPICTURE = ["G1 Z149 F5000","G1 X1 F5000", "G1 Y1 F5000"];
const SWIPE = ["G91","G0 X80 F20000","G0 Z10 F20000","G0 X-10 F6000","G0 Z30 F10000","G0 X80 F10000","G0 Z10 F10000","G0 X-10 F6000","G0 Z30 F10000" ];
const CLOSEAPP =["G90","G1 Z20 X-20 Y55 F8000", "G1 Z9 X-20 Y55 F8000","G1 Z9 X-20 Y-85 F20000","G1 Z20 F10000"];

const POS =     ["G0 X-15",
                "G0 Z11 F20000",
                "G0 Z15 F20000",
                "G4 P500",
                "G0 Y35 F20000",
                "G0 X30 F20000",

                "G0 Z11 F20000",
                "G0 X1 F3000",

                "G0 Z15 F20000",
                "G0 X30 F20000",
                "G0 Z11 F20000",
                "G0 X1 F3000",

                "G0 Z15 F20000",
                "G0 X30 F20000",
                "G0 Z11 F20000",
                "G0 X1 F3000",

                "G0 Z15 F20000",
                "G0 X53 F20000",
                "G0 Y5 F3000",
                "G0 Z11 F20000",
                "G4 P500",
                "G0 X-40 F6000",
                "G0 Z15 F20000",
               
            ];

let printPosition = 1;
let sp = undefined;
let setup = false;
const print = (_commands)=>{

   return new Promise((resolve, reject)=>{
        sp = new SerialPort({
            path: '/dev/ttyUSB0',
            autoOpen: false,
            baudRate : 115200
        });
        printPosition = 0;
        
       
        const printLine = (command)=>{
            if (command){
                printerCommand(command);
            }else{
                printPosition +=1;
            }
        }

    
        sp.open(()=>{
            //force to home on first connection!
            const commands = !setup ? [...HOME,_commands] : _commands;
            setup = true;
         
            const printCommands = deconstruct(commands.reduce((acc,item)=>{
                return `${acc}\n${item}`
            },""));
    
            printerCommand(reconstruct(printCommands[0]));
            sp.on('data', function(data) {
                //console.log(data.toString());
                if (data.indexOf("wait") != -1){
                    if (printPosition >= printCommands.length){
                       
                        sp.close();
                        resolve();
                        return;
                    }
                }
                if(data.indexOf("ok") != -1 || data == "start\r"){
                
                    printPosition += 1;
                    if (printPosition < printCommands.length){
                        setTimeout(()=>{
                            printLine(reconstruct(printCommands[printPosition]));
                        },50);
                    }else{
                        console.log("finished sending commands");    
                    }
                } else {
                    //console.log("Nope", data.toString())
                }      
            });
        });
        //open serial port
        sp.on("open", function () {
            console.log("Serial Port is open.");
        });
   });
}



function printerCommand(comm){
   
    if(comm !== undefined && comm.indexOf(" ") === comm.length - 1){
        comm = comm.substring(0, comm.length - 1);
    }
   
    sp.write(comm + "\n", function(err, results) {
       
        if(err){
            console.log(">>>ERR");
            console.log(err);
            console.log("<<<");
        }
    });

}
app.use(express.static('public'));

app.get('/', (req,res)=>{
    res.send("ROBOT DATA CAPTURER")
});

app.get('/test', async (req, res)=>{
   
    const coords = [];

    /*for (let i = 0; i < 5; i++){
        
        coords.push(`G1 Z40 X${i*-10} Y0 F1000`,
                    `G1 Z35 X${i*-10} Y0 F1000`, 
                    `G1 Z40 X${i*-10} Y0 F1000`,
                    `G1 Z40 X${-10 + (i*-10)} Y0 F1000`
                    );
    }*/

    for (let i = 1; i < 2; i++){
        
        coords.push(`G1 Z40 X20 Y${0}  F1000`,
                    `G1 Z35 X20 Y${0}  F1000`, 
                    //`G1 Z40 X0 Y${i*90}  F1000`,
                    //`G1 Z40 X0 Y${10 + (i*10)}  F1000`
                    );
    }
    await print([...HOME,"G90",...coords]);
    res.send({command:"test",complete:true});
});



app.post('/peek', async (req, res)=>{
    console.log("seen a peek");
    const {image,category=""} = req.body;
	const data = image.replace(/^data:image\/\w+;base64,/, "");
	const buf = new Buffer(data, 'base64');
    var name = `${Date.now()}`
    var dir = `images/${category}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    var filename  = `${dir}/${name}.jpg`;
	fs.writeFileSync(filename, buf);
    res.send({success:true, filename});
});

app.post('/predict', async (req, res)=>{
    console.log("seen a predict");
    const image = req.body.image;
	const data = image.replace(/^data:image\/\w+;base64,/, "");
	const buf = new Buffer(data, 'base64');
    var name = `phone_${Date.now()}`
    var filename  = `images/${name}.jpg`;
	fs.writeFileSync(filename, buf);
    const response = await request.get(`http://localhost:5000?p=${name}`)
    const {body:{x,y,w,h}} = response;
	const [num, boxes, scores, classes] = await predict(buf,name);   
    const predictions = [];

    for (let i = 0; i < num; ++i){
        let [x1, y1, x2, y2] = boxes.slice(i * 4, (i + 1) * 4);
      
        x1 *= 640;
        x2 *= 640;
        y1 *= 360;
        y2 *= 360;
        const width = x2 - x1;
        const height = y2 - y1; 
        predictions.push({x:x1, y:y1, width, height, class:names[classes[i]], score:scores[i].toFixed(2)});
    }
    console.log(JSON.stringify(predictions,null,4));
    res.send({predictions, bounds:{x,y,w,h}});
});

app.get('/picture', async (req, res)=>{
    await print(NEWPICTURE)
    res.send({command:"picture",complete:true});
});

app.get('/press', async (req, res)=>{
    const {x,y} = req.query;
    await print(["G90", `G1 X${x} Y${y} Z20 F20000`,`G0 Z9 F20000`, `G4 P80`, `G0 Z20 F20000`]);
    res.send({command:"press", complete:true});
});

app.get('/tap', async (req, res)=>{
    const {x,y} = req.query;
    await print(["G90", `G1 X${x} Y${y} Z20 F20000`,`G0 Z9 F20000`, `G0 Z20 F20000`]);
    res.send({command:"tap", complete:true});
});

app.get('/swipe', async (req, res)=>{
    const {x,y} = req.query;
    await print(["G90", `G1 X${x} Y${y} Z15 F20000`,`G1 Z9 F20000`,`G1 X${x} Y${Math.max(-90,y-60)} Z15 F20000`]);
    res.send({command:"swipe", complete:true});
});


app.get('/home', async (req,res)=>{
    await print(HOME)
    res.send({command:"home", complete:true});
});

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`);
});

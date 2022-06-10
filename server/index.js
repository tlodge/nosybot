import express from 'express'
import bodyParser from 'body-parser'
import {SerialPort} from 'serialport'
import {deconstruct,reconstruct} from './GCODE/module.js'
import * as tf from '@tensorflow/tfjs-node'
import fs from 'fs'

const app = express();
app.use(bodyParser.json({limit:'25mb'}))

const PORT = 8090;
let model;

const weights = 'http://127.0.0.1:8090/model.json';
const names = ['contacts', 'isettings', 'imessage', 'whatsapp'];
let modelWidth, modelHeight;

tf.loadGraphModel(weights).then(m => {
    model=m;
    [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);
    console.log(modelWidth, modelHeight)
    
});


const predict =  async (buf)=>{
    
    var filename  = `images/phone_${Date.now()}.jpg`;
	
	fs.writeFileSync(filename, buf);
    //const imageBuffer = fs.readFileSync(path);
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

const COMMANDS = ["G91","G28 X0","G28 Y0","G28 Z0","G00 Z20 F20000","G0 X80 F20000"];
const HOME = ["G91","G28 X0","G28 Y0","G28 Z0"];
const PICTURE = ["G91","G0 X0 F5000", "G0 Y0 F20000", "G0 Z145 F20000", "G4 S1"];
const NEWPICTURE = ["G0 Z139 F5000","G0 X0 F5000", "G0 Y0 F5000"];
const SWIPE = ["G91","G0 X80 F20000","G0 Z10 F20000","G0 X-10 F6000","G0 Z30 F10000","G0 X80 F10000","G0 Z10 F10000","G0 X-10 F6000","G0 Z30 F10000" ];
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

const print = (commands)=>{

    return new Promise((resolve,reject)=>{
        sp = new SerialPort({
            path: '/dev/ttyUSB0',
            autoOpen: false,
            baudRate : 115200
        });
        printPosition = 1;
    
        const printCommands = deconstruct(commands.reduce((acc,item)=>{
            return `${acc}\n${item}`
        },""));

        const printLine = (command)=>{
            printerCommand(command);
        }

        console.log(printCommands);
    
        sp.open(()=>{
            printerCommand(reconstruct(printCommands[0]));
            sp.on('data', function(data) {
                if(data.indexOf("ok") != -1 || data == "start\r"){
                    console.log(data.toString())
                    if (printPosition <= printCommands.length){
                        setTimeout(()=>{
                            printLine(reconstruct(printCommands[printPosition]));
                        },50);
                    }else{
                        sp.close();
                        resolve();
                    }
                } else {
                    console.log("Nope")
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
        console.log(comm.slice(comm.length - 1, comm.length));
        comm = comm.substring(0, comm.length - 1);
   
    }
   
    //console.log((printPosition + 1) + " / " + printCommands.length + ": " + comm);

    sp.write(comm + "\n", function(err, results) {

        if(err){
            console.log(">>>ERR");
            console.log(err);
            console.log("<<<");
        }

        if(comm !== "M105"){
            printPosition += 1;
        }

    });

}
app.use(express.static('public'));

app.get('/', (req,res)=>{
    res.send("ROBOT DATA CAPTURER")
});

app.get('/picture', (req, res)=>{
    print([...HOME,...PICTURE])
});

app.post('/predict', async (req, res)=>{
    console.log("seen a predict");
    const image = req.body.image;
	const data = image.replace(/^data:image\/\w+;base64,/, "");
	const buf = new Buffer(data, 'base64');
	const [num, boxes, scores, classes] = await predict(buf);   
    const predictions = [];

    for (let i = 0; i < num; ++i){
        let [x1, y1, x2, y2] = boxes.slice(i * 4, (i + 1) * 4);
      
        x1 *= 640;
        x2 *= 640;
        y1 *= 360;
        y2 *= 360;
        const width = x2 - x1;
        const height = y2 - y1; 
        predictions.push({x:x1, y:y1, width, height, class:classes[i], score:scores[i].toFixed(2)});
    }
    console.log(JSON.stringify(predictions,null,4));
    res.send(predictions);
});

app.get('/pos', async (req,res)=>{
    await print([...HOME,...POS,...HOME])
    res.send("Thanks!")
});

app.get('/goto', async (req, res)=>{
    const {x,y} = req.query;
    await print([...HOME, `G0 X${x} F20000`,`G0 Y${y} F20000`,"G0 Z15 F10000","G0 Z7 F20000","G4 P80",...NEWPICTURE]);
    //,"G0 Z9 F20000","G0 Z15 F20000",...PICTURE ])
    res.send("Thanks!")
});

app.get('/home', async (req,res)=>{
    await print(HOME)
    res.send("Thanks!")
});

app.get('/swipe', async (req,res)=>{
    await print([ ...HOME,
            ...PICTURE,
            ...SWIPE,
            ...PICTURE,
            ...SWIPE,
            ...PICTURE,
            ...HOME])
    res.send("Thanks!")
});

app.get('/print', async (req,res)=>{
    print([...PICTURE])
    await res.send("Thanks!")
});

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`);
});
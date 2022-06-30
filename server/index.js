import express from 'express'
import bodyParser from 'body-parser'
import {SerialPort} from 'serialport'
import {deconstruct,reconstruct} from './GCODE/module.js'
import * as tf from '@tensorflow/tfjs-node'
import fs from 'fs'
import request  from 'superagent'
import cocoSsd from '@tensorflow-models/coco-ssd';
import {deltaX, deltaY} from './utils/coords.js';

const app = express();
app.use(bodyParser.json({limit:'25mb'}))

const PORT = 8090;
let model, cocosmodel;

const weights = 'http://127.0.0.1:8090/model.json';
const names = ['contacts', 'iphoto', 'isettings', 'imessage', 'whatsapp'];
let modelWidth, modelHeight;
let BOUNDS = {x:0,y:0,w:0,h:0};//{ x: 18, y: 39, w: 577, h: 292 };

tf.loadGraphModel(weights).then(m => {
    model=m;
    [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);
    console.log(modelWidth, modelHeight)
});


cocoSsd.load().then(m=>{
    console.log("cocos loaded!");
    cocosmodel = m;
});

const say = async (words)=>{
    await request.get(`http://localhost:5000/say`).query({words})
}
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

const HOME = ["G90","G28 X0","G28 Y0","G28 Z0"];
const PICTURE = ["G1 Z149 F5000","G1 X1 F5000", "G1 Y1 F5000"];
const ZOOMPICTURE = ["G1 Z110 F5000","G1 X1 F5000", "G1 Y1 F5000"];

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

    for (let i = 1; i < 2; i++){
        coords.push(`G1 Z40 X20 Y${0}  F1000`,`G1 Z35 X20 Y${0}  F1000`);
    }
    await print([...HOME,"G90",...coords]);
    res.send({command:"test",complete:true});
});

const cocospredict = async (filename)=>{
    try{
        const img = fs.readFileSync(filename);
        const imgTensor = tf.node.decodeImage(new Uint8Array(img), 3);
        const predictions = await cocosmodel.detect(imgTensor);
        /*(if (predictions.length > 0){
            const words = predictions.map(p=>p.class).join(" and ");
            await say(`I have seen ${words}`);
        }else{
            await say("I have not seen anything interesting");
        }*/
        if (predictions.map(p=>p.class).indexOf("person") != -1){
            await say(`I have seen a person`);
        }
        return predictions;
    }catch(err){
        console.log(err);
        return [];
    }
}

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
    if (category == "iphoto"){
      //await cocospredict(filename);
    }
    res.send({success:true, filename});
});

app.get('/say', async (req, res)=>{
    const {words} = req.query;
    console.log("getting flask to say", words);
    await say(words);
    res.send({success:true});
})

app.get('/tapback', async(req, res)=>{
    const {x,y,w,h} = { x: 18, y: 39, w: 577, h: 292 };
    console.log("bounds ate", x,y,w,h);
    const dx = deltaX(x,y+h);
    const dy = deltaY(x,y+h);
    console.log(dx, dy);
    if (w>0 && h > 0){
        await print(["G90", `G1 X${dx-8} Y${dy+16} Z20 F20000`,`G0 Z9 F20000`, `G4 P100`, `G0 Z20 F20000`]);
    }
    res.send({command:"press", complete:true});
});

app.get('/pressmiddle', async(req, res)=>{
    const {x,y,w,h} = BOUNDS;
    console.log("bounds ate", x,y,w,h);
    const dx = deltaX((x+w)/2,(y+h)/2);
    const dy = deltaY((x+w)/2,(y+h)/2);
    console.log(dx, dy);
    if (w>0 && h > 0){
        await print(["G90", `G1 X${dx+10} Y${dy} Z20 F20000`,`G0 Z9 F20000`, `G4 P10`, `G0 Z20 F20000`]);
    }
    res.send({command:"press", complete:true});
});

app.post('/bounds', async (req, res)=>{
   
    const image = req.body.image;
	const data = image.replace(/^data:image\/\w+;base64,/, "");
	const buf = new Buffer(data, 'base64');
    var filename  = `images/bounds.jpg`;
	fs.writeFileSync(filename, buf);
    const response = await request.get(`http://localhost:5000?p=bounds`);
    
    const {body:{x,y,w,h}} = response;
    console.log("---->set bounds to", {x,y,w,h})
    BOUNDS = {x,y,w,h};
    res.send({bounds:{x,y,w,h}});
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
    await print(PICTURE)
    res.send({command:"picture",complete:true});
});

app.get('/zoompicture', async (req, res)=>{
    await print(ZOOMPICTURE)
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

//either swipe from passed in coords or swipe from middle
app.get('/swipeup', async (req, res)=>{
    const {x:xb,y:yb,w,h} = BOUNDS;
    const dx = deltaX((xb+w)/2,(yb+h)/2);
    const dy = deltaY((xb+w)/2,(yb+h)/2);
    const {x=dx,y=dy, speed=20000} = req.query;
    console.log("-->in swipe up", x, y, speed);
    await print(["G90", `G1 X${x} Y${y} Z15 F20000`,`G1 Z9 F20000`,`G1 X${x} Y${Math.max(-90,y-30)} Z15 F${speed}`]);
    res.send({command:"swipe", complete:true});
});

//either swipe from passed in coords or swipe from middle
/*app.get('/swipedown', async (req, res)=>{
    const {x:xb,y:yb,w,h} = BOUNDS;
    const dx = deltaX((xb+w)/2,(yb+h)/2);
    const dy = deltaY((xb+w)/2,(yb+h)/2);
    const {x=dx,y=dy, speed=20000} = req.query;
    console.log("-->in swipe down", x, y, speed);
    await print(["G90", `G1 X${x} Y${y} Z15 F20000`,`G1 Z9 F20000`,`G1 X${x} Y${Math.min(50,x+30)} Z15 F${speed}`]);
    res.send({command:"swipe", complete:true});
});*/

app.get('/swiperight', async (req, res)=>{
    const {x,y,w,h} = BOUNDS;
    const dx = deltaX((x+w)/2,(y+h)/2);
    const dy = deltaY((x+w)/2,(y+h)/2);
    console.log(dx, dy);
    if (w>0 && h > 0){
        await print(["G90", `G1 X${dx} Y${dy} Z20 F20000`,`G0 Z9 F20000`, `G1 X${dx+40} Y${dy} Z9 F20000`, `G0 Z20 F20000`]);
    }
    res.send({command:"press", complete:true});
});

app.get('/swipeleft', async (req, res)=>{
    const {x,y,w,h} = BOUNDS;
    const dx = deltaX((x+w)/2,(y+h)/2);
    const dy = deltaY((x+w)/2,(y+h)/2);
    console.log(dx, dy);
    if (w>0 && h > 0){
        await print(["G90", `G1 X${dx+20} Y${dy} Z20 F20000`,`G0 Z9 F20000`, `G1 X${dx-20} Y${dy} Z9 F20000`, `G0 Z20 F20000`]);
    }
    res.send({command:"press", complete:true});
});


app.get('/swipedown', async (req, res)=>{
    const {x:xb,y:yb,w,h} = BOUNDS;
    const dx = deltaX((xb+w)/2,(yb+h)/2);
    const dy = deltaY((xb+w)/2,(yb+h)/2);
    const {x=dx,y=dy, speed=20000} = req.query;
    await print(["G90", `G1 X${x} Y${y} Z15 F20000`,`G1 Z9 F20000`,`G1 X${x} Y${Math.min(50,x+30)} Z15 F20000`]);
    res.send({command:"swipe", complete:true});
});

app.get('/home', async (req,res)=>{
    await print(HOME)
    res.send({command:"home", complete:true});
});

app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`);
});

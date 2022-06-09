import React, { useEffect, useState, createRef  } from "react";
import ReactDOM from "react-dom";
import MagicDropzone from "react-magic-dropzone";
import {useCamera} from './hooks/useCamera';
import "./styles.css";
import request from 'superagent';
//const tf = require('@tensorflow/tfjs');

//const weights = '/web_model/model.json';
//const weights = 'http://127.0.0.1:8080/model.json';
//const names = ['contacts', 'isettings', 'imessage', 'whatsapp']
let videoPlaying = false;

let _lastRender = Date.now();

const  App = ()=>{
  
  const videoRef = createRef();
  const canvasRef = createRef();

  const [video, isCameraInitialised, playing, setPlaying, error] = useCamera(videoRef);
  const [ctx, setCtx] = useState();
  const [model, setModel] = useState();
  const [preview, setPreview] = useState();
  const [predictions, setPredictions] = useState([]); 
 
  let boxes_data;
  let scores_data; 
  let classes_data; 
  let valid_detections_data;


  const deltaX = (px,py)=>{
   
    return -68 + py/4.1;
  }

  const deltaY = (px,py)=>{
    return -100 + px/3.69;
  }
  useEffect(()=>{
    /*tf.loadGraphModel(weights).then(model => {
      setModel(model);
    });*/
    let columns = [];

    let rows = [];

    canvasRef.current.addEventListener('mousedown', function(e) {
    
      
      const px = e.clientX;
      const py = e.clientY-364;
      console.log(px, py);
      rows = [...rows, [px,py]]
      if (rows.length == 3){
        columns = [...columns, rows]
        rows = [];
        console.log(columns);
      }
     
      //getCursorPosition(canvas, e)
    })
  },[]);


  /*const renderPredictions = (c)=>{
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";
      for (let i = 0; i < valid_detections_data; ++i){
        let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);
      
        x1 *= c.width;
        x2 *= c.width;
        y1 *= c.height;
        y2 *= c.height;
        const width = x2 - x1;
        const height = y2 - y1;
        const klass = names[classes_data[i]];
        const score = scores_data[i].toFixed(2);
        ctx.fillStyle = "#00FFFF";
        // Draw the bounding box.
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 4;
        ctx.strokeRect(x1, y1, width, height);
        
        // Draw the label background.
        ctx.fillStyle = "#00FFFF";*/
        //const textWidth = ctx.measureText(klass /*+ ":" + score*/).width;
        /*const textHeight = parseInt(font, 10); // base 10
        ctx.fillRect(x1, y1, textWidth + 4, textHeight + 4);

      }
      for (let i = 0; i < valid_detections_data; ++i){
        let [x1, y1, , ] = boxes_data.slice(i * 4, (i + 1) * 4);
        x1 *= c.width;
        y1 *= c.height;
        const klass = names[classes_data[i]];
        const score = scores_data[i].toFixed(2);

        // Draw the text last to ensure it's on top.
        ctx.fillStyle = "#000000";
        //+ ":" + score  
        ctx.fillText(klass , x1, y1);
        
      }
  }
*/
  const updateCanvas = ()=>{
    try{
      //if (ctx){
        
        //let [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);
        const c = canvasRef.current;
        if (!c){
          return
        }
    
          
        //if want to control rate
        /*
        if (Date.now() - _lastRender < 200){
           ctx.drawImage(video,0,0,640,480);
           renderPredictions(c)
            window.requestAnimationFrame(updateCanvas); 
            return;
        }*/
     
        _lastRender = Date.now();

        /*const input = tf.tidy(() => {
           return tf.image.resizeBilinear(tf.browser.fromPixels(c), [modelWidth, modelHeight]).div(255.0).expandDims(0);
        });

         
         model.executeAsync(input).then(res => {
            // Font options.
            window.requestAnimationFrame(updateCanvas); 
            ctx.drawImage(video,0,0,640,480);
           
            const [boxes, scores, classes, valid_detections] = res;
           
            boxes_data = boxes.dataSync();
            scores_data = scores.dataSync();
            classes_data = classes.dataSync();
            valid_detections_data = valid_detections.dataSync()[0];
           
            tf.dispose(res)
            renderPredictions(c);
            
        });*/
       
    }catch(err){
      console.log(err);
    }
   
  }

 /* useEffect(() => {
 
    if(video) {
      const c = canvasRef.current;
      const ctx = c.getContext("2d");
      if (ctx){
        setCtx(ctx);
        updateCanvas();
      }
    }
  }, [video, canvasRef]);*/

  const grid = (ctx)=>{
  
		ctx.drawImage(video, 0, 0, 640, 360);
    ctx.fillStyle = "#000000";
    
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 0.1;
    ctx.font = "8px Arial";

    //origin
   
    
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 1;
    
   

    const xlines = [  [[13,344],[310,358],[630,335]],
                      [[3,315], [323,326], [631,303]],
                      [[7,280], [321,285], [634,264]],
                      [[4,243], [320,242], [635,226]],
                      [[4,200], [323,195], [635,186]],
                      [[3,163], [320,153], [637,149]],
                      [[3,126], [320,110], [634,111]],
                      [[4,91],  [310,69], [632,73]],
                      [[6,53],  [306,29], [629,40]],
                      [[13,30], [285,7],  [627,24]],
    ]

    

    const ylines =  [
                      [[22,29],[16,199],[27,346]],
                      [[54,25],[48,200],[58,350]],
                      [[87,20],[82,199],[91,353]],
                      [[123,18],[117,198],[126,354]],
                      [[161,13],[157,199],[164,357]],
                      [[202,10],[200,198],[205,357]],
                      [[242,8],[241,195],[247,357]],
                      [[286,8],[285,196],[287,355]],
                      [[330,7],[332,194],[333,356]],
                      [[370,6],[375,194],[376,357]],
                      [[410,7],[417,192],[418,355]],
                      [[450,9],[460,190],[459,353]],
                      [[491,11],[500,190],[499,349]],
                      [[528,14],[540,190],[534,346]],
                      [[564,17],[575,187],[570,349]],
                      [[597,21],[609,187],[604,338]],
                      [[624,24],[635,187],[630,335]]
                    ];

  
                   
    const intersects = (a,b,c,d,p,q,r,s)=>{
      var det, gamma, lambda;
      det = (c - a) * (s - q) - (r - p) * (d - b);
      if (det === 0) {
        return false;
      } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
      }
    };

    const calculateIntercept = (p1,p2, p3, p4)=>{
      
      if (!intersects(p1[0],p1[1],p2[0],p2[1],p3[0],p3[1],p4[0],p4[1])){
        return [0,0];
      }
       const l1 = {
         s : {
           x: p1[0],
           y: p1[1]
         },
         e : {
          x: p2[0],
          y: p2[1]
         }
       }
       const l2 = {
        s : {
          x: p3[0],
          y: p3[1]
        },
        e : {
         x: p4[0],
         y: p4[1]
        }
       }

      const  a1 = l1.e.y - l1.s.y;
      const b1 = l1.s.x - l1.e.x;
      const c1 = a1 * l1.s.x + b1 * l1.s.y;
 
      const a2 = l2.e.y - l2.s.y;
      const b2 = l2.s.x - l2.e.x;
      const c2 = a2 * l2.s.x + b2 * l2.s.y;
 
      const delta = a1 * b2 - a2 * b1;
      return [(b2 * c1 - b1 * c2) / delta, (a1 * c2 - a2 * c1) / delta];
    }
    const partition = (line1, line2)=>{

      const newcoords = [];
      
      for (let m= 0.1; m <= 1; m+=0.1){
        let index = 0;
        for (const coords of line1){
          newcoords.push(
            [
              coords[0] + Math.floor((line2[index][0]-coords[0])*m),
              coords[1] + Math.floor((line2[index][1]-coords[1])*m),
            ]
          );
          index+=1;
        }
      }
      return newcoords;
  }
    
    const calculateIntercepts = (p1, p2, lines)=>{
      const intercepts = [];
      for (const line of lines){
        intercepts.push(calculateIntercept(p1,p2,line[0],line[1]));
      }
      return intercepts;
    }
    
    const expandLines = (lines)=>{
      return lines.reduce((acc,line)=>{
        return [...acc, [line[0], line[1]], [line[1],line[2]]];
      },[]);
    }

    const addmore = (lines)=>{
      let index = 0;
      
      let fulllines = [];
  
      for (const line of lines){
        const _line = []
        if (index < lines.length-1){
          const partitioned = partition(line, lines[index+1]);
          for (let i = 0; i < partitioned.length;){
            fulllines.push([partitioned[i], partitioned[i+1], partitioned[i+2]]);
            i+=3;
          }
          
        }
        index+=1;
      }
      return fulllines;
    }

    console.log(xlines);
    console.log(addmore(xlines));
    const allx = expandLines(addmore(xlines));
    const ally = expandLines(addmore(ylines));
    const intercepts = [];

    for (let x = 0; x < allx.length; x++){
      intercepts.push(...calculateIntercepts(allx[x][0], allx[x][1], ally));
    }

    
    ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1;
    for (const point of intercepts){
      
        ctx.strokeRect(point[0], point[1], 1, 1);
    }

    

    
   
    /*index = 0;
    for (const xline of xlines){
      const [mto, ...rest] = xline;
      ctx.beginPath();
      ctx.strokeStyle = "#FF0000";
      if (index < xlines.length-1){
       
          
          ctx.moveTo(mto[0],mto[1]);
          for (const xy of rest){
            const [x,y] = xy;
            ctx.lineTo(x,y);
          }
        
          ctx.stroke();
      }
      index+=1;
    }*/
    /*index = 0;
    for (const yline of ylines){
      const [mto, ...rest] = yline;
      ctx.beginPath();
      ctx.strokeStyle = "#00FF00";
      if (index < ylines.length-1){
        drawMiddleLine(yline, ylines[index+1]);
      }
      index+=1;
    }*/

  
    
   
  }

  const tap = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/goto')
      .set('content-Type', 'application/json')
      .query({x:dx, y:dy})
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
    
  }

  const snap = ()=>{
    
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    
		ctx.drawImage(video, 0, 0, 640, 360);
    grid(ctx)
    const dataURL = c.toDataURL("image/jpeg");
   
    request
     		.post('/predict')
     		.set('content-Type', 'application/json')
        .send({image:dataURL})
     		.end(async function(err, res){
		        if (err){
		          console.log(err);
		        }else{
		          
              let i = 0;
              for (let prediction of res.body){

                const {x,y,width,score,height} = prediction;
                ctx.fillStyle = "#00FFFF";
                // Draw the bounding box.
                
                ctx.strokeStyle = "#FF0000";
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, width, height);
                
                //x=0
                

                  const px = Math.floor(x + (width / 2));
                  const py = Math.floor(y + (height / 2));
                  const dx = deltaX(px,py);
                  const dy = deltaY(px,py);
                  await tap(dx,dy);  

                
              }
		        }
		    });
  }

  return (<div>
      <div> {/*className="Dropzone-page">*/}

          <video ref={videoRef} style={{
                opacity: 1, /*videoopacity,*/
                /*position:"absolute",*/
                /*marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zindex: 9,*/
                width: 640,
                height: 360,
               
              }}
            />
        
        <canvas ref={canvasRef} id="canvas" width="640" height="360" style={{/*display:"none"*/}} />
        
        {/* model ? (
          <MagicDropzone
            className="Dropzone"
            accept="image/jpeg, image/png, .jpg, .jpeg, .png"
            multiple={false}
            onDrop={onDrop}
          >
            {preview ? (
              <img
                alt="upload preview"
                onLoad={onImageChange}
                className="Dropzone-img"
                src={preview}
              />
            ) : (
              "Choose or drop a file."
            )}
            <canvas ref={canvasRef} id="canvas" width="640" height="640" />
           
          </MagicDropzone>
        ) : (
          <div className="Dropzone">Loading model...</div>
          
        )*/}
      </div>
      <button onClick={snap}>take a picture</button>
      </div>
    );
  
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

import React, { useEffect, useState, createRef  } from "react";
import ReactDOM from "react-dom";
import MagicDropzone from "react-magic-dropzone";
import {useCamera} from './hooks/useCamera';
import "./styles.css";
import request from 'superagent';
import FisheyeGl from './fish'; 
//const tf = require('@tensorflow/tfjs');
//const weights = '/web_model/model.json';
//const weights = 'http://127.0.0.1:8080/model.json';
//const names = ['contacts', 'isettings', 'imessage', 'whatsapp']
let videoPlaying = false;

let _lastRender = Date.now();

const xlines = [  [[13,344],[310,358],[635,336]],
                      [[3,315], [323,326], [635,303]],
                      [[7,280], [321,285], [634,264]],
                      [[4,243], [320,242], [635,226]],
                      [[4,200], [323,195], [635,186]],
                      [[3,163], [320,153], [637,149]],
                      [[3,126], [320,110], [634,111]],
                      [[4,91],  [310,69], [632,73]],
                      [[6,53],  [306,29], [629,40]],
                      [[13,30], [285,7],  [627,24]],
    ]

    
    //Manually drawn y gridlines matching known points on delta printer grid
//22
    const ylines =  [
                      [[22,29],[16,199],[27,346]],
                      [[54,25],[48,200],[58,350]],
                      [[87,20],[82,199],[91,353]],
                      [[123,18],[117,198],[126,354]],
                      [[161,13],[157,199],[164,357]],
                      [[202,10],[200,198],[205,357]],
                      [[242,8],[241,195],[247,357]],
                      [[286,6],[285,196],[287,365]],
                      [[330,7],[332,194],[333,365]],
                      [[370,6],[375,194],[376,357]],
                      [[410,7],[417,192],[418,355]],
                      [[450,9],[460,190],[459,353]],
                      [[491,11],[500,190],[499,349]],
                      [[528,14],[540,190],[534,346]],
                      [[564,17],[575,187],[570,349]],
                      [[597,21],[609,187],[604,348]],
                      [[624,18],[635,187],[630,345]]
                    ];

const  App = ()=>{
  
  const videoRef = createRef();
  const canvasRef = createRef();
  const canvasGLRef = createRef();

  const [video, isCameraInitialised, playing, setPlaying, error] = useCamera(videoRef);
  const [ctx, setCtx] = useState();
  const [model, setModel] = useState();
  const [preview, setPreview] = useState();
  const [predictions, setPredictions] = useState([]); 
 
  let boxes_data;
  let scores_data; 
  let classes_data; 
  let valid_detections_data;




  useEffect(()=>{
    /*tf.loadGraphModel(weights).then(model => {
      setModel(model);
    });*/
    let columns = [];

    let rows = [];

    
  },[]);


  const deltaY = (x,y)=>{
    console.log(x);
      if (x <= 13)  return -95 + Math.floor((x/13)*5); //13-0
      if (x <= 43)  return -90 + Math.floor(((x-13)/30)*10); //43-13
      if (x <= 78)  return -80 + Math.floor(((x-43)/35)*10); //78-43
      if (x <= 116) return -70 + Math.floor(((x-78)/38)*10); //116-78
      if (x <= 154) return -60 + Math.floor(((x-116)/38)*10); //154-116
      if (x <= 192) return -50 + Math.floor(((x-154)/38)*10); //192-154
      if (x <= 235) return -40 + Math.floor(((x-192)/43)*10); //235-192
      if (x <= 276) return -30 + Math.floor(((x-235)/41)*10); //276-235
      if (x <= 319) return -20 + Math.floor(((x-276)/43)*10); //319-276
      if (x <= 361) return -10 + Math.floor(((x-319)/41)*10); //361-319
      if (x <= 404) return 0 +   Math.floor(((x-361)/42)*10); //404-361
      if (x <= 445) return 10 +  Math.floor(((x-404)/41)*10); //445-404
      if (x <= 483) return 20 +  Math.floor(((x-445)/38)*10); //483-445
      if (x <= 521) return 30 +  Math.floor(((x-483)/38)*10); //521-483  
      if (x <= 557) return 40 +  Math.floor(((x-521)/36)*10); //557-521  
      if (x <= 591) return 52 +  Math.floor(((x-557)/34)*10); //591-557
      if (x <= 624) return 60 +  Math.floor(((x-591)/33)*10); //624-591
      if (x > 624)  return 70 +  Math.floor(((x-624)/15)*6)  //639-624
    }

    const deltaX = (x,y)=>{
      if (y >  346) return 21;
      if (y >= 309) return 10  + Math.floor(((y-309)/37)*10); //346-309
      if (y >= 269) return 0   + Math.floor(((y-269)/40)*10); //309-269
      if (y >= 230) return -8   + Math.floor(((y-230)/39)*10);//269-230
      if (y >= 191) return -18   + Math.floor(((y-191)/39)*10);//230-191
      if (y >= 153) return -28   + Math.floor(((y-153)/38)*10);//191-153
      if (y >= 115) return -38   + Math.floor(((y-115)/38)*10);//153-115
      if (y >= 76)  return -48   + Math.floor(((y-76)/39)*10);//115-76
      if (y >= 42)  return -58   + Math.floor(((y-42)/34)*10);//76-42
      if (y > 0)    return -68   + Math.floor(((y-7)/35)*10);//42-7
    }

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
  let generated = false;
  let deltapoints =[];
  const closestpoint = (x1,y1)=>{
    const closest = deltapoints.reduce((acc,item,index)=>{
      const [x2,y2] = item;
      const distance = Math.sqrt(((x2-x1)*(x2-x1)) + ((y2-y1)*(y2-y1)));
      if (distance < acc[0]){
        return [distance,index];
      }
      return acc;
    },[Number.MAX_SAFE_INTEGER, -1]);
    
    return deltapoints[closest[1]];
  }

  const grid = (ctx)=>{
    ctx.drawImage(video, 0, 0, 640, 360);
    ctx.fillStyle = "#000000";
    
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 2;
    ctx.font = "8px Arial";
    if (!generated){
      generatecoords(ctx);
      generated = true;
    }
	
    

    //origin
   
    
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 1;

    let index = 0;
    

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
    }
   

    index = 0;
    for (const xline of ylines){
      const [mto, ...rest] = xline;
      ctx.beginPath();
      ctx.strokeStyle = "#0000FF";
      if (index < ylines.length-1){
       
          
          ctx.moveTo(mto[0],mto[1]);
          for (const xy of rest){
            const [x,y] = xy;
            ctx.lineTo(x,y);
          }
        
          ctx.stroke();
      }
      index+=1;
    }*/
  }

  const generatecoords = (ctx)=>{
              
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
        return [-1,-1];
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

    const partition = (line1, line2)=>{
     
      const newcoords =[]
      
       for (let m= 0; m < 1; m+=0.2){
         let index = 0;
         for (const coords of line1){
           newcoords.push(
             [
               coords[0] + (line2[index][0]-coords[0])*m,
               coords[1] + (line2[index][1]-coords[1])*m,
             ]
           );
           index+=1;
         }
       }
       return newcoords;
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
      return [...fulllines,lines[lines.length-1]]
    }

  
    const allx = expandLines(addmore(xlines));
    const ally = expandLines(addmore(ylines));
    const intercepts = [];

    for (let x = 0; x < allx.length; x++){
      intercepts.push(...calculateIntercepts(allx[x][0], allx[x][1], ally));
    }

    const _intercepts = intercepts.filter(x=>x[0]!=-1)
    let index = 0
    let rowIndex = -1;
    let colIndex = 0;

    const colamount = (colIndex)=>{
      //2nd half
      if (colIndex > (81/2)){
        return -85
      }
      return -90;
    }

    const rowamount = (rowIndex, colIndex)=>{
      if (colIndex < (81/2)){
       return 24;
      }
      return 22;
    }

    for (const point of _intercepts){
      if (index % 81 === 0){ //new row
        colIndex = 0;
        rowIndex += 1;
        ctx.strokeStyle = rowIndex%2 == 0 ? "#FF0000" : "#00ff00";
      }
      const px = Math.floor(point[0]);
      const py = Math.floor(point[1]);
      deltapoints.push([px,py,(rowamount(rowIndex, colIndex) - (rowIndex*2)),colamount(colIndex)+(colIndex*2)])
      
      //ctx.strokeRect(px,py,2,2);
      colIndex += 1;
      index+=1;
    }

    
    //x = 0 axis
  /*
    0,-95 0,   269
    0,-90 13,  270
    0,-80 43,  271
    0,-70 78,  271
    0,-60 116, 271
    0,-50 154, 271
    0,-40 192, 271
    0,-30 235, 271
    0,-20 276, 271
    0,-10 319, 271
    0,0   361, 274
    0,10  404, 274 
    0,20  445, 274
    0,30  483, 273
    0,40  521, 273
    0,50  557, 272
    0,60  591, 272
    0,70  624, 272
    0,76  639, 270
  */

  //y=270 axis
  /*  
    20  346
    10  309
    0   269
    -10 230
    -20 191
    -30 153
    -40 115
    -50 76
    -60 42
    -70 7
  */

    canvasGLRef.current.addEventListener('mousedown', async function(e) {
      const px = e.clientX;
      const py = e.clientY;  
      console.log(px,py, "=>",deltaX(px, py), deltaY(px,py));
      await tap(deltaX(px, py), deltaY(px,py));
    })

    canvasRef.current.addEventListener('mousedown', async function(e) {
      const px = e.clientX;
      const py = e.clientY-364;  
      const closest = closestpoint(px,py);
    
      ctx.strokeStyle = "#ffff00";
      ctx.strokeRect(closest[0], closest[1],2,2);
      console.log(closest[2], closest[3])
      await tap(closest[2], closest[3]);  
    })
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
    const cgl = canvasGLRef.current;

    const ctx = c.getContext("2d");
    
		ctx.drawImage(video, 0, 0, 640, 360);
    grid(ctx)
    const originalImageURL = c.toDataURL("image/jpeg");
   
    var distorter = FisheyeGl({
      image: originalImageURL,
      canvas: cgl, // a canvas element to work with
      lens: {
        a: 0.872,    // 0 to 4;  default 1
        b: 0.939,    // 0 to 4;  default 1
        Fx: 0.03, // 0 to 4;  default 0.0
        Fy: 0.08, // 0 to 4;  default 0.0
        scale: 0.909 // 0 to 20; default 1.5
      },
      fov: {
        x: 1, // 0 to 2; default 1
        y: 1  // 0 to 2; default 1
      }
    });
    const dataURL = cgl.toDataURL("image/jpeg");
    console.log(dataURL);
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
                  //const delta = closestpoint(px,py);
                  //console.log(delta)
                  ctx.strokeStyle = "#FFFF00";
                  ctx.strokeRect(px-3, py-3, 6, 6);
                  
                  await tap(deltaX(px,py), deltaY(px,py));  

                
              }
		        }
		    });
  }

  return (<div>
      <div> {/*className="Dropzone-page">*/}
          <canvas ref={canvasGLRef} id="canvas" width="640" height="360" /*style={{display:"none"}}*/ />
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
       
        <canvas ref={canvasRef} id="canvas" width="640" height="360" style={{display:"none"}} />
       
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

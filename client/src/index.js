import React, { useEffect, useState, createRef  } from "react";
import ReactDOM from "react-dom";
import {useCamera} from './hooks/useCamera';
import "./styles.css";
import request from 'superagent';
import FisheyeGl from './fish';

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

const  App = ()=>{
  
  const videoRef = createRef();
  const canvasRef = createRef();
  const canvasGLRef = createRef();
  const [video, isCameraInitialised, playing, setPlaying, error] = useCamera(videoRef);
  let ctx;
  const limitY = (y)=>{
    return Math.max(-82,y)
  }

  const limitX = (x)=>{
    return Math.max(-65,x);
  }
  const deltaY = (x,y)=>{
    console.log("delta Y", x);
      if (x <= 13)  return limitY(-95 + Math.floor((x/13)*5)); //13-0
      if (x <= 43)  return limitY(-90 + Math.floor(((x-13)/30)*10)); //43-13
      if (x <= 78)  return limitY(-80 + Math.floor(((x-43)/35)*10)); //78-43
      if (x <= 116) return limitY(-70 + Math.floor(((x-78)/38)*10)); //116-78
      if (x <= 154) return limitY(-60 + Math.floor(((x-116)/38)*10)); //154-116
      if (x <= 192) return limitY(-50 + Math.floor(((x-154)/38)*10)); //192-154
      if (x <= 235) return limitY(-40 + Math.floor(((x-192)/43)*10)); //235-192
      if (x <= 276) return limitY(-30 + Math.floor(((x-235)/41)*10)); //276-235
      if (x <= 319) return limitY(-20 + Math.floor(((x-276)/43)*10)); //319-276
      if (x <= 361) return limitY(-10 + Math.floor(((x-319)/41)*10)); //361-319
      if (x <= 404) return limitY(0 +   Math.floor(((x-361)/42)*10)); //404-361
      if (x <= 445) return limitY(10 +  Math.floor(((x-404)/41)*10)); //445-404
      if (x <= 483) return limitY(20 +  Math.floor(((x-445)/38)*10)); //483-445
      if (x <= 521) return limitY(30 +  Math.floor(((x-483)/38)*10)); //521-483  
      if (x <= 557) return limitY(40 +  Math.floor(((x-521)/36)*10)); //557-521  
      if (x <= 591) return limitY(52 +  Math.floor(((x-557)/34)*10)); //591-557
      if (x <= 624) return limitY(60 +  Math.floor(((x-591)/33)*10)); //624-591
      if (x > 624)  return limitY(70 +  Math.floor(((x-624)/15)*6));  //639-624
    }

    const deltaX = (x,y)=>{
      console.log("delta X", y);
      if (y >  346) return 21;
      if (y >= 309) return limitX(10  + Math.floor(((y-309)/37)*10)); //346-309
      if (y >= 269) return limitX(0   + Math.floor(((y-269)/40)*10)); //309-269
      if (y >= 230) return limitX(-8   + Math.floor(((y-230)/39)*10));//269-230
      if (y >= 191) return limitX(-18   + Math.floor(((y-191)/39)*10));//230-191
      if (y >= 153) return limitX(-28   + Math.floor(((y-153)/38)*10));//191-153
      if (y >= 115) return limitX(-38   + Math.floor(((y-115)/38)*10));//153-115
      if (y >= 76)  return limitX(-48   + Math.floor(((y-76)/39)*10));//115-76
      if (y >= 42)  return limitX(-58   + Math.floor(((y-42)/34)*10));//76-42
      if (y < 42)    return limitX(-68   + Math.floor(((y-7)/35)*10));//42-7
    }

  

  useEffect(()=>{
    canvasGLRef.current.addEventListener('mousedown', async function(e) {
      const px = e.clientX;
      const py = e.clientY;  
      console.log(px,py, "=>",deltaX(px, py), deltaY(px,py));
      if (e.button == 0){
        await tap(deltaX(px, py), deltaY(px,py));
      }
      else if (e.button == 1){
        await swipeup(deltaX(px, py), deltaY(px,py));
      }
    })
  },[]);

  const swipeup = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/swipe')
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
    

    setTimeout(()=>{
      const dataURL = distorter.getImage("image/jpeg");
    
      request
     		.post('/predict')
     		.set('content-Type', 'application/json')
        .send({image:dataURL})
     		.end(async function(err, res){
		        if (err){
		          console.log(err);
		        }else{
              let i = 0;
              const {x:_x,y:_y,w:_w,h:_h} = res.body.bounds;
              for (let prediction of res.body.predictions || []){
                const {x,y,width,score,height} = prediction;
                ctx.fillStyle = "#00FFFF";
                ctx.strokeStyle = "#FF0000";
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, width, height);
                const px = Math.floor(x + (width / 2));
                const py = Math.floor(y + (height / 2));
                ctx.strokeStyle = "#FFFF00";
                ctx.strokeRect(px-3, py-3, 6, 6);
                await tap(deltaX(px,py), deltaY(px,py))
                if (!(_x==0 && _y==0 && _w==0 && _h==0)){
                  await swipeup(deltaX((_x+_w)-30,(_y+_h)/2),deltaY((_x+_w)-30,(_y+_h)/2));
                }
              }  
		        }
		    });
      },500);
  }

  return (<div>
      <div> 
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
      </div>
      <button onClick={snap}>take a picture</button>
      </div>
    );
  
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

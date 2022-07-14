import React, { useEffect, useState, createRef  } from "react";
import ReactDOM from "react-dom";
import {useCamera} from './hooks/useCamera';
import "./styles.css";
import request, { listeners } from 'superagent';
import FisheyeGl from './fish';

const PHONEBORDERX = 0;//21;
const PHONEBORDERY = 0;//42;

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
const TAP = "tap";
const DOUBLETAP = "doubletap";
const TAPANDSAY = "tapandsay";
const SWIPELEFT = "swipeleft";
const SWIPERIGHT = "swiperight";
const SWIPEUP = "swipeup";
const SWIPEDOWN = "swipedown";

let elisteners = [];

const  App = ()=>{
  let distorter, BOUNDS, _mode;
  _mode="tap";
  
  
  const videoRef = createRef();
  const canvasRef = createRef();
  const canvasGLRef = createRef();
  const [video, isCameraInitialised, playing, setPlaying, error] = useCamera(videoRef);
  const [mode, _setMode] = useState(TAP)
 
  const setMode = (mode)=>{
    _mode = mode;
    _setMode(mode);
  }

  const limitY = (y)=>{
    const MAX = -90;
    console.log("getting limit y, returning", y, "=>", Math.max(MAX,y));
    return Math.max(MAX,y);
  }

  const limitX = (x)=>{
    return Math.max(-65,x);
  }
  const deltaY = (x,y)=>{
      //console.log("delta Y", x);
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
      if (y >= 153) return limitX(-30   + Math.floor(((y-153)/38)*10));//191-153
      if (y >= 115) return limitX(-38   + Math.floor(((y-115)/38)*10));//153-115
      if (y >= 76)  return limitX(-48   + Math.floor(((y-76)/39)*10));//115-76
      if (y >= 42)  return limitX(-58   + Math.floor(((y-42)/34)*10));//76-42
      if (y < 42)    return limitX(-68   + Math.floor(((y-7)/35)*10));//42-7
    }

  

  useEffect(()=>{
  
    const listener = async (e)=>{
    
      const px = e.clientX;
      const py = e.clientY;  
      console.log(px,py, "=>",deltaX(px, py), deltaY(px,py));
      console.log("looking up", mode);
      switch (mode){
        case TAP:
          console.log("calling tap");
          await tap(deltaX(px, py), deltaY(px,py));
          break;
        case TAPANDSAY:
          console.log("calling tap and say");
          await tapandsay(deltaX(px, py),deltaY(px,py));
          break;
        case DOUBLETAP:
          console.log("calling dbltap");
          await doubletap(deltaX(px, py), deltaY(px,py));
          break;
        case SWIPELEFT:
          console.log("calling swipe left");
          await swipeleft({x:deltaX(px, py), y:deltaY(px,py)});
          break;
        case SWIPERIGHT:
          console.log("calling swipe right");
          await swiperight({x:deltaX(px, py), y:deltaY(px,py)});
          break;
        case SWIPEUP:
          console.log("calling swipe up");
          await swipeup({x:deltaX(px, py), y:deltaY(px,py)});
          break;
        case SWIPEDOWN:
          console.log("calling swipe down");
          await swipedown({x:deltaX(px, py), y:deltaY(px,py)});
          break;
       
      }
  }
  
  elisteners.forEach(l=>canvasGLRef.current.removeEventListener('mousedown', l))
  elisteners = []   
  elisteners.push(listener)
  canvasGLRef.current.addEventListener('mousedown', listener);
    
      
  
  },[mode]);

 
  const swipeup = ({x:dx,y:dy,speed=20000})=>{
    const query = dx && dy ? {dx, dy, speed} : {speed};
    return new Promise((resolve, reject)=>{
      request.get('/swipeup')
      .set('content-Type', 'application/json')
      .query(query)
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
  }
  
  const swipedown = ({x:dx,y:dy, speed=20000})=>{
    console.log("in swip down!!")
    const query = dx && dy ? {dx, dy, speed} : {speed};
    return new Promise((resolve, reject)=>{
      request.get('/swipedown')
      .set('content-Type', 'application/json')
      .query(query)
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
  }

  const swiperight = ({x:dx,y:dy, speed=20000})=>{
    const query = dx && dy ? {dx, dy, speed} : {speed};
    return new Promise((resolve, reject)=>{
      request.get('/swiperight')
      .set('content-Type', 'application/json')
      .query(query)
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
  }

  const swipeleft = ({x:dx,y:dy, speed=20000})=>{
    const query = dx && dy ? {dx, dy, speed} : {speed};
    return new Promise((resolve, reject)=>{
      request.get('/swipeleft')
      .set('content-Type', 'application/json')
      .query(query)
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
  }

 
  const tapandsay = (dx,dy, words="whatsapp")=>{
    return new Promise((resolve, reject)=>{
      request.get('/tapandsay')
      .set('content-Type', 'application/json')
      .query({x:dx, y:dy, words})
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
      request.get('/tap')
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

  const doubletap = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/doubletap')
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

  const press = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/tap')
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

  const picture = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/picture')
      .set('content-Type', 'application/json')
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        //TODO: make wait part of picture - i.e. give camera time to catch up before returning!
        resolve();
      });
    }); 
  }

  const zoompicture = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/zoompicture')
      .set('content-Type', 'application/json')
      .end(function(err, res){
        if(err){
          console.log(err);
        }
      
        //TODO: make wait part of picture - i.e. give camera time to catch up before returning!
        resolve();
      });
    }); 
  }

 

  const tapback = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/tapback')
      .set('content-Type', 'application/json')
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
  }

  const pressmiddle = (dx,dy)=>{
    return new Promise((resolve, reject)=>{
      request.get('/pressmiddle')
      .set('content-Type', 'application/json')
      .end(function(err, res){
        if(err){
          console.log(err);
        }
        resolve();
      });
    });
  }

  const waitfor = (ms)=>{ 
    return new Promise((resolve, reject)=>{
       setTimeout(resolve, ms);
    });
  }

  const swipeupfor = async(n, {x,y,w,h})=>{
    const arr = Array.from({ length: n }, (_, i) => i)
    for (const swipe of arr){
      await swipeup(deltaX(x+w-100,(y+h)/2),deltaY(x+w-100,(y+h)/2));
    }
  }
  const swipedownfor = async(n, {x,y,w,h})=>{
    const arr = Array.from({ length: n }, (_, i) => i)
    for (const swipe of arr){
      await swipedown({x:deltaX(x+w/2,(y+h)/2),y:deltaY(x+w/2,(y+h)/2)});
    }
  }

  const repeatfor = (n, fn)=>{
    return new Promise(async (resolve, reject)=>{
      const arr = Array.from({ length: n }, (_, i) => i)
      for (const swipe of arr){
        await fn();
      }
      resolve();
    });
  };

  const contacts = async(bounds)=>{
    const {x,y,w,h} = bounds;
    //tap bottom left nav button (library)
    const fifth = h/5
    const delta = 3*Math.floor(fifth);
    await tap(deltaX(x+w-50,y+delta),deltaY(x+w-50,y+delta));
    await peek("contacts");
  }


  const snapevery = (duration, no, category)=>{
    console.log("snapping a photo every", duration, "ms");

    return new Promise((resolve, reject)=>{ 
      const snaptimer = async (index=0)=>{
        if (index >= no){
          resolve();
        }
        else{ 
            snap(); 
            await sendpicture(category);
            setTimeout(()=>{
              snaptimer(++index); 
            }, duration);
        }
      }
      snaptimer();
    });
  }

  const iphoto = async(bounds)=>{
    const {x,y,w,h} = bounds;
    
    //tap the back button incase phone is already looking at a picture
    await(tapback());
    //or zoomed in on picture
    await(tapback());

    //tap bottom left nav button (library)
    const quart = h/4;
    const delta = 2 * Math.floor(quart);
    await tap(deltaX(x+w-50,y+delta),deltaY(x+w-50,y+delta));
    await waitfor(500);
    await tap(deltaX(x+w-50,y+delta),deltaY(x+w-50,y+delta));
    //start the photo slideshow
    await pressmiddle();
    await pressmiddle();
    await zoompicture();
    await waitfor(1000); //camera lag!
    await snapevery(3000,1,"iphoto")
    await(tapback())
    await(tapback())
  }

  const iphotoroll = async(bounds)=>{
    const {x,y,w,h} = bounds;
    
    //tap the back button incase phone is already looking at a picture
    await(tapback());
    //or zoomed in on picture
    await(tapback());

    //tap bottom left nav button (library)
    const quart = h/4;
    const delta = 3 * Math.floor(quart);
    await tap(deltaX(x+w-50,y+delta),deltaY(x+w-50,y+delta));
    await waitfor(500);
    await tap(deltaX(x+w-50,y+delta),deltaY(x+w-50,y+delta));

    for (const x of [1,2,3,4, 5]){
      //await repeatfor(1, async?? ()=>{ swipedown({x:deltaX(x+w/2,(y+h)/2),y:deltaY(x+w/2,(y+h)/2)})});

      await swipedownfor(1, {x:deltaX((x+w)/2,(y+h)/2),y:deltaY((x+w)/2,(y+h)/2)});
      //stop scroll
      await pressmiddle();
      //open picture
      await pressmiddle();
      //focus on picture
      await pressmiddle();
      await grab("iphoto");
      //defocus picture
      await(tapback());
      //go back
      await(tapback());
    }

  }

  const adjustforborders = (bounds)=>{
    return {
      x: bounds.x+PHONEBORDERX,
      y: bounds.y+PHONEBORDERY,
      w: bounds.w-PHONEBORDERX,
      h: bounds.h-PHONEBORDERY,
    }
  }

  const say = async (words)=>{
    console.log("saying", words);
    await request
     		.get('/say')
        .query({words})
  }

  
  const requestBounds = async(dataURL)=>{
    console.log("requesting bounds!");
    return new Promise((resolve, reject)=>{
      request
      .post('/bounds')
      .set('content-Type', 'application/json')
      .send({image:dataURL})
      .end(async function(err, res){
        if (err){
          console.log(err);
        }else{
          console.log("set bounds to", res.body.bounds);
          BOUNDS = res.body.bounds;
          resolve(res.body.bounds);
        }
      })
    });
  }

  const libraryscreen = async()=>{
    await repeatfor(10, swiperight)
  }

  const searchscreen = async()=>{
    await repeatfor(5, swipeleft)
  }

  const boundscheck = async ()=>{
    await picture();
    await waitfor(1000)
    await snap();
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
		ctx.drawImage(video, 0, 0, 640, 360);
    const dataURL = c.toDataURL("image/jpeg");
    const _bounds = await requestBounds(dataURL);
    const {x,y,w,h} = _bounds;
    await tap(deltaX(x,y), deltaY(x,y));
    await tap(deltaX(x+w,y), deltaY(x+w, y));
    await tap(deltaX(x,y+h), deltaY(x,y+h));
    await tap(deltaX(x+w,y+h), deltaY(x+w,y+h));
  }

  const predict =  ()=>{
    return new Promise((resolve, reject)=>{
      setTimeout(async ()=>{
        const dataURL = distorter.getImage("image/jpeg");
        let _bounds = BOUNDS;
        if (!_bounds){
          _bounds = await requestBounds(dataURL);
        }
        request
          .post('/predict')
          .set('content-Type', 'application/json')
          .send({image:dataURL})
          .end(async function(err, res){
              if (err){
                console.log(err);
              }else{
                let i = 0;
                console.log("Bounds", _bounds);
                const {x:_x,y:_y,w:_w,h:_h} = adjustforborders(_bounds);
                
                for (let prediction of res.body.predictions || []){
                  const {x,y,width,class:category,height} = prediction;
                  if (["iphoto"].indexOf(category) !== -1){
                    await say(`looking at ${category}`);
                    const px = Math.floor(x + (width / 2));
                    const py = Math.floor(y + (height / 2));
                    //open the app
                    console.log("px", px, "py", py)
                  
                    await press(deltaX(px,py), deltaY(px,py));
                    
                    await peek(category);

                    if (category === "iphoto"){
                      await iphoto({x:_x,y:_y,w:_w,h:_h});
                    }
                    if (category === "contacts"){
                      await contacts({x:_x,y:_y,w:_w,h:_h});
                    }

                    //close app
                    if (!(_x==0 && _y==0 && _w==0 && _h==0)){
                      await swipeup({x:deltaX((_x+_w)-35,(_y+_h)/2),y:deltaY((_x+_w)-35,(_y+_h)/2)});
                    }
                    await picture(); 
                    
                  }
                }
                resolve();
                
              }
          });
        },500);
      });
   
  }

  const sendpicture = (category)=>{
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
		ctx.drawImage(video, 0, 0, 640, 360);
    const dataURL = c.toDataURL("image/jpeg");
    return new Promise((resolve, reject)=>{
      request
        .post('/peek')
        .set('content-Type', 'application/json')
        .send({image:dataURL, category})
        .end(async function(err, res){
          
          resolve();
        })
    })
  }

  const grab = async (category)=>{
    await zoompicture();
    await waitfor(2000);
    await sendpicture(category);  
    await picture(); 
  }

  const peek = async (category)=>{
    await picture();
    await waitfor(2000);
    await sendpicture(category);
    await picture();
  }

  const train = async (category)=>{
    await picture();
    await waitfor(2000);
    await snap();
    await waitfor(1000);
    const dataURL = distorter.getImage("image/jpeg");
    return new Promise((resolve, reject)=>{
      request
        .post('/peek')
        .set('content-Type', 'application/json')
        .send({image:dataURL, category})
        .end(async function(err, res){
          
          resolve();
        })
    })
  }
  const snap =  ()=>{

    const c = canvasRef.current;
    const cgl = canvasGLRef.current;

    const ctx = c.getContext("2d");
		ctx.drawImage(video, 0, 0, 640, 360);
    const originalImageURL = c.toDataURL("image/jpeg");
    
    //need an await here!
    distorter = FisheyeGl({
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
   
  }

  const snapandpredict = async()=>{

    /*await searchscreen();
    await swiperight();

    //have a look on the first screen
    await picture();
    await waitfor(2000); //wait for camera lag to catch up!
    snap();
    await predict();

    //goto to library screen
    await libraryscreen();
    
    //try again
    await picture();
    await waitfor(2000);
    snap();
    await predict();

    //scroll down the screen and try again
    await swipeup({speed:5000});
    await picture();
    await waitfor(2000);*/
    snap();
    await predict();

    //end
    await picture();
  }

  const home = async()=>{
    await picture();
  }

  

  return (<div>
      <div> 
          <canvas ref={canvasGLRef} id="canvas" width="640" height="360" /*style={{display:"none"}}*/ />
          <video ref={videoRef} style={{
                opacity: 1, 
                width: 640,
                height: 360,
               
              }}
            />
          <canvas ref={canvasRef} id="canvas" width="640" height="360" style={{display:"none"}} />
      </div>

      <div>{mode}</div>
      <button onClick={snapandpredict}>predict</button>
      <button onClick={snap}>snap</button>
      <button onClick={boundscheck}>boundscheck</button>
      <button onClick={home}>home</button>
      <button onClick={()=>train("search")}>train</button>

      <button onClick={()=>setMode(TAP)}>{`${TAP} mode`}</button>
      <button onClick={()=>setMode(DOUBLETAP)}>{`${DOUBLETAP} mode`}</button>
      <button onClick={()=>setMode(TAPANDSAY)}>{`${TAPANDSAY} mode`}</button>
      <button onClick={()=>setMode(SWIPELEFT)}>{`${SWIPELEFT} mode`}</button>
      <button onClick={()=>setMode(SWIPERIGHT)}>{`${SWIPERIGHT} mode`}</button>
      <button onClick={()=>setMode(SWIPEUP)}>{`${SWIPEUP} mode`}</button>
      <button onClick={()=>setMode(SWIPEDOWN)}>{`${SWIPEDOWN} mode`}</button>
      

      </div>
    );
  
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

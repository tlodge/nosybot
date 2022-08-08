import React, { useEffect, useState, createRef,useRef} from "react";
import ReactDOM from "react-dom";
import {useCamera} from './hooks/useCamera';
import "./styles.css";
import request, { listeners } from 'superagent';
import FisheyeGl from './fish';


const PHONEBORDERX = 0;//21;
const PHONEBORDERY = 0;//42;

  
const TAP = "tap";
const DOUBLETAP = "doubletap";
const TAPANDSAY = "tapandsay";
const SWIPELEFT = "swipeleft";
const SWIPERIGHT = "swiperight";
const SWIPEUP = "swipeup";
const SWIPEDOWN = "swipedown";

let elisteners = [];
const xs = [13,43,78,116,154,192,235,276,319,361,404,445,483,521,557,591,624];
const ys = [346,309,269,230,191,153,115,76,42];

const  App = ()=>{
  let distorter, BOUNDS, _mode;

  /*let xdeltas, ydeltas;

  const setXdeltas = (_xdeltas)=>{
    xdeltas = [..._xdeltas];
    console.log("set x deltas", xdeltas);
  }
  const setYdeltas = (_ydeltas)=>{
    ydeltas = [..._ydeltas];
    console.log("set y deltas", ydeltas);
  }*/

  _mode="tap";
  
  
  const videoRef = createRef();
  const canvasRef = createRef();
  const canvasGLRef = createRef();
  const [video, isCameraInitialised, playing, setPlaying, error] = useCamera(videoRef);
  const [mode, _setMode] = useState(TAP)
 
  const [xdeltas, _setXdeltas] = useState();
  const [ydeltas, _setYdeltas] = useState();
 
  const xdeltasRef = useRef(xdeltas);
  const ydeltasRef = useRef(ydeltas);

  const [hadjust, setHadjust] = useState(0);
  const [vadjust, setVadjust] = useState(0);

  const [predictions, setPredictions] = useState([]);
  const [v, setV] = useState();
  const [h, setH] = useState();

  const [showCalibration, setShowCalibration] = useState(false);

  const setXdeltas = (_xdeltas)=>{
    xdeltasRef.current = _xdeltas;
    _setXdeltas(_xdeltas);
  }

  const setYdeltas = (_ydeltas)=>{
    ydeltasRef.current = _ydeltas;
    _setYdeltas(_ydeltas);
  }

  const toggleCalibration = ()=>{
    setShowCalibration(!showCalibration);
  }

  useEffect(()=>{
    console.log("loading x and y deltas");

    request.get('/calibration')
      .set('content-Type', 'application/json')
      .end(function(err, res){
        const {xdeltas:_xdeltas,ydeltas:_ydeltas} = res.body;
        setXdeltas(_xdeltas);
        setYdeltas(_ydeltas);
      })

  },[]);

  //useEffect(()=>{
   // console.log("have xdeltas", xdeltas);
  //  console.log("have ydeltas", ydeltas);
  //},[xdeltas,ydeltas])

  const saveCalibration = ()=>{
    request.post('/setcalibration')
    .set('content-Type', 'application/json')
    .send({xdeltas,ydeltas})
    .end(function(err, res){
      console.log(res.body);
    })
  }

  const _setHadjust = (e,value)=>{
    e.preventDefault();
    e.stopPropagation();
    try{
      setHadjust(value);
      calibrate(value, vadjust);
    }catch(err){
      
    }
   
  }

  const _setVadjust = (e,value)=>{
    e.preventDefault();
    e.stopPropagation();
    try{
      setVadjust(value);
      calibrate(hadjust,value);
    
    }catch(err){

    }
    
  }


  const setMode = (mode)=>{
    _mode = mode;
    _setMode(mode);
  }

  const limitY = (y)=>{
    const MAX = -90;
    return Math.max(MAX,y);
  }

  const limitX = (x)=>{
    return Math.max(-65,x);
  }

  const _printYdeltas = (x,y)=>{
    const _ydeltas  = ydeltasRef.current;
    console.log("have xdeltas", _ydeltas, " and x and y ", x, y);
    console.log("ydeltas for", x , " is ");
    if (x <= 13)  console.log(_ydeltas[0]);
    else if (x <= 43)  console.log(_ydeltas[1]);
    else if (x <= 78)  console.log(_ydeltas[2]);
    else if (x <= 116) console.log(_ydeltas[3]);
    else if (x <= 154) console.log(_ydeltas[4]);
    else if (x <= 192) console.log(_ydeltas[5]);
    else if (x <= 235) console.log(_ydeltas[6]);
    else if (x <= 276) console.log(_ydeltas[7]);
    else if (x <= 319) console.log(_ydeltas[8]);
    else if (x <= 361) console.log(_ydeltas[9]);
    else if (x <= 404) console.log(_ydeltas[10]);
    else if (x <= 445) console.log(_ydeltas[11]);
    else if (x <= 483) console.log(_ydeltas[12]);
    else if (x <= 521) console.log(_ydeltas[13]);
    else if (x <= 557) console.log(_ydeltas[14]);
    else if (x <= 591) console.log(_ydeltas[15]);
    else if (x <= 624) console.log(_ydeltas[16]);
    else if (x > 624) console.log(_ydeltas[17])
  }

  const _printXdeltas = (x,y) =>{
    const _xdeltas  = xdeltasRef.current;
    console.log("have xdeltas", _xdeltas, " and x and y ", x, y)
    console.log("xdeltas for", y , " is ");
    if (y >  346) console.log(_xdeltas[0]);
    else if (y >= 309) console.log(_xdeltas[1]);
    else if (y >= 269) console.log(_xdeltas[2]);
    else if (y >= 230) console.log(_xdeltas[3]);
    else if (y >= 191) console.log(_xdeltas[4]);
    else if (y >= 153) console.log(_xdeltas[5]);
    else if (y >= 115) console.log(_xdeltas[6]);
    else if (y >= 76)  console.log(_xdeltas[7]);
    else if (y >= 42)  console.log(_xdeltas[8]);
    else if (y < 42)   console.log(_xdeltas[9]);
  }
  
  //This provides the  <----> (horizontal) on the (landscape) phone 
  //Note the boundaries correspond to 1cm intervals on the delta printer.  
  //the divisors (i.e. 2.6,3.0,3.5 etc) translate between the two coordinate
  //systems (i.e. there are roughly 3.9 pixels to a mm, dependent on distance 
  //from center of camera focus (barrel lens)).The ydeltas[i] is an offset, 
  //that can be adjusted if/when small changes to the delta camera positioning
  //change.  Could put this in a loop but easier to understand like this.
  const deltaY = (x,y)=>{
      //console.log("delta Y", x);
      const _ydeltas  = ydeltasRef.current;
      console.log("in delta y with ydeltas", _ydeltas);
      _printYdeltas(x,y);

      if (x <= 13)  return limitY(_ydeltas[0] + Math.floor(x/2.6)) 
      if (x <= 43)  return limitY(_ydeltas[1] + Math.floor((x-13)/3.0)); 
      if (x <= 78)  return limitY(_ydeltas[2] + Math.floor((x-43)/3.5)); 
      if (x <= 116) return limitY(_ydeltas[3] + Math.floor((x-78)/3.8)); 
      if (x <= 154) return limitY(_ydeltas[4] + Math.floor((x-116)/3.8)); 
      if (x <= 192) return limitY(_ydeltas[5] + Math.floor((x-154)/3.8));
      if (x <= 235) return limitY(_ydeltas[6] + Math.floor((x-192)/4.3));
      if (x <= 276) return limitY(_ydeltas[7] + Math.floor((x-235)/4.1)); 
      if (x <= 319) return limitY(_ydeltas[8] + Math.floor((x-276)/4.3)); 
      if (x <= 361) return limitY(_ydeltas[9] + Math.floor((x-319)/4.1)); 
      if (x <= 404) return limitY(_ydeltas[10] +  Math.floor((x-361)/4.2));
      if (x <= 445) return limitY(_ydeltas[11] +  Math.floor((x-404)/4.1)); 
      if (x <= 483) return limitY(_ydeltas[12] +  Math.floor((x-445)/3.8)); 
      if (x <= 521) return limitY(_ydeltas[13] +  Math.floor((x-483)/3.8)); 
      if (x <= 557) return limitY(_ydeltas[14] +  Math.floor((x-521)/3.6));  
      if (x <= 591) return limitY(_ydeltas[15] +  Math.floor((x-557)/3.4)); 
      if (x <= 624) return limitY(_ydeltas[16] +  Math.floor((x-591)/3.3)); 
      if (x > 624)  return limitY(_ydeltas[17] +  Math.floor((x-624)/2.5));
    }

    
    
    //This provides the vertical
    // ^
    // |
    // |
    // v 
    // on the (landscape) phone 
    //Note the boundaries correspond to 1cm intervals on the delta printer.  
    //the divisors (i.e. 3.7,4.0,3.9 etc) translate bewteen the two coordinate
    //systems (i.e. there are roughly 3.9 pixels to a mm, dependent on distance 
    //from center of camera focus (barrel lens)).The xdeltas[i] is an offset, 
    //that can be adjusted if/when small changes to the delta camera positioning
    //change.  Could put this in a loop but easier to understand like this.

    const deltaX = (x,y)=>{ 
      
      const _xdeltas  = xdeltasRef.current;
      console.log("in delta x with xdeltas", _xdeltas);
      _printXdeltas(x,y);
      if (y >  346) return _xdeltas[0] + 21;
      if (y >= 309) return limitX(_xdeltas[1] + Math.floor((y-309)/3.7)); 
      if (y >= 269) return limitX(_xdeltas[2] + Math.floor((y-269)/4.0)); 
      if (y >= 230) return limitX(_xdeltas[3] + Math.floor((y-230)/3.9));
      if (y >= 191) return limitX(_xdeltas[4] + Math.floor((y-191)/3.9));
      if (y >= 153) return limitX(_xdeltas[5] + Math.floor((y-153)/3.8));
      if (y >= 115) return limitX(_xdeltas[6] + Math.floor((y-115)/3.8));
      if (y >= 76)  return limitX(_xdeltas[7] + Math.floor((y-76)/3.9));
      if (y >= 42)  return limitX(_xdeltas[8] + Math.floor((y-42)/3.4));
      if (y < 42)   return limitX(_xdeltas[9] + Math.floor((y-7)/3.5));
    }

  
 

  useEffect(()=>{
  
    const listener = async (e)=>{
    
      const px = e.clientX;
      const py = e.clientY;  
     
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

 
  const adjusthorizontal = (x,y,direction)=>{
    console.log("adjusting horizontal", x, y, direction)
  }

  const adjustvertical = (x,y, direction)=>{
    console.log("adjusting vertical", x, y, direction)
  }

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
    console.log("in swipe down!!")
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
                setPredictions(res.body.predictions)
                for (let prediction of res.body.predictions || []){
                  const {x,y,width,class:category,height} = prediction;
                  
                  if (["iphotos"].indexOf(category) !== -1){
                    //await say(`looking at ${category}`);
                    const px = Math.floor(x + (width / 2));
                    const py = Math.floor(y + (height / 2));
                    //open the app
                   
                    //if (category=="mic"){
                    //  await tapandsay(deltaX(px,py), deltaY(px,py), "what app");
                    //}
                    if (category=="back"){
                      await tap(deltaX(px,py), deltaY(px,py));
                    }
                    //await peek(category);

                    if (category === "iphotos"){
                      await tap(deltaX(px,py), deltaY(px,py));
                      //await iphoto({x:_x,y:_y,w:_w,h:_h});
                    }
                    if (category === "contacts"){
                      await contacts({x:_x,y:_y,w:_w,h:_h});
                    }
                    
                    //close app
                    //if (!(_x==0 && _y==0 && _w==0 && _h==0)){
                    //  await swipeup({x:deltaX((_x+_w)-35,(_y+_h)/2),y:deltaY((_x+_w)-35,(_y+_h)/2)});
                    //}
                    await picture(); 
                    
                  } //if iphoto
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

 
  const xIndexFor= (y)=>{
    if (y >  346) return 0;
    else if (y >= 309) return 1
    else if (y >= 269) return 2
    else if (y >= 230) return 3
    else if (y >= 191) return 4
    else if (y >= 153) return 5
    else if (y >= 115) return 6
    else if (y >= 76) return 7
    else if (y >= 42) return 8
    else if (y < 42)   return 9
  } 

  const yIndexFor = (x)=>{
    if (x <= 13)  return 0;
    else if (x <= 43)  return 1;
    else if (x <= 78) return 2;
    else if (x <= 116) return 3;
    else if (x <= 154) return 4;
    else if (x <= 192)return 5;
    else if (x <= 235) return 6;
    else if (x <= 276) return 7;
    else if (x <= 319) return 8;
    else if (x <= 361) return 9;
    else if (x <= 404) return 10;
    else if (x <= 445) return 11;
    else if (x <= 483) return 12;
    else if (x <= 521) return 13;
    else if (x <= 557) return 14;
    else if (x <= 591) return 15;
    else if (x <= 624) return 16;
    else if (x > 624) return 17;
  }

  const calibrateInput = (event)=>{
    const {clientX:x, clientY:y} = event;
    console.log("have x", x, " and y", y)
    const h = yIndexFor(x);
    const v = xIndexFor(y);
    tap(deltaX(x,y), deltaY(x,y))
    setV(v);
    setH(h);
    setVadjust(0)
    setHadjust(0)
  }

  const renderCircles = ()=>{
     
        const grid = xs.map((x,_h)=>{
          return ys.map((y,_v)=>{
            const selected = h==_h&&v==_v;
            return <g>
                      <circle  cx={x} cy={y} r={4} style={{fill: selected ? "red":"white", stroke:"black"}}/>
                      {selected && renderAdjuster(x,y)}
                    </g>
          })
        });

        const boxes = predictions.map((prediction)=>{
          const {x,y,width, height} = prediction;
          const px = Math.floor(x + (width / 2));
          const py = Math.floor(y + (height / 2));
          return <g>
            <rect x={x} y={y} width={width} height={height} style={{stroke: "red", fill:"transparent"}}/>
            <circle  cx={px} cy={py} r={4} style={{fill: "transparent", stroke:"red"}}/>
          </g>
        });
        return <g>
                  {boxes}
                  {grid}
                  
              </g>
  }   



  const calibrate = (_horizontal, _vertical)=>{
   
    console.log("***** adjusting by *****", _horizontal, _vertical);

    const _xdeltas = xdeltas.map((value, index)=>{
      if (v==index){
        return Number(value)+Number(_horizontal);
      }
      return value;
    });
    console.log("AFTER calibration x deltas", _xdeltas)
    setXdeltas(_xdeltas);

    console.log("before calibration y deltas", ydeltas)
    const _ydeltas = ydeltas.map((value, index)=>{
      if (h==index){
        return Number(value)+Number(_vertical);
      }
      return value;
    });

    setYdeltas(_ydeltas);

   
  }

  const renderAdjuster = (x,y)=>{

    return <g>
              <line onClick={(e)=>_setVadjust(e,vadjust-1)} x1={x-8} x2={x-18} y1={y} y2={y} style={{stroke:"black", strokeWidth:3}}/> 
              <line onClick={(e)=>_setVadjust(e,vadjust-1)} x1={x-18} x2={x-12} y1={y} y2={y-5} style={{stroke:"black", strokeWidth:2}}/> 
              <line onClick={(e)=>_setVadjust(e,vadjust-1)} x1={x-18} x2={x-12} y1={y} y2={y+5} style={{stroke:"black", strokeWidth:2}}/> 

              <line onClick={(e)=>_setVadjust(e,vadjust+1)} x1={x+8} x2={x+18} y1={y} y2={y} style={{stroke:"black", strokeWidth:3}}/> 
              <line onClick={(e)=>_setVadjust(e,vadjust+1)} x1={x+18} x2={x+12} y1={y} y2={y-5} style={{stroke:"black", strokeWidth:2}}/> 
              <line onClick={(e)=>_setVadjust(e,vadjust+1)} x1={x+18} x2={x+12} y1={y} y2={y+5} style={{stroke:"black", strokeWidth:2}}/> 

              <line onClick={(e)=>_setHadjust(e,hadjust-1)} x1={x} x2={x} y1={y-8} y2={y-18} style={{stroke:"black", strokeWidth:3}}/> 
              <line onClick={(e)=>_setHadjust(e,hadjust-1)} x1={x} x2={x-5} y1={y-18} y2={y-12} style={{stroke:"black", strokeWidth:2}}/> 
              <line onClick={(e)=>_setHadjust(e,hadjust-1)} x1={x} x2={x+5} y1={y-18} y2={y-12} style={{stroke:"black", strokeWidth:2}}/> 

              <line onClick={(e)=>_setHadjust(e,hadjust+1)} x1={x} x2={x} y1={y+8} y2={y+18} style={{stroke:"black", strokeWidth:3}}/> 
              <line onClick={(e)=>_setHadjust(e,hadjust+1)} x1={x} x2={x-5} y1={y+18} y2={y+12} style={{stroke:"black", strokeWidth:2}}/> 
              <line onClick={(e)=>_setHadjust(e,hadjust+1)} x1={x} x2={x+5} y1={y+18} y2={y+12} style={{stroke:"black", strokeWidth:2}}/> 
            </g>

    /*return <div>
              <label>
                Adjust vertical:
                  <input type="text" name="x" value={hadjust} onChange={(e)=>_setHadjust(e.target.value)} />
              </label>
              <label>
                Adjust horizontal:
                  <input type="text" name="y" value={vadjust} onChange={(e)=>_setVadjust(e.target.value)} />
              </label>
              <button onClick={calibrate}>ADJUST</button>
            </div>*/
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
      {showCalibration && <div style={{background: "rgba(255,255,255, 0.5)", position:"absolute", top:0, left:0, width:640, height:360}}>
                <svg onClick={calibrateInput} width="640" height="360">
                  <g>
                     {renderCircles()}
                  </g>

                </svg>
      </div>}
      
      <div>{`h adjust: ${vadjust}`}</div>
      <div>{`v adjust: ${hadjust}`}</div>
      <div>{mode}</div>
      <button onClick={toggleCalibration}>toggle calibration</button>
      <button onClick={saveCalibration}>save calibration</button>

       
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

ON PI 32 Bit:
-------------

This is probably the way to go for now.  The nodejs (node-tfjs) package works of 32 bit, and is ok speedwise.  

npm install --save  @tensorflow/tfjs-node
npm rebuild @tensorflow/tfjs-node --build-from-source

install opencv on pi: https://pimylifeup.com/raspberry-pi-opencv/

export OPENCV_LIB_DIR=/home/tlodge/opencv/build/lib/
npm install --save opencv4nodejs
fisheye: https://jywarren.github.io/fisheyegl/example/#a=0.87&b=1.043&Fx=0.05&Fy=0.1&scale=1.025&x=1.811&y=1

ON PI 64 Bit
------------

@tensorflow/tfjs-node has bindings to c++ so is faster than a non-binding version: @tensorflow/tfjs but @tensorflow/tfjs-node does not install on a 64 bit arm machine (platform unsupported), so we have to use @tensorflow/tfjs (slow and appears to be missing some needed functionality).  So can't get any prediction with node working on 64bit pi.

Looking at the tensorflow/tfjs repo and the subdir: tfjs-node - there is a development.md file that talks about what needs to be done to compile using gcloud - this looks like it works (though failed to copy resulting lib to a bucker so I gave up..)

Reason we use 64 bit is because torch only works on 64 bit machines, which we need to build and run the ultralytics/yolov5 stuff and run the detection on a pi. But since I couldn't get this to run noticeably quicker I'm not sure it's worth the effort.  Other things to note:

The google coral sig-tfjs code that runs out of electron only runs on 64bit machines.  But think this only works for classification; when I tried a model.execute rather than model.predict I'm told this is not supported yet. 

No obvious way to get electron to find the pi camera (only usb connected ones..).  

Other stuff
-----------

from memory I think that the roboflow version provided once a model wa trained seemed to run pretty quickly -- double check this (maybe it was on mac m1 - think it was..!).

Could run client-side and see if that appreciably improves things, but suspect not..



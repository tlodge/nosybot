from flask import Flask, jsonify,request
import cv2
import os
app = Flask(__name__)



@app.route("/")
def bounding_box():
  try:
    args = request.args
    im = cv2.imread(os.path.join('/home/tlodge/nosybot/server/images/', args['p'] + '.jpg'))
    frame_HSV = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    frame_threshold = cv2.inRange(frame_HSV, (0, 0, 101), (180, 255, 255))
    contours, hierarchy = cv2.findContours(frame_threshold,cv2.RETR_LIST,cv2.CHAIN_APPROX_SIMPLE)[-2:]
    
    maxarea = 0
    maxcont = []
    for cnt in contours:
        x,y,w,h = cv2.boundingRect(cnt)
        if (x != 0  and y != 0):
          a = cv2.contourArea( cnt)
          if maxarea < a:
            maxarea = a
            maxcont = cnt

    x,y,w,h = cv2.boundingRect(maxcont)
    print ((x,y,w,h))
    return jsonify({"x":x,"y":y,"w":w,"h":h})
  except:
     return jsonify({"x":0,"y":0,"w":0,"h":0})
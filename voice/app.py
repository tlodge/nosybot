from flask import Flask, jsonify,request
import cv2
import os
import sys
from larynx.constants import InferenceBackend
from concurrent.futures import ThreadPoolExecutor
import io
import subprocess
from larynx.utils import (
    DEFAULT_VOICE_URL_FORMAT,
    VOCODER_DIR_NAMES,
    get_runtime_dir,
    get_voices_dirs,
    valid_voice_dir,
)

import numpy as np
from larynx import text_to_speech
from larynx.wavfile import write as wav_write

app = Flask(__name__)
executor = ThreadPoolExecutor(max_workers=None)


def sayit(words):

    tts_results = text_to_speech(
                text=words,
                voice_or_lang="en",
                vocoder_or_quality="low",
                executor=executor
            )

    for result_idx, result in enumerate(tts_results):
        text = result.text
        with io.BytesIO() as wav_io:
            wav_write(wav_io, result.sample_rate, result.audio)
            wav_data = wav_io.getvalue()
            #with open("output.wav", "wb") as output_file: output_file.write(wav_data)
            try:
                subprocess.run(
                    ['play', '-'],
                    input=wav_data,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=True,
                )
            except FileNotFoundError:
                pass

sayit("I am ready")

@app.route("/say")
def speak():
  try:
    print("seen a say!!")
    words = request.args['words']
    print(words)
    sayit(words)
    return jsonify({"success":True})
  except:
    return jsonify({"success":False})
   

@app.route("/")
def bounding_box():
  try:
    args = request.args
    #im = cv2.imread(os.path.join('/home/tlodge/nosybot/server/images/', args['p'] + '.jpg'))
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
    return jsonify({"x":x+5,"y":y+20,"w":w-5,"h":h-25})
  except:
     return jsonify({"x":0,"y":0,"w":0,"h":0})
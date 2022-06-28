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
      
sayit("this is a test!")
sayit("thankfully this now works")
                    

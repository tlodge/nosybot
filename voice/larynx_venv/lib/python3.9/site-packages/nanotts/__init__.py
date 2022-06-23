import os
import shutil
import logging
import subprocess


MIN_SPEED = 0.2
MAX_SPEED = 5.0
MIN_PITCH = 0.5
MAX_PITCH = 2.0
MIN_VOLUME = 0.0
MAX_VOLUME = 5.0


class NanoTTS():
  def __init__(self, 
               voice=None, 
               outputFile=None, 
               play=False, 
               speed=None, 
               pitch=None, 
               volume=None,
               loglevel=logging.INFO):

    if shutil.which("nanotts") is None:
      raise Exception("Can't find nanotts executable. Make sure to add it to the $PATH.")
    self._path = shutil.which("nanotts")[:-7] 

    self.outputFile = outputFile
    self.play = play
    self.speed = speed
    self.pitch = pitch
    self.volume = volume

    self._voices = self._getVoices()
    self.voice = voice
    
    self._logger = logging.getLogger()
    self.loglevel = loglevel

  def _getCommand(self):
    cmd = ["nanotts", "-l", self._path + "lang"]
    
    if self.voice is not None: 
      cmd.append("--voice")
      cmd.append(self.voice)
    if self.outputFile is not None: 
      cmd.append("-o")
      cmd.append(self.outputFile)
    if self.play: cmd.append("-p")
    if self.speed is not None: 
      cmd.append("--speed")
      cmd.append(str(self.speed))
    if self.pitch is not None: 
      cmd.append("--pitch")
      cmd.append(str(self.pitch))
    if self.volume is not None:
      cmd.append("--volume")
      cmd.append(str(self.volume))

    if not self.play and self.outputFile is None:
      raise Exception("No output method specified. You need to set at least one of 'play' and 'outputFile'.")
    return cmd

  def speak(self, input_file):
    cmd = self._getCommand()
    cmd.append("-f")
    cmd.append(input_file)

    subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

  def speaks(self, text):
    cmd = self._getCommand()
    cmd.append("-i")
    cmd.append(text)

    subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

  @property
  def voice(self):
    return self._voice

  @voice.setter
  def voice(self, voice):
    if voice is not None and not self._voiceAvailable(voice):
      warning = f"Language '{voice:s}' is not available. Select voices from:\n"
      for v in self._voices: warning += f"- {v:s}\n"
      logging.warning(warning)
      try:
        voice = self.voice
      except AttributeError:
        voice = None
    self._voice = voice

  @property
  def speed(self):
    return self._speed

  @speed.setter
  def speed(self, speed):
    self._speed = self._getValidValue(speed, MIN_SPEED, MAX_SPEED, "speed")

  @property
  def pitch(self):
    return self._pitch

  @pitch.setter
  def pitch(self, pitch):
    self._pitch = self._getValidValue(pitch, MIN_PITCH, MAX_PITCH, "pitch")

  @property
  def volume(self):
    return self._volume

  @volume.setter
  def volume(self, volume):
    self._volume = self._getValidValue(volume, MIN_VOLUME, MAX_VOLUME, "volume")
  
  @property
  def outputFile(self):
    return self._outputFile

  @outputFile.setter
  def outputFile(self, outputFile):
    self._outputFile = outputFile
  
  @property
  def play(self):
    return self._play

  @play.setter
  def play(self, play):
    self._play = play
  
  @property
  def loglevel(self):
    return self._loglevel

  @loglevel.setter
  def loglevel(self, loglevel):
    self._loglevel = loglevel
    self._logger.setLevel(self._loglevel)

  def _voiceAvailable(self, voice):
    return voice in self._voices

  def _getVoices(self):
    lang_dir = os.fsencode(self._path + "lang")
    voices = []
    for f in os.listdir(lang_dir):
      filename = os.fsdecode(f)
      if filename.endswith("_ta.bin"):
        voices.append(filename[0:5])
    return voices

  def _getValidValue(self, value, min_value, max_value, value_name):
    if value is None: 
      return None
    
    if value < min_value or value > max_value: 
      logging.warning("Chosen value for %s outside allowed range from %2.1f. to %2.1f.", value_name, min_value, max_value)
      if value < min_value:
        logging.warning("Setting %s to %2.1f.", value_name, min_value)
      else:
        logging.warning("Setting %s to %2.1f.", value_name, max_value)

    return min(max(value, min_value), max_value)

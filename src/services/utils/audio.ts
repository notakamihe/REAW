import { Buffer } from "buffer";

export const audioContext = new AudioContext();

export function audioBufferToBuffer(buffer: AudioBuffer): Buffer {
  var result;

  if (buffer.numberOfChannels === 2)
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  else
    result = buffer.getChannelData(0);

  return Buffer.from(encodeWAV(result, buffer.sampleRate, buffer.numberOfChannels));
}

export function concatAudioBuffer(buffer1: AudioBuffer, buffer2: AudioBuffer): AudioBuffer {
  const numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
  const buffer = audioContext.createBuffer(
    numberOfChannels, 
    buffer1.length + buffer2.length, 
    buffer1.sampleRate
  );
  
  for (let i = 0; i < numberOfChannels; i++) {
    var channel = buffer.getChannelData(i);
    
    channel.set(buffer1.getChannelData(i), 0);
    channel.set(buffer2.getChannelData(i), buffer1.length);
  }
  
  return buffer;
}

export function copyAudioBuffer(buffer: AudioBuffer) {
  const audioContext = new AudioContext();
  const newBuffer = audioContext.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const originalChannelData = buffer.getChannelData(channel);
    const newChannelData = newBuffer.getChannelData(channel);
    newChannelData.set(originalChannelData);
  }

  return newBuffer;
}

function encodeWAV(samples: Float32Array, sampleRate: number, numChannels: number): ArrayBuffer {
  const bitDepth = 32;
  var bytesPerSample = bitDepth / 8;
  var blockAlign = numChannels * bytesPerSample;

  var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  var view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 3, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);
  writeFloat32(view, 44, samples);

  return buffer;
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  var length = inputL.length + inputR.length;
  var result = new Float32Array(length);

  var index = 0;
  var inputIndex = 0;

  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }

  return result;
}

export function reverseAudio(buffer: AudioBuffer) {
  const newBuffer = audioContext.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

  for (let i = 0; i < newBuffer.numberOfChannels; i++) {
    newBuffer.copyToChannel(buffer.getChannelData(i), i);
    newBuffer.getChannelData(i).reverse();
  }

  return newBuffer;
}

function writeFloat32(output: DataView, offset: number, input: Float32Array) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    output.setFloat32(offset, input[i], true)
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
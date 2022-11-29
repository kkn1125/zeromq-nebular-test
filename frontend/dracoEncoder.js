// // import draco3dgltf from "draco3dgltf";
// // console.log(draco3dgltf);
// // dracoEncoder.js

// ("use strict");

// // The global Draco decoder module.
// let decoderModule = null;

// // Creates the Draco decoder module.
// function createDracoDecoderModule() {
//   let dracoDecoderType = {};

//   // Callback when the Draco decoder module is fully instantiated. The
//   // module parameter is the created Draco decoder module.
//   dracoDecoderType["onModuleLoaded"] = function (module) {
//     decoderModule = module;

//     // Download the Draco encoded file and decode.
//     downloadEncodedMesh("bunny.drc");
//   };
//   DracoDecoderModule(dracoDecoderType);
// }

// // Decode an encoded Draco mesh. byteArray is the encoded mesh as
// // an Uint8Array.
// function decodeMesh(byteArray) {
//   // Create the Draco decoder.
//   const decoder = new decoderModule.Decoder();

//   // Create a buffer to hold the encoded data.
//   const buffer = new decoderModule.DecoderBuffer();
//   buffer.Init(byteArray, byteArray.length);

//   // Decode the encoded geometry.
//   let outputGeometry = new decoderModule.Mesh();
//   let decodingStatus = decoder.DecodeBufferToMesh(buffer, outputGeometry);

//   alert("Num points = " + outputGeometry.num_points());

//   // You must explicitly delete objects created from the DracoModule
//   // or Decoder.
//   decoderModule.destroy(outputGeometry);
//   decoderModule.destroy(decoder);
//   decoderModule.destroy(buffer);
// }

// // Download and decode the Draco encoded geometry.
// function downloadEncodedMesh(filename) {
//   // Download the encoded file.
//   const xhr = new XMLHttpRequest();
//   xhr.open("GET", filename, true);
//   xhr.responseType = "arraybuffer";
//   xhr.onload = function (event) {
//     const arrayBuffer = xhr.response;
//     if (arrayBuffer) {
//       const byteArray = new Uint8Array(arrayBuffer);
//       decodeMesh(byteArray);
//     }
//   };
//   xhr.send(null);
// }

// // Create the Draco decoder module.
// createDracoDecoderModule();

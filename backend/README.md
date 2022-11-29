# 실행 방법

```bash
$ npm run dev
# dev:api dev:proxy 동시 실행
```

> 현재 findAll findOne 먼저 테스트 진행하였습니다.

draco_transcoder -i char_old.glb -o char_old-test6.glb -d -b --stats --draco.compressionLevel 10 --draco.quantizePositionBits 20 --draco.quantizeGenericBits 15

gltfpack -i char_old-test6.gltf -o char_old-test7.glb
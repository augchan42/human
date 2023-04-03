/*
  Human
  homepage: <https://github.com/vladmandic/human>
  author: <https://github.com/vladmandic>'
*/

import*as m from"../../dist/human.esm.js";var v=1920,b={debug:!0,backend:"webgl",modelBasePath:"../../models",filter:{enabled:!0,equalization:!1,flip:!1},face:{enabled:!0,detector:{rotation:!1},mesh:{enabled:!0},attention:{enabled:!1},iris:{enabled:!0},description:{enabled:!0},emotion:{enabled:!0},antispoof:{enabled:!0},liveness:{enabled:!0}},body:{enabled:!1},hand:{enabled:!1},object:{enabled:!1},segmentation:{enabled:!1},gesture:{enabled:!0}},e=new m.Human(b);e.env.perfadd=!1;e.draw.options.font='small-caps 18px "Lato"';e.draw.options.lineHeight=20;e.draw.options.drawPoints=!0;var a={video:document.getElementById("video"),canvas:document.getElementById("canvas"),log:document.getElementById("log"),fps:document.getElementById("status"),perf:document.getElementById("performance")},n={detect:0,draw:0,tensors:0,start:0},s={detectFPS:0,drawFPS:0,frames:0,averageMs:0},o=(...t)=>{a.log.innerText+=t.join(" ")+`
`,console.log(...t)},r=t=>a.fps.innerText=t,g=t=>a.perf.innerText="tensors:"+e.tf.memory().numTensors.toString()+" | performance: "+JSON.stringify(t).replace(/"|{|}/g,"").replace(/,/g," | ");async function f(){if(!a.video.paused){n.start===0&&(n.start=e.now()),await e.detect(a.video);let t=e.tf.memory().numTensors;t-n.tensors!==0&&o("allocated tensors:",t-n.tensors),n.tensors=t,s.detectFPS=Math.round(1e3*1e3/(e.now()-n.detect))/1e3,s.frames++,s.averageMs=Math.round(1e3*(e.now()-n.start)/s.frames)/1e3,s.frames%100===0&&!a.video.paused&&o("performance",{...s,tensors:n.tensors})}n.detect=e.now(),requestAnimationFrame(f)}async function w(){var d,i,c;if(!a.video.paused){let l=e.next(e.result),p=await e.image(a.video);e.draw.canvas(p.canvas,a.canvas);let u={bodyLabels:`person confidence [score] and ${(c=(i=(d=e.result)==null?void 0:d.body)==null?void 0:i[0])==null?void 0:c.keypoints.length} keypoints`};await e.draw.all(a.canvas,l,u),g(l.performance)}let t=e.now();s.drawFPS=Math.round(1e3*1e3/(t-n.draw))/1e3,n.draw=t,r(a.video.paused?"paused":`fps: ${s.detectFPS.toFixed(1).padStart(5," ")} detect | ${s.drawFPS.toFixed(1).padStart(5," ")} draw`),setTimeout(w,30)}async function y(){let d=(await e.webcam.enumerate())[0].deviceId;await e.webcam.start({element:a.video,crop:!1,width:v,id:d}),a.canvas.width=e.webcam.width,a.canvas.height=e.webcam.height,a.canvas.onclick=async()=>{e.webcam.paused?await e.webcam.play():e.webcam.pause()}}async function h(){o("human version:",e.version,"| tfjs version:",e.tf.version["tfjs-core"]),o("platform:",e.env.platform,"| agent:",e.env.agent),r("loading..."),await e.load(),o("backend:",e.tf.getBackend(),"| available:",e.env.backends),o("models stats:",e.models.stats()),o("models loaded:",e.models.loaded()),o("environment",e.env),r("initializing..."),await e.warmup(),await y(),await f(),await w()}window.onload=h;
//# sourceMappingURL=index.js.map

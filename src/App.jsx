import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import Music from "./components/Music"
const appWindow = getCurrentWebviewWindow()
let START = 0;


function App() {
  const [customCss, setCustomCss] = useState("");
  const [playing, setPlaying] = useState("");
  const [status, setStatus] = useState("pause");
  const [musics, setMusics] = useState({});
  const [savedMusic, setSavedMusic] = useState({});
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  /** @type {React.MutableRefObject<HTMLAudioElement>} */
  const audioContainer = useRef()

  /** @type {React.MutableRefObject<HTMLSourceElement>} */
  const audioSource = useRef()
  
  /** @type {React.MutableRefObject<HTMLInputElement>} */
  const progress = useRef()
  
  /** @type {React.MutableRefObject<HTMLInputElement>} */
  const volume = useRef()
  /** @type {React.MutableRefObject<HTMLInputElement>} */
  const searchQuery = useRef()

  useEffect(() => {
    if (START == 1) return
    START = 1
    let sus = async () => setCustomCss(await invoke("custom_css"))
    sus()
    if (window.navigator.onLine) {
      fetch(`https://f.imnyang.xyz/NY64_Cover/list?${Date.now()}`).then(res => res.text().then(data => {
        let pAsta = {}
        for (let name of eval(data)) {
          pAsta[name] = {
            image: `https://f.imnyang.xyz/NY64_Cover/Image/${name}.webp?${Date.now()}`,
            cover: `https://f.imnyang.xyz/NY64_Cover/Cover/${name}.mp3?${Date.now()}`
          }
        }
        setMusics(pAsta)
        setPlaying(Object.entries(pAsta)[0][0])
      }));
    }
    setInterval(() => {
      if (window.navigator.onLine) {
        fetch(`https://f.imnyang.xyz/NY64_Cover/list?${Date.now()}`).then(res => res.text().then(data => {
          let pAsta = {}
          for (let name of eval(data)) {
            pAsta[name] = {
              image: `https://f.imnyang.xyz/NY64_Cover/Image/${name}.webp?${Date.now()}`,
              cover: `https://f.imnyang.xyz/NY64_Cover/Cover/${name}.mp3?${Date.now()}`
            }
          } 
          setMusics(pAsta)
        }));
      }
    }, 10000)

    const dbOpen = indexedDB.open("ny-music");
    
    dbOpen.onupgradeneeded = (e) => {
      console.log("onupgradeneeded")
      let db = e.target.result;
      db.createObjectStore('musics', {keyPath: 'name'});
    }

    dbOpen.onsuccess = () => {
      const db = dbOpen.result;
      const transaction = db.transaction(["musics"], "readwrite");
      const musics = transaction.objectStore("musics");
      let request = musics.getAll()
      request.onsuccess = e => {
        let pAsta = {...savedMusic}
        for (let i of e.target.result) {
          pAsta[i.name] = {
            image: URL.createObjectURL(i.image),
            cover: URL.createObjectURL(i.cover)
          }
        }
        setSavedMusic(pAsta)
        if (!window.navigator.onLine) {
          setMusics(pAsta)
          setPlaying(Object.entries(pAsta)[0][0])
        }
      };
    }
    volume.current.value = 100
    progress.current.value = 0
    audioContainer.current.currentTime = 0
  }, [])


  useEffect(() => {
    let interval = setInterval(async () => {
        if (audioContainer.current.paused || String(audioContainer.current.duration) == "NaN") {return}
        let progressPercent = audioContainer.current.currentTime / audioContainer.current.duration * 1000;
        if (String(progressPercent) == "NaN") { 
          progressPercent = 0
        }

        if (!window.navigator.onLine)
          setMusics({...savedMusic})
        progress.current.value = progressPercent
    }, 100)

    audioContainer.current.onended = () => {
      let mode = "normal"
      if (shuffle && repeat) mode = "repeat"
      else if (shuffle) mode = "shuffle"
      else if (repeat) mode = "repeat"
      if (mode == "normal") musicNext()
      if (mode == "shuffle") {
        let keys = [...getKey(musics)]
        setPlaying(keys[(keys.indexOf(playing) + Math.floor(Math.random() * (keys.length-1))) % keys.length])
      }
      progress.current.value = 0
      audioContainer.current.currentTime = 0
      audioContainer.current.play()
    }
    return () => clearInterval(interval)
  }, [musics, shuffle, repeat, playing, savedMusic])

  useEffect(() => {
    if (status == "play") {
      audioContainer.current.play()
      if (decodeURI(audioSource.current.src).split("?")[0] != musics[playing].cover.split("?")[0]) {
        console.log(navigator.mediaSession)
        if ('mediaSession' in navigator) {        
          navigator.mediaSession.metadata = new MediaMetadata({
            title: playing,
            album: "NY Music",
            artwork: [
              { src: musics[playing].image, sizes: '96x96', type: 'image/png' },
              { src: musics[playing].image, sizes: '128x128', type: 'image/png' },
              { src: musics[playing].image, sizes: '192x192', type: 'image/png' },
              { src: musics[playing].image, sizes: '256x256', type: 'image/png' },
              { src: musics[playing].image, sizes: '384x384', type: 'image/png' },
              { src: musics[playing].image, sizes: '512x512', type: 'image/png' },
            ]
          });
          navigator.mediaSession.setActionHandler(
            'nexttrack',
            musicNext
          );
          navigator.mediaSession.setActionHandler(
            'previoustrack',
            musicPrev
          );
          navigator.mediaSession.setActionHandler(
            "pause",
            () => setStatus("pause")
          )
          navigator.mediaSession.setActionHandler(
            "play",
            () => setStatus("play")
          )
          navigator.mediaSession.setActionHandler("seekto", (e) => {
            progress.current.value = e.seekTime*10
            audioContainer.current.currentTime = e.seekTime
          });
        }
      
      
        audioSource.current.src = musics[playing].cover
        audioContainer.current.load()
      }
      audioContainer.current.play()
      invoke('discord_status', {name: playing})
    } else {
      audioContainer.current.pause()
      invoke('discord_status', {name: ""})
    }

  }, [playing, status])


  function musicNext() {
    audioContainer.current.currentTime = 0
    progress.current.value = 0
    let keys = [...getKey(musics)]
    setPlaying(keys[(keys.indexOf(playing) + 1) % keys.length])
  }

  function musicPrev() {
    audioContainer.current.currentTime = 0
    progress.current.value = 0
    let keys = [...getKey(musics)]
    setPlaying(keys[(keys.indexOf(playing) - 1 + keys.length) % keys.length])
  }
  /**
   * 
   * @param {*} element 
   * @returns 
   */
  function getKey(element) {
    return Object.entries(element).map(e => e[0])
  }

  return <main>
      <header></header>
      <style>{customCss}</style>
      <audio id="audioContainer" ref={audioContainer}>
        <source id="audioSource" src="" ref={audioSource}/>
        <source src="https://f.imnyang.xyz/NY64_Cover/ETC/furry.mp3"/>
        Your browser does not support the audio format.
      </audio>

      <div id="music">
        <div>
          <img src={getKey(musics).indexOf(playing) != -1? musics[playing].image: "idk"} /> 
          <h1>{playing}</h1>
        </div>
        <div>
          <input type="range" min="0" max="100" ref={volume} onChange={() => {audioContainer.current.volume = volume.current.value/100}}/>
        </div>
      </div>
      <div id="greet">
        <input type="text" id="search" placeholder="search..." ref={searchQuery} onInput={() => setMusics({...musics})}/>
        <div id="musics">
          {Object.entries(musics).map((musicEntry, i) => {
            let q = searchQuery.current.value.replace(/ /gim, "").toLowerCase();
            /** @type {String} */
            let test_name = musicEntry[0].replace(/ /gim, "").toLowerCase();
            if (test_name.includes(q)) {
              return <Music key={i} musicEntry={musicEntry} q={q} playing={playing} savedMusic={[savedMusic, setSavedMusic]} onClick={(name) => {
                audioContainer.current.currentTime = 0
                progress.current.value = 0
                setPlaying(name)
              }}/>
            }
            return null
          })}
        </div>
      </div>
      <div id="bar">
        <input type="range" min="0" max="1000" ref={progress} onChange={e => {
          if (decodeURI(audioSource.current.src).split("?")[0] != musics[playing].cover.split("?")[0]) {
            let date = Date.now();
            navigator.mediaSession.metadata = new MediaMetadata({
              title: playing,
              album: "NY Music",
              artwork: [
                { src: musics[playing].image, sizes: '96x96', type: 'image/png' },
                { src: musics[playing].image, sizes: '128x128', type: 'image/png' },
                { src: musics[playing].image, sizes: '192x192', type: 'image/png' },
                { src: musics[playing].image, sizes: '256x256', type: 'image/png' },
                { src: musics[playing].image, sizes: '384x384', type: 'image/png' },
                { src: musics[playing].image, sizes: '512x512', type: 'image/png' },
              ]
            });
            audioSource.current.src = musics[playing].cover
            audioContainer.current.load()
            audioContainer.current.onloadedmetadata = () => {
              audioContainer.current.currentTime = audioContainer.current.duration * Number(e.target.value)/1000
            }
            return
          }
          let time = audioContainer.current.duration * Number(e.target.value)/1000;
          audioContainer.current.currentTime = time
        }}/>
        <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" onClick={() => {
          setShuffle(!shuffle)
        }}>
          <path
            fill={shuffle?"var(--primary)":"#fff"}
            d="M403.8 34.4c12-5 25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9S384 204.8 384 191.8V160h-32c-10.1 0-19.6 4.7-25.6 12.8L284 229.3 244 176l31.2-41.6C293.3 110.2 321.8 96 352 96h32V64c0-12.9 7.8-24.6 19.8-29.6zM164 282.7l40 53.3-31.2 41.6C154.7 401.8 126.2 416 96 416H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h64c10.1 0 19.6-4.7 25.6-12.8l42.4-56.5zm274.6 188c-9.2 9.2-22.9 11.9-34.9 6.9S383.9 461 383.9 448v-32H352c-30.2 0-58.7-14.2-76.8-38.4L121.6 172.8c-6-8.1-15.5-12.8-25.6-12.8H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h64c30.2 0 58.7 14.2 76.8 38.4l153.6 204.8c6 8.1 15.5 12.8 25.6 12.8h32v-32c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64z"
          />
        </svg>

          <img className="rev-x" src="skip.svg" alt=">>" onClick={musicPrev}/>
          <img id="status-change" src={status=="play"? "pause.svg":"play.svg"} alt={status=="play"? "||":"|>"} onClick={() => setStatus(status=="play"?"pause":"play")}/>
          <img src="skip.svg" alt=">>" onClick={musicNext}/>
          {
            repeat?
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 512 512"
                onClick={() => {
                  setRepeat(false)
                }}
              >
                <g fill="var(--primary)" clipPath="url(#a)">
                  <path d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96h160v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32v32H160C71.6 64 0 135.6 0 224Zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192v-32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448h160c88.4 0 160-71.6 160-160Z" />
                  <path d="M266.438 191.692c0-3.941-2.171-7.548-5.645-9.419a10.594 10.594 0 0 0-10.955.535l-32.062 21.375c-4.943 3.273-6.246 9.886-2.972 14.828 3.273 4.943 9.919 6.246 14.828 2.973l15.43-10.32v97.59h-21.374A10.676 10.676 0 0 0 213 319.942a10.676 10.676 0 0 0 10.688 10.687h64.124a10.676 10.676 0 0 0 10.688-10.687 10.676 10.676 0 0 0-10.688-10.688h-21.374V191.692Z" />
                </g>
                <defs>
                  <clipPath id="a">
                    <path fill="#fff" d="M0 0h512v512H0z" />
                  </clipPath>
                </defs>
              </svg> :
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" onClick={() => {
                  setRepeat(true)
                }}>
                <path
                  fill="#fff"
                  d="M0 224c0 17.7 14.3 32 32 32s32-14.3 32-32c0-53 43-96 96-96h160v32c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l64-64c12.5-12.5 12.5-32.8 0-45.3l-64-64c-9.2-9.2-22.9-11.9-34.9-6.9S320 19.1 320 32v32H160C71.6 64 0 135.6 0 224zm512 64c0-17.7-14.3-32-32-32s-32 14.3-32 32c0 53-43 96-96 96H192v-32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9l-64 64c-12.5 12.5-12.5 32.8 0 45.3l64 64c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6V448h160c88.4 0 160-71.6 160-160z"
                />
              </svg>
          }
        </div>
      </div>
    </main>;
}

export default App;

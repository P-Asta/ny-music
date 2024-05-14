import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from '@tauri-apps/api/tauri'
import { appWindow } from "@tauri-apps/api/window";
import Music from "./components/Music"
let START = 0;


function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [playing, setPlaying] = useState("Cloudless");
  const [status, setStatus] = useState("pause");
  const [musics, setMusics] = useState([]);
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

    fetch(`https://fback.imnyang.xyz//NY64_Cover/list?${Date.now()}`).then(res => res.text().then(data => {
      setMusics(eval(data))
    }));
    setInterval(() => {
      fetch(`https://fback.imnyang.xyz//NY64_Cover/list?${Date.now()}`).then(res => res.text().then(data => {
        setMusics(eval(data))
      }));
    }, 10000)
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
        progress.current.value = progressPercent
    }, 100)

    audioContainer.current.onended = () => {
      console.log("ended")
      if (audioContainer.current.ended) {
        let mode = "normal"
        if (shuffle && repeat) mode = "repeat"
        else if (shuffle) mode = "shuffle"
        else if (repeat) mode = "repeat"

        if (mode == "normal") musicNext()
        if (mode == "shuffle") {
          setPlaying(musics[(musics.indexOf(playing) + Math.floor(Math.random() * (musics.length-1))) % musics.length])
        }
        progress.current.value = 0
        audioContainer.current.currentTime = 0
      }
    }
    return () => clearInterval(interval)
  }, [musics, shuffle, repeat, playing])

  useEffect(() => {
    if (status == "play") {
      audioContainer.current.play()
      if (!decodeURI(audioSource.current.src).startsWith(`https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3`)) {
        let date = Date.now();
        navigator.mediaSession.metadata = new MediaMetadata({
          title: playing,
          album: "NY Music",
          artwork: [
            { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '96x96', type: 'image/png' },
            { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '128x128', type: 'image/png' },
            { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '192x192', type: 'image/png' },
            { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '256x256', type: 'image/png' },
            { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '384x384', type: 'image/png' },
            { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '512x512', type: 'image/png' },
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
        navigator.mediaSession.setActionHandler("seekto", (e) => {
          progress.current.value = e.seekTime*10
          audioContainer.current.currentTime = e.seekTime
        });
      

      
        audioSource.current.src = `https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3?${date}`
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
    setPlaying(musics[(musics.indexOf(playing) + 1) % musics.length])
  }

  function musicPrev() {
    audioContainer.current.currentTime = 0
    progress.current.value = 0
    setPlaying(musics[(musics.indexOf(playing) - 1 + musics.length) % musics.length])
  }

  return <main>
      <audio id="audioContainer" ref={audioContainer}>
        <source id="audioSource" src="" ref={audioSource}/>
        <source src="https://fback.imnyang.xyz//NY64_Cover/Cover/Bad Apple.mp3"/>
        Your browser does not support the audio format.
      </audio>

      <div id="music">
        <div>
          <img src={`https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg`} /> {playing}
        </div>
        <div>
          <input type="range" min="0" max="100" ref={volume} onChange={() => {audioContainer.current.volume = volume.current.value/100}}/>
        </div>
      </div>
      <div id="greet">
        <input type="text" id="search" placeholder="search..." ref={searchQuery} onInput={() => setMusics([...musics])}/>
        <div id="musics">
          {musics.map((name, i) => {
            let q = searchQuery.current.value.replace(/ /gim, "").toLowerCase();
            
            /** @type {String} */
            let test_name = name.replace(/ /gim, "").toLowerCase();
            if (test_name.includes(q)) {
              return <Music key={i} name={name} q={q} onClick={(name) => {
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
          if (!decodeURI(audioSource.current.src).startsWith(`https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3`)) {
            let date = Date.now();
            navigator.mediaSession.metadata = new MediaMetadata({
              title: playing,
              album: "NY Music",
              artwork: [
                { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '96x96', type: 'image/png' },
                { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '128x128', type: 'image/png' },
                { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '192x192', type: 'image/png' },
                { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '256x256', type: 'image/png' },
                { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '384x384', type: 'image/png' },
                { src: `https://fback.imnyang.xyz//NY64_Cover/Image/${playing}.jpg?${date}`, sizes: '512x512', type: 'image/png' },
              ]
            });
            audioSource.current.src = `https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3?${date}`
            audioContainer.current.load()
            audioContainer.current.onloadedmetadata = () => {
              audioContainer.current.currentTime = audioContainer.current.duration * Number(e.target.value)/1000
              console.log(audioContainer.current.duration, Number(e.target.value))
            }
            return
          }
          let time = audioContainer.current.duration * Number(e.target.value)/1000;
          console.log(time)
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

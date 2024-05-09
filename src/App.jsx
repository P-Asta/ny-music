import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import "./App.css";
import Music from "./components/Music"
let PLAYING = "Cloudless"


function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [playing, setPlaying] = useState("Cloudless");
  const [status, setStatus] = useState("pause");
  const [musics, setMusics] = useState([]);
  /** @type {React.MutableRefObject<HTMLAudioElement>} */
  const audioContainer = useRef()

  /** @type {React.MutableRefObject<HTMLSourceElement>} */
  const audioSource = useRef()
  
  /** @type {React.MutableRefObject<HTMLInputElement>} */
  const progress = useRef()
  
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/5-23/ny-music/main/music_info/list").then(res => res.text().then(data => {setMusics(eval(data))}));
    progress.current.value = 0
    audioContainer.current.currentTime = 0
  }, [])


  useEffect(() => {
    if (musics.length == 0) return
    setInterval(async () => {
        let overPlay = progress.current.value - audioContainer.current.currentTime / audioContainer.current.duration * 1000;
        if (String(overPlay) == "NaN") overPlay = 0
        if (await appWindow.isFocused() && (overPlay > 2 || overPlay < -1)) {
          audioContainer.current.currentTime = progress.current.value / 1000 * audioContainer.current.duration
        }else {
          let progressPercent = audioContainer.current.currentTime / audioContainer.current.duration * 1000;
          if (String(progressPercent) == "NaN") progressPercent = 0
          progress.current.value = progressPercent
          if (progressPercent == 1000) {
            musicNext()
            progress.current.value = 0
            audioContainer.current.currentTime = 0
          }
        }
    }, 100)
  }, [musics])

  useEffect(() => {
    if (status == "play") {
      if (audioSource.current.src != `https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3`) {
        progress.current.value = 0
        audioSource.current.src = `https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3`
        audioContainer.current.load()
      }
      audioContainer.current.play()
    } else {
      audioContainer.current.pause()
    }
  }, [playing, status])


  function musicNext() {
    PLAYING = musics[(musics.indexOf(PLAYING) + 1) % musics.length]
    setPlaying(PLAYING)
  }

  function musicPrev() {
    PLAYING = musics[(musics.indexOf(PLAYING) - 1 + musics.length) % musics.length]
    setPlaying(PLAYING)
  }

  return <main>
      <audio id="audioContainer" ref={audioContainer}>
        <source id="audioSource" src="" ref={audioSource}/>
        Your browser does not support the audio format.
      </audio>

      <div id="music">
        <img src={`https://github.com/5-23/ny-music/blob/main/music_info/${playing}/cover.png?raw=true`} /> {playing}
      </div>
      <div id="musics">
        {musics.map((name, _) => {
          return <Music name={name} onClick={(name) => {
            setPlaying(name)
            PLAYING = name
          }}/>
        })}
      </div>
      <div id="bar">
        <input type="range" min="0" max="1000" ref={progress}/>
        <div>

          <img className="rev-x" src="skip.svg" alt=">>" onClick={musicPrev}/>
          <img id="status-change" src={status=="play"? "pause.svg":"play.svg"} alt={status=="play"? "||":"|>"} onClick={() => setStatus(status=="play"?"pause":"play")}/>
          <img src="skip.svg" alt=">>" onClick={musicNext}/>
        
        </div>
      </div>
    </main>;
}

export default App;

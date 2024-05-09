import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import "./App.css";
import Music from "./components/Music"

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
    setInterval(async () => {
      if (!audioContainer.current.paused) {
        if (await appWindow.isFocused() && (progress.current.value - audioContainer.current.currentTime / audioContainer.current.duration * 1000 > 2 || progress.current.value - audioContainer.current.currentTime / audioContainer.current.duration * 1000 < -1)) {
          console.log(progress.current.value - audioContainer.current.currentTime / audioContainer.current.duration * 1000)
          audioContainer.current.currentTime = progress.current.value / 1000 * audioContainer.current.duration
        }
        progress.current.value = audioContainer.current.currentTime / audioContainer.current.duration * 1000
      }
      
    }, 10)
  }, [])


  useEffect(() => {
    if (status == "play") {
      if (audioSource.current.src != `https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3`) {
        audioSource.current.src = `https://fback.imnyang.xyz//NY64_Cover/Cover/${playing}.mp3`
        audioContainer.current.load()
        progress.current.value = 0
      }
      audioContainer.current.play()
    } else {
      audioContainer.current.pause()
    }
  }, [playing, status])


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
          return <Music name={name} setPlaying={setPlaying}/>
        })}
      </div>
      <div id="bar">
        <input type="range" min="0" max="1000" ref={progress} />
        <div>

          <img className="rev-x" src="skip.svg" alt="<<"/>
          {
            
          }
          <img id="status-change" src={status=="play"? "pause.svg":"play.svg"} alt={status=="play"? "||":"|>"} onClick={() => setStatus(status=="play"?"pause":"play")}/>
          <img src="skip.svg" alt=">>"/>
        
        </div>
      </div>
    </main>;
}

export default App;

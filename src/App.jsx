import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [musics, setMusics] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/5-23/ny-music/main/index.html?token=GHSAT0AAAAAACQWKZCAIL7Z336QM6P4VM72ZR2YTRQ").then(res => res.text().then(data => {setMusics(data)}));
  })

  return (
    <div className="container">
      ${musics}
    </div>
  );
}

export default App;

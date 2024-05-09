export default function Music({name, onClick}) {
    return <div className="music" onClick={() => onClick(name)}>
        <img src={`https://github.com/5-23/ny-music/blob/main/music_info/${name}/cover.png?raw=true`} /> {name}
    </div>
}
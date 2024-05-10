export default function Music({name, onClick}) {
    return <div className="music" onClick={() => onClick(name)}>
        <img src={`https://fback.imnyang.xyz//NY64_Cover/Image/${name}.jpg`} /> {name}
    </div>
}
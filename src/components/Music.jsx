export default function Music({name, onClick, q}) {
    
    let pattern = q.split('').join('\\s*');
    let regex = new RegExp(pattern, 'gi');
    let wrappedName = name.replace(regex, match => `<b>${match}</b>`);
    if (q == "") {
        wrappedName = name;
    }

    return <div className="music" q={q} onClick={() => onClick(name)}>
        <img src={`https://fback.imnyang.xyz//NY64_Cover/Image/${name}.jpg`} />
        <span dangerouslySetInnerHTML={{ __html: wrappedName }} />

    </div>
}
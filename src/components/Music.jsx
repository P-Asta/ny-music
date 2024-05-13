export default function Music({name, onClick, q}) {
    let wrappedName = name.replace(new RegExp(q, 'gi'), match => `<b>${match}</b>`);
    if (q == "") {
        wrappedName = name;
    }

    return <div className="music" q={q} onClick={() => onClick(name)}>
        <img src={`https://fback.imnyang.xyz//NY64_Cover/Image/${name}.jpg`} />
        <span dangerouslySetInnerHTML={{ __html: wrappedName }} />

    </div>
}
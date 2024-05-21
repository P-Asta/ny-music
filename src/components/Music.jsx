export default function Music({musicEntry, onClick, q, playing, savedMusic}) {
	let [name, music] = musicEntry;
	var [savedMusic, setSavedMusic] = savedMusic
	
	let pattern = q.split('').join('\\s*');
	let regex = new RegExp(pattern, 'gi');
	let wrappedName = name.replace(regex, match => `<b>${match}</b>`);
	
	if (q == "") {
		wrappedName = name;
	}
	if (name == playing)
		wrappedName = `<p>${wrappedName}</p>`;

	return <div className="music" q={q}>
		<div onClick={() => {onClick(name)}}>
			<img src={music.image} />
			<span dangerouslySetInnerHTML={{ __html: wrappedName }} />
		</div>

		{
				Object.entries(savedMusic).map(e => e[0]).indexOf(name) != -1? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" onClick={() => {
					const dbOpen = indexedDB.open("ny-music");
					dbOpen.onsuccess = () => {
						const db = dbOpen.result;
						/** @type {IDBTransaction} */
						
						const transaction = db.transaction(["musics"], "readwrite");
						const musics = transaction.objectStore("musics");
						const request = musics.delete(name);

						let pAsta = {...savedMusic}
						delete pAsta[name]
						setSavedMusic(pAsta);
				
						request.onsuccess = e => {
							console.log("success");
						};

					};
				}}>
					<path fill="var(--primary)" d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zm113-303L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
				</svg>:
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" onClick={() => {
					const dbOpen = indexedDB.open("ny-music");

					dbOpen.onsuccess = () => {
						const db = dbOpen.result;
						/** @type {IDBTransaction} */
						// const transaction = db.transaction("musics", "readwrite");
						// const musics = transaction.objectStore("musics");
						fetch(`https://f.imnyang.xyz/NY64_Cover/Cover/${name}.mp3`)
							.then(res => res.blob())
							.then(cover => {
								fetch(`https://f.imnyang.xyz/NY64_Cover/Image/${name}.webp`)
									.then(res => res.blob())
									.then(image => {
										const transaction = db.transaction(["musics"], "readwrite");
										const musics = transaction.objectStore("musics");
										const request = musics.put({
											name: name,
											cover: cover,
											image: image,
										});

										let pAsta = {...savedMusic}
										pAsta[name] = {
											image: URL.createObjectURL(image),
											cover: URL.createObjectURL(cover)
										}
										setSavedMusic(pAsta);
								
										request.onsuccess = e => {
											console.log("success");
										};
									})
							}).catch(error => {
							console.error('Error:', error);
						});

					};
				}}>
					<path fill="var(--gray)" d="M256 0a256 256 0 1 0 0 512 256 256 0 1 0 0-512zM127 281c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l71 71L232 136c0-13.3 10.7-24 24-24s24 10.7 24 24v182.1l71-71c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9L273 393c-9.4 9.4-24.6 9.4-33.9 0L127 281z" />
				</svg>
		}

			

	</div>
}
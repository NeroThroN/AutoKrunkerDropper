class Streamer {
    constructor(name, progress=0, active=false, ban=false) {
        this.name = name;
        this.progress = progress;
        this.active = active;
        this.ban = ban;
    }

    show() { console.log(` - ${this.name} (${this.progress} %)`) }
}

class Streamers {
    constructor(list=new Array()) { this.list = list; }

    add(streamer) { this.list.push(streamer)}

    active() { return this.list.filter(streamer => streamer.active) }
    toWatch() { return this.active().filter(streamer => !streamer.ban).sort((strA, strB) => strB.progress - strA.progress) }
    names() { return this.list.map(streamer => streamer.name) }
    banNames() { return this.list.filter(streamer => streamer.ban).map(streamer => streamer.name) }

    setActive(activeStreamer) {
        if (this.names().includes(activeStreamer)) {
            this.list.forEach((streamer) => { if (streamer.name == activeStreamer) { streamer.active = true }})
        } else this.add(new Streamer(activeStreamer, 0, true))
    }

    setBan(streamers) { this.list.forEach((streamer) => { streamer.ban = streamers.includes(streamer.name) })}
    show() { this.toWatch().forEach(streamer => streamer.show()) }
}
 
export { Streamer, Streamers }
class Streamer {
    constructor(name, progress=0, active=false, ban=false, priority=false) {
        this.name = name;
        this.progress = progress;
        this.active = active;
        this.ban = ban;
        this.priority = priority
    }

    show(color="\x1b[37m") { console.log(color, ` - ${this.name} (${this.progress} %)`) }
}

class Streamers {
    constructor(list=new Array()) { this.list = list; }

    add(streamer) { this.list.push(streamer)}

    active() { return this.list.filter(streamer => streamer.active) }
    toWatch() { return this.active().filter(streamer => !streamer.ban && !streamer.priority).sort((strA, strB) => strB.progress - strA.progress) }
    toWatchPriority() { return this.active().filter(streamer => !streamer.ban && streamer.priority).sort((strA, strB) => strB.progress - strA.progress) }
    names() { return this.list.map(streamer => streamer.name) }
    banNames() { return this.list.filter(streamer => streamer.ban).map(streamer => streamer.name) }

    setActive(activeStreamer) {
        if (this.names().includes(activeStreamer)) {
            this.list.forEach((streamer) => { if (streamer.name == activeStreamer) { streamer.active = true }})
        } else this.add(new Streamer(activeStreamer, 0, true))
    }
    
    setPriority(streamers) { this.list.forEach((streamer) => { streamer.priority = streamers.includes(streamer.name) })}
    setBan(streamers) { this.list.forEach((streamer) => { streamer.ban = streamers.includes(streamer.name) })}
    show() {
        this.toWatchPriority().forEach(streamer => streamer.show("\x1b[36m"))
        this.toWatch().forEach(streamer => streamer.show())
    }
}
 
export { Streamer, Streamers }
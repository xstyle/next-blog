import { useState, useEffect, useRef } from "react"
import WebRtcStreamer from './webrtcstreamer'

export default function RtstpVideo(props) {
    const ref = useRef(null)
    const [webRtcStreamer, setWebRtcStreamer] = useState(null)
    useEffect(() => {
        console.log('use effect work!' + JSON.stringify(props))
        const streamer = new WebRtcStreamer(ref.current, props.WEBRTC_SERVER)
        setWebRtcStreamer(streamer)
        streamer.connect(props.src, null, `rtptransport=tcp&timeout=60&width=${props.width | 320 }&height=${props.height | 240}`)
    }, [props.src, props.WEBRTC_SERVER])

    return <>
        <video ref={ref} autoPlay />
        <style jsx>{`
            video {
                max-width: 100%;
            }
        `}</style>
    </>
}